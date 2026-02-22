'use client';

import { useEffect, useState } from 'react';
import { jobs } from '@/lib/api';
import { Run } from '@/types';
import DashboardLayout from '../dashboard';
import { RunCard } from '@/components/RunCard';
import { StatCard } from '@/components/StatCard';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Search,
  Filter,
  Zap
} from 'lucide-react';

// Extended Run interface for display
interface RunWithCreated extends Run {
  created_at?: string;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<RunWithCreated[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  useEffect(() => {
    loadRuns();
    const interval = setInterval(loadRuns, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRuns = async () => {
    try {
      // Get all jobs, then fetch runs for each
      const jobsRes = await jobs.list({ page_size: 100 });
      const jobList = jobsRes.data.items || [];
      
      // Fetch runs for each job
      const runPromises = jobList.map(async (job: any) => {
        try {
          const runsRes = await jobs.runs(job.id);
          return (runsRes.data || []).map((run: Run) => ({
            ...run,
            job_title: job.title,
            created_at: run.started_at || job.created_at,
          }));
        } catch {
          return [];
        }
      });

      const allRuns = (await Promise.all(runPromises)).flat();
      // Sort by started_at desc
      allRuns.sort((a: any, b: any) => 
        new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime()
      );
      
      setRuns(allRuns);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadRuns();
  };

  // Get unique agents for filter
  const uniqueAgents = Array.from(new Set(runs.map(r => r.agent_name || r.agent_id).filter(Boolean)));

  // Filter runs
  const filteredRuns = runs.filter(run => {
    const matchesSearch = 
      (run.job_title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (run.agent_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      run.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || (run.agent_name || run.agent_id) === agentFilter;
    return matchesSearch && matchesStatus && matchesAgent;
  });

  // Stats
  const stats = {
    total: runs.length,
    running: runs.filter(r => r.status === 'running').length,
    succeeded: runs.filter(r => r.status === 'succeeded').length,
    failed: runs.filter(r => r.status === 'failed').length,
    totalCost: runs.reduce((acc, r) => acc + (r.cost_usd || 0), 0),
    totalTokens: runs.reduce((acc, r) => acc + (r.tokens_used || 0), 0),
  };

  if (loading && runs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading runs...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Runs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Runs"
            value={stats.total}
            icon={Zap}
            color="blue"
          />
          <StatCard
            title="Running"
            value={stats.running}
            icon={Play}
            color="amber"
          />
          <StatCard
            title="Succeeded"
            value={stats.succeeded}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
            color={stats.failed > 0 ? 'red' : 'gray'}
          />
          <StatCard
            title="Total Cost"
            value={`$${stats.totalCost.toFixed(2)}`}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Total Tokens"
            value={`${(stats.totalTokens / 1000).toFixed(1)}k`}
            icon={Clock}
            color="indigo"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search runs by job, agent, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {uniqueAgents.length > 0 && (
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Agents</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>{agent?.slice(0, 20)}...</option>
              ))}
            </select>
          )}
        </div>

        {/* Runs List */}
        <div className="space-y-4">
          {filteredRuns.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">
                {searchQuery || statusFilter !== 'all' || agentFilter !== 'all'
                  ? 'No runs match your filters'
                  : 'No runs yet'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== 'all' || agentFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Jobs will create runs when they are picked up by agents'}
              </p>
            </div>
          ) : (
            filteredRuns.map((run) => (
              <RunCard key={run.id} run={run as Run} />
            ))
          )}
        </div>

        {/* Load More / End */}
        {filteredRuns.length > 0 && (
          <div className="text-center text-sm text-gray-500 py-4">
            Showing {filteredRuns.length} of {runs.length} runs
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
