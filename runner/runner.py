"""OpenClaw Fleet Runner - Daemon for executing jobs locally.

This daemon runs on each machine and connects to the control plane
to receive and execute jobs.
"""

import asyncio
import hashlib
import json
import logging
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

import httpx
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentConfig:
    """Configuration for a single agent."""
    
    def __init__(self, data: dict):
        self.id = data.get('id') or str(uuid.uuid4())
        self.name = data['name']
        self.model = data.get('model', 'default')
        self.tags = data.get('tags', [])
        self.tools = data.get('tools', [])
        self.max_concurrency = data.get('max_concurrency', 1)
        self.workspace_path = data.get('workspace_path', '/tmp/openclaw-workspace')
        self.env_vars = data.get('env_vars', {})


class RunnerConfig:
    """Runner configuration loaded from YAML."""
    
    def __init__(self, config_path: str):
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
        
        self.control_plane_url = data['control_plane_url']
        self.token = data['runner_token']
        self.heartbeat_interval = data.get('heartbeat_interval', 30)
        self.labels = data.get('labels', {})
        self.agents = [AgentConfig(a) for a in data.get('agents', [])]
        
        # Runtime info
        self.hostname = os.uname().nodename
        self.os = sys.platform
        self.arch = os.uname().machine
        self.version = "0.1.0"


