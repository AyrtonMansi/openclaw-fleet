'use client';

import { useEffect, useState } from 'react';
import { jobs, fleet } from '@/lib/api';
import { Job, Run, Machine, Agent, FleetStats } from '@/types';
import DashboardLayout from './dashboard';
import { DashboardStats } from '@/components/DashboardStats';
import { TokenBudgetMonitor } from '@/components/TokenBudgetMonitor';
import { ConnectionMonitor } from '@/components/ConnectionMonitor';
import { JobCreator } from '@/components/JobCreator';
import { AgentCard } from '@/components/AgentCard';
import { DropletProvisioner } from '@/components/DropletProvisioner';
import { ProjectManagerAgent } from '@/components/ProjectManagerAgent';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
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
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobData: any) => {
    try {
      await jobs.create(jobData);
      loadData();
    } catch (err) {
      alert('Failed to create job');
    }
  };

  // Calculate stats
  const stats: FleetStats = {
    total_machines: machines.length,
    online_machines: machines.filter(m => m.status === 'online').length,
    total_agents: agents.length,
    idle_agents: agents.filter(a => a.status === 'idle').length,
    busy_agents: agents.filter(a => a.status === 'busy').length,
    total_jobs_today: recentJobs.length,
    total_tokens_today: recentJobs.reduce((acc, j) => acc + (j.actual_tokens || 0), 0),
    total_cost_today: recentJobs.reduce((acc, j) => acc + (j.cost_estimate || 0), 0),
    avg_job_duration_ms: 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'running':
      case 'leased':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (loading && machines.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your OpenClaw agents, jobs, and infrastructure
          </p>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <JobCreator onSubmit={handleCreateJob} />
            <ConnectionMonitor machines={machines} />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <TokenBudgetMonitor 
              currentDailyUsage={stats.total_cost_today}
              currentMonthlyUsage={stats.total_cost_today * 30}
            />
            <DropletProvisioner />
            <ProjectManagerAgent agents={agents} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Active Agents */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Active Agents</h3>
              {agents.filter(a => a.status === 'busy').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No agents currently busy
                </p>
              ) : (
                <div className="space-y-3">
                  {agents
                    .filter(a => a.status === 'busy')
                    .map((agent) => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Jobs</h3>
              <div className="space-y-2">
                {recentJobs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No jobs yet
                  </p>
                ) : (
                  recentJobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-gray-500">
                            Priority: {job.priority}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
