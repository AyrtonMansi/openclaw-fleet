'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { jobs, fleet } from '@/lib/api';
import { Job, Run, Machine, Agent } from '@/types';
import DashboardLayout from './dashboard';
import { StatCard } from '@/components/StatCard';
import { AgentCard } from '@/components/AgentCard';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Bot,
  ArrowRight,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentRuns, setRecentRuns] = useState<Run[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jobsRes, machinesRes, agentsRes] = await Promise.all([
        jobs.list({ page_size: 5 }),
        fleet.machines(),
        fleet.agents(),
      ]);
      setRecentJobs(jobsRes.data.items || []);
      setMachines(machinesRes.data);
      setAgents(agentsRes.data);
      
      // Load recent runs from first few jobs
      if (jobsRes.data.items?.length > 0) {
        const runsPromises = jobsRes.data.items.slice(0, 3).map((job: Job) => 
          jobs.runs(job.id).catch(() => ({ data: [] }))
        );
        const runsResults = await Promise.all(runsPromises);
        const allRuns = runsResults.flatMap(r => r.data).slice(0, 5);
        setRecentRuns(allRuns);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Calculate stats
  const runningJobs = recentJobs.filter(j => j.status === 'running').length;
  const queuedJobs = recentJobs.filter(j => j.status === 'queued').length;
  const onlineMachines = machines.filter(m => m.status === 'online').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your OpenClaw Fleet
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Running Jobs"
            value={runningJobs}
            subtitle="Currently active"
            icon={Play}
            color="blue"
          />
          <StatCard
            title="Queued Jobs"
            value={queuedJobs}
            subtitle="Waiting for agents"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Online Machines"
            value={onlineMachines}
            subtitle={`of ${machines.length} total`}
            icon={Server}
            color="green"
          />
          <StatCard
            title="Idle Agents"
            value={idleAgents}
            subtitle="Ready for work"
            icon={Bot}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link 
                href="/jobs" 
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No jobs yet. Create your first job to get started.
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Priority: {job.priority} • Retries: {job.retries}/{job.max_retries}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Runs</h2>
              <Link 
                href="/jobs" 
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentRuns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No runs yet. Jobs will appear here when they execute.
                </div>
              ) : (
                recentRuns.map((run) => (
                  <Link 
                    key={run.id} 
                    href={`/runs/${run.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{run.job_title || 'Untitled Job'}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Agent: {run.agent_name || 'Unknown'}
                          {run.duration_ms && ` • ${(run.duration_ms / 1000).toFixed(1)}s`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(run.status)}`}>
                          {run.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Agents */}
        {agents.filter(a => a.status === 'busy').length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Agents</h2>
              <Link 
                href="/fleet" 
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View fleet <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents
                .filter(a => a.status === 'busy')
                .map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
