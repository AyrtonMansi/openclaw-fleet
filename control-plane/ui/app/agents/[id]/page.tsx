'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fleet, jobs } from '@/lib/api';
import { Agent, Run } from '@/types';
import DashboardLayout from '../../dashboard';
import { StatCard } from '@/components/StatCard';
import { RunCard } from '@/components/RunCard';
import { 
  Bot, 
  ArrowLeft,
  Cpu,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Server,
  RefreshCw,
  Loader2,
  Tag,
  Wrench,
  AlertCircle
} from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgent();
    const interval = setInterval(loadAgent, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const agentsRes = await fleet.agents();
      const agentData = agentsRes.data.find((a: Agent) => a.id === agentId);
      
      if (agentData) {
        setAgent(agentData);
        
        // Fetch runs for this agent (we'd need an API endpoint for this)
        // For now, fetch recent jobs and filter by agent
        const jobsRes = await jobs.list({ page_size: 50 });
        const allRuns: Run[] = [];
        
        for (const job of jobsRes.data.items || []) {
          try {
            const runsRes = await jobs.runs(job.id);
            const agentRuns = (runsRes.data || []).filter((r: Run) => r.agent_id === agentId);
            allRuns.push(...agentRuns.map((r: Run) => ({ ...r, job_title: job.title })));
          } catch {
            // Skip failed job runs fetch
          }
        }
        
        // Sort by started_at desc
        allRuns.sort((a: any, b: any) => 
          new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime()
        );
        
        setRuns(allRuns.slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to load agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (agent?.status) {
      case 'idle':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'busy':
        return <Activity className="w-6 h-6 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'offline':
        return <XCircle className="w-6 h-6 text-gray-400" />;
      default:
        return <Clock className="w-6 h-6 text-amber-500" />;
    }
  };

  const getStatusClass = () => {
    switch (agent?.status) {
      case 'idle':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'busy':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'offline':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading && !agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading agent...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-900">Agent not found</h2>
          <p className="text-sm text-red-700 mt-1">The agent you're looking for doesn't exist.</p>
          <Link 
            href="/fleet" 
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fleet
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const totalCost = runs.reduce((acc, r) => acc + (r.cost_usd || 0), 0);
  const totalTokens = runs.reduce((acc, r) => acc + (r.tokens_used || 0), 0);
  const avgResponseTime = agent.avg_response_time_ms || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <Link 
            href="/fleet" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fleet
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusClass().split(' ')[0]}`}>
                {getStatusIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                <p className="text-sm text-gray-500">
                  ID: {agent.id} • Model: {agent.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLoading(true); loadAgent(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusClass()}`}>
                {agent.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Jobs Completed"
            value={agent.total_jobs_completed || 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Total Tokens"
            value={`${((agent.total_tokens_used || 0) / 1000).toFixed(1)}k`}
            icon={Zap}
            color="indigo"
          />
          <StatCard
            title="Avg Response"
            value={avgResponseTime > 0 ? `${avgResponseTime.toFixed(0)}ms` : '-'}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="Concurrency"
            value={`${agent.max_concurrency}`}
            icon={Cpu}
            color="amber"
          />
        </div>

        {/* Agent Info */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agent Information
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Model</p>
                <p className="text-sm font-medium text-gray-900">{agent.model}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{agent.status}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Machine</p>
                <Link 
                  href={`/fleet/${agent.machine_id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {agent.machine_hostname || agent.machine_id.slice(0, 8)}...
                </Link>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Max Concurrency</p>
                <p className="text-sm font-medium text-gray-900">{agent.max_concurrency}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(agent.updated_at).toLocaleTimeString()}
                </p>
              </div>
              {agent.current_run_id && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-500 uppercase">Current Run</p>
                  <Link 
                    href={`/runs/${agent.current_run_id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {agent.current_run_id.slice(0, 8)}...
                  </Link>
                </div>
              )}
            </div>

            {/* Tags */}
            {agent.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {agent.tools.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  Tools
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <span key={tool} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {agent.last_error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-500 uppercase mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Last Error
                </p>
                <p className="text-sm text-red-700">{agent.last_error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance (Last {runs.length} Runs)
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{runs.length}</p>
                <p className="text-xs text-gray-500 uppercase">Recent Runs</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500 uppercase">Total Tokens</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(4)}</p>
                <p className="text-xs text-gray-500 uppercase">Total Cost</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {runs.length > 0 
                    ? formatDuration(runs.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / runs.length)
                    : '-'}
                </p>
                <p className="text-xs text-gray-500 uppercase">Avg Duration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Runs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Runs</h3>
            {runs.length > 0 && (
              <Link 
                href="/runs"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            )}
          </div>

          {runs.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No runs yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                This agent hasn't completed any jobs recently.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