class JobExecutor:
    """Executes a job locally."""
    
    def __init__(self, agent: AgentConfig, run_id: str, job_data: dict):
        self.agent = agent
        self.run_id = run_id
        self.job_data = job_data
        self.process: Optional[subprocess.Popen] = None
        self.events: List[dict] = []
        self.artifacts: List[dict] = []
    
    async def execute(self) -> dict:
        """Execute the job and return the result."""
        start_time = datetime.utcnow()
        
        # Emit start event
        self._add_event('run_started', {'agent': self.agent.name, 'model': self.agent.model})
        
        try:
            # Create workspace
            workspace = Path(self.agent.workspace_path) / self.run_id
            workspace.mkdir(parents=True, exist_ok=True)
            
            # Get job payload
            payload = self.job_data.get('payload', {})
            
            # Check if this is an OpenClaw task or a simple command
            task_type = payload.get('type', 'command')
            
            if task_type == 'openclaw':
                result = await self._execute_openclaw(payload, workspace)
            else:
                result = await self._execute_command(payload, workspace)
            
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            self._add_event('run_finished', {
                'status': result['status'],
                'duration_seconds': duration,
                **result.get('summary', {})
            })
            
            return {
                'status': result['status'],
                'exit_code': result.get('exit_code', 0 if result['status'] == 'succeeded' else 1),
                'summary': {
                    'duration_seconds': duration,
                    'workspace': str(workspace),
                    **result.get('summary', {})
                }
            }
            
        except Exception as e:
            logger.exception(f"Job execution failed: {e}")
            self._add_event('error', {'error': str(e)})
            self._add_event('run_finished', {'status': 'failed', 'error': str(e)})
            
            return {
                'status': 'failed',
                'exit_code': -1,
                'summary': {'error': str(e)}
            }
    
    async def _execute_openclaw(self, payload: dict, workspace: Path) -> dict:
        """Execute an OpenClaw agent task."""
        # Build OpenClaw command
        prompt = payload.get('prompt', '')
        model = payload.get('model', self.agent.model)
        
        # Check if openclaw CLI is available
        openclaw_cmd = payload.get('openclaw_cmd', 'openclaw')
        
        command = [
            openclaw_cmd,
            'run',
            '--model', model,
            '--output-format', 'json'
        ]
        
        # Add any additional arguments
        if payload.get('thinking'):
            command.extend(['--thinking', payload['thinking']])
        if payload.get('tools'):
            command.extend(['--tools', ','.join(payload['tools'])])
        
        # Create a temporary file for the prompt
        prompt_file = workspace / 'prompt.txt'
        prompt_file.write_text(prompt)
        
        # Set up environment
        env = os.environ.copy()
        env.update(self.agent.env_vars)
        env['OPENCLAW_RUN_ID'] = self.run_id
        env['OPENCLAW_WORKSPACE'] = str(workspace)
        
        logger.info(f"Starting OpenClaw job {self.run_id}: {' '.join(command)}")
        
        # Run OpenClaw with prompt file
        self.process = subprocess.Popen(
            command + [str(prompt_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(workspace),
            env=env,
            text=True,
            bufsize=1
        )
        
        # Stream output
        stdout_buffer = []
        stderr_buffer = []
        
        async def read_stdout():
            while True:
                line = await asyncio.get_event_loop().run_in_executor(None, self.process.stdout.readline)
                if not line:
                    break
                stdout_buffer.append(line)
                self._add_event('stdout', {'message': line.rstrip()})
        
        async def read_stderr():
            while True:
                line = await asyncio.get_event_loop().run_in_executor(None, self.process.stderr.readline)
                if not line:
                    break
                stderr_buffer.append(line)
                self._add_event('stderr', {'message': line.rstrip()})
        
        await asyncio.gather(read_stdout(), read_stderr())
        
        # Wait for completion
        exit_code = await asyncio.get_event_loop().run_in_executor(None, self.process.wait)
        
        # Parse output if JSON
        output = ''.join(stdout_buffer)
        try:
            result_data = json.loads(output)
        except json.JSONDecodeError:
            result_data = {'raw_output': output}
        
        status = 'succeeded' if exit_code == 0 else 'failed'
        
        return {
            'status': status,
            'exit_code': exit_code,
            'summary': {
                'result': result_data,
                'stderr': ''.join(stderr_buffer) if stderr_buffer else None
            }
        }
    
    async def _execute_command(self, payload: dict, workspace: Path) -> dict:
        """Execute a shell command."""
        command = payload.get('command', ['echo', 'No command specified'])
        
        if isinstance(command, str):
            command = ['/bin/sh', '-c', command]
        
        # Set environment
        env = os.environ.copy()
        env.update(self.agent.env_vars)
        env['OPENCLAW_RUN_ID'] = self.run_id
        env['OPENCLAW_WORKSPACE'] = str(workspace)
        
        logger.info(f"Starting command job {self.run_id}: {' '.join(command)}")
        
        self.process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(workspace),
            env=env,
            text=True,
            bufsize=1
        )
        
        # Stream output
        stdout_task = asyncio.create_task(self._read_stream(self.process.stdout, 'stdout'))
        stderr_task = asyncio.create_task(self._read_stream(self.process.stderr, 'stderr'))
        
        # Wait for completion
        exit_code = await asyncio.get_event_loop().run_in_executor(None, self.process.wait)
        await asyncio.gather(stdout_task, stderr_task)
        
        status = 'succeeded' if exit_code == 0 else 'failed'
        
        return {
            'status': status,
            'exit_code': exit_code,
            'summary': {'command': command}
        }
    
    async def _read_stream(self, stream, stream_type: str):
        """Read from stdout/stderr and emit events."""
        while True:
            line = await asyncio.get_event_loop().run_in_executor(None, stream.readline)
            if not line:
                break
            
            message = line.rstrip('\n')
            self._add_event(stream_type, {'message': message})
    
    def _add_event(self, event_type: str, data: dict):
        """Add an event to the buffer."""
        self.events.append({
            'type': event_type,
            'data': data,
            'ts': datetime.utcnow().isoformat()
        })


class RunnerDaemon:
    """Main runner daemon that connects to control plane."""
    
    def __init__(self, config: RunnerConfig):
        self.config = config
        self.machine_id: Optional[str] = None
        self.lease_id: Optional[str] = None
        self.current_job: Optional[dict] = None
        self.current_run_id: Optional[str] = None
        self.executor: Optional[JobExecutor] = None
        self.running = False
        
        # Agent status tracking
        self.agent_statuses: Dict[str, str] = {
            a.id: 'idle' for a in config.agents
        }
    
    async def start(self):
        """Start the runner daemon."""
        logger.info(f"Starting OpenClaw Fleet Runner v{self.config.version}")
        logger.info(f"Connecting to: {self.config.control_plane_url}")
        
        self.running = True
        
        # Register with control plane
        await self.register()
        
        # Start main loop
        await self.run_loop()
    
    async def register(self):
        """Register this machine with the control plane."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.config.control_plane_url}/runner/register",
                headers={'X-Runner-Token': self.config.token},
                json={
                    'hostname': self.config.hostname,
                    'os': self.config.os,
                    'arch': self.config.arch,
                    'labels': self.config.labels,
                    'runner_version': self.config.version,
                    'agents': [
                        {
                            'name': a.name,
                            'model': a.model,
                            'tags': a.tags,
                            'tools': a.tools,
                            'max_concurrency': a.max_concurrency
                        }
                        for a in self.config.agents
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            self.machine_id = data['machine_id']
            logger.info(f"Registered as machine: {self.machine_id}")
    
    async def run_loop(self):
        """Main execution loop."""
        while self.running:
            try:
                # Send heartbeat
                await self.heartbeat()
                
                # Poll for jobs if not busy
                if not self.current_job:
                    await self.poll_jobs()
                
                # Renew lease if we have a job
                if self.lease_id:
                    await self.renew_lease()
                
                await asyncio.sleep(self.config.heartbeat_interval)
                
            except Exception as e:
                logger.exception(f"Error in run loop: {e}")
                await asyncio.sleep(5)
    
    async def heartbeat(self):
        """Send heartbeat to control plane."""
        if not self.machine_id:
            return
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{self.config.control_plane_url}/runner/heartbeat",
                    headers={'X-Runner-Token': self.config.token},
                    params={'machine_id': self.machine_id}
                )
        except Exception as e:
            logger.warning(f"Heartbeat failed: {e}")
    
    async def poll_jobs(self):
        """Poll for available jobs."""
        if not self.machine_id:
            return
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.config.control_plane_url}/runner/poll",
                    headers={'X-Runner-Token': self.config.token},
                    json={
                        'machine_id': self.machine_id,
                        'agent_statuses': self.agent_statuses,
                        'capabilities': {
                            'agents': len(self.config.agents),
                            'version': self.config.version
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data['jobs']:
                    job_offer = data['jobs'][0]
                    logger.info(f"Received job offer: {job_offer['job_id']}")
                    await self.lease_job(job_offer)
        except Exception as e:
            logger.warning(f"Poll failed: {e}")
    
    async def lease_job(self, job_offer: dict):
        """Lease a job from the control plane."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.config.control_plane_url}/runner/lease",
                    headers={'X-Runner-Token': self.config.token},
                    json={
                        'machine_id': self.machine_id,
                        'agent_id': job_offer['agent_id'],
                        'job_id': job_offer['job_id']
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                self.lease_id = data['lease_id']
                self.current_run_id = data['run_id']
                self.current_job = job_offer
                self.agent_statuses[job_offer['agent_id']] = 'busy'
                
                logger.info(f"Leased job {job_offer['job_id']}, run: {self.current_run_id}")
                
                # Start execution
                asyncio.create_task(self.execute_job(job_offer))
        except Exception as e:
            logger.error(f"Failed to lease job: {e}")
    
    async def renew_lease(self):
        """Renew the current lease."""
        if not self.lease_id:
            return
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{self.config.control_plane_url}/runner/lease/renew",
                    headers={'X-Runner-Token': self.config.token},
                    json={'lease_id': self.lease_id}
                )
        except Exception as e:
            logger.warning(f"Failed to renew lease: {e}")
    
    async def execute_job(self, job_offer: dict):
        """Execute a job and report results."""
        agent_id = job_offer['agent_id']
        agent = next((a for a in self.config.agents if a.id == agent_id), None)
        
        if not agent:
            logger.error(f"Agent {agent_id} not found")
            return
        
        # Create executor
        self.executor = JobExecutor(agent, self.current_run_id, job_offer)
        
        # Execute
        result = await self.executor.execute()
        
        # Send events
        await self.send_events()
        
        # Complete job
        await self.complete_job(result)
        
        # Clear state
        self.agent_statuses[agent_id] = 'idle'
        self.lease_id = None
        self.current_job = None
        self.current_run_id = None
        self.executor = None
    
    async def send_events(self):
        """Send buffered events to control plane."""
        if not self.executor or not self.executor.events:
            return
        
        events = self.executor.events
        self.executor.events = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                await client.post(
                    f"{self.config.control_plane_url}/runner/events",
                    headers={'X-Runner-Token': self.config.token},
                    json={
                        'run_id': self.current_run_id,
                        'events': events
                    }
                )
        except Exception as e:
            logger.error(f"Failed to send events: {e}")
            # Put events back to retry
            self.executor.events = events + self.executor.events
    
    async def complete_job(self, result: dict):
        """Report job completion to control plane."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{self.config.control_plane_url}/runner/job/complete",
                    headers={'X-Runner-Token': self.config.token},
                    json={
                        'run_id': self.current_run_id,
                        'status': result['status'],
                        'summary': result['summary']
                    }
                )
            
            logger.info(f"Job completed: {result['status']}")
        except Exception as e:
            logger.error(f"Failed to complete job: {e}")
    
    def stop(self):
        """Stop the daemon."""
        self.running = False
        if self.executor and self.executor.process:
            self.executor.process.terminate()


def main():
    """Entry point."""
    import signal
    
    # Find config file
    config_paths = [
        '/etc/openclaw-runner/config.yaml',
        os.path.expanduser('~/.config/openclaw-runner/config.yaml'),
        './runner-config.yaml',
    ]
    
    config_path = None
    for path in config_paths:
        if os.path.exists(path):
            config_path = path
            break
    
    if not config_path:
        logger.error("No config file found. Create one at:")
        for path in config_paths:
            logger.error(f"  - {path}")
        sys.exit(1)
    
    logger.info(f"Using config: {config_path}")
    
    # Load config
    config = RunnerConfig(config_path)
    
    # Create daemon
    daemon = RunnerDaemon(config)
    
    # Handle signals
    def signal_handler(sig, frame):
        logger.info("Shutting down...")
        daemon.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run
    asyncio.run(daemon.start())


if __name__ == '__main__':
    main()
