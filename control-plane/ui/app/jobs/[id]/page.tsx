'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobs } from '@/lib/api';
import { Job, Run } from '@/types';
import DashboardLayout from '../../dashboard';
import { RunCard } from '@/components/RunCard';
import { StatCard } from '@/components/StatCard';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  X,
  Bot,
  FileText,
  Terminal,
  Loader2
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
    const interval = setInterval(loadJob, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const loadJob = async () => {
    try {
      const [jobRes, runsRes] = await Promise.all([
        jobs.get(jobId),
        jobs.runs(jobId),
      ]);
      setJob(jobRes.data);
      setRuns(runsRes.data || []);
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      await jobs.action(jobId, action);
      loadJob();
    } catch (err) {
      alert(`Failed to ${action} job`);
    }
  };

  const getStatusIcon = () => {
    switch (job?.status) {
      case 'succeeded':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'running':
      case 'leased':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-gray-400" />;
      default:
        return <Clock className="w-6 h-6 text-amber-500" />;
    }
  };

  const getStatusClass = () => {
    switch (job?.status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running':
      case 'leased':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const formatPayload = (payload: any) => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  if (loading && !job) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading job...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-900">Job not found</h2>
          <p className="text-sm text-red-700 mt-1">The job you're looking for doesn't exist or has been deleted.</p>
          <Link 
            href="/jobs" 
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const latestRun = runs[0];
  const totalCost = runs.reduce((acc, r) => acc + (r.cost_usd || 0), 0);
  const totalTokens = runs.reduce((acc, r) => acc + (r.tokens_used || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <Link 
            href="/jobs" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusClass().split(' ')[0]}`}>
                {getStatusIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-sm text-gray-500">
                  Job ID: {job.id} • Created {new Date(job.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(job.status === 'queued' || job.status === 'leased' || job.status === 'running') && (
                <button
                  onClick={() => handleAction('cancel')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
              {(job.status === 'failed' || job.status === 'cancelled') && (
                <button
                  onClick={() => handleAction('retry')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusClass()}`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Priority"
            value={job.priority}
            subtitle="1-10 scale"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Retries"
            value={`${job.retries} / ${job.max_retries}`}
            icon={RefreshCw}
            color={job.retries > 0 ? 'red' : 'gray'}
          />
          <StatCard
            title="Total Cost"
            value={`$${totalCost.toFixed(4)}`}
            icon={FileText}
            color="green"
          />
          <StatCard
            title="Total Tokens"
            value={totalTokens.toLocaleString()}
            icon={Bot}
            color="indigo"
          />
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{job.status}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Priority</p>
                  <p className="text-sm font-medium text-gray-900">{job.priority}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Retries</p>
                  <p className="text-sm font-medium text-gray-900">{job.retries} / {job.max_retries}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{job.created_by.slice(0, 8)}...</p>
                </div>
              </div>
              
              {/* Routing */}
              {(job.routing?.required_tags?.length || job.routing?.preferred_machines?.length || job.routing?.preferred_agents?.length) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase mb-2">Routing</p>
                  {job.routing.required_tags && job.routing.required_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {job.routing.required_tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                          tag:{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {job.routing.preferred_machines && job.routing.preferred_machines.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Machines: {job.routing.preferred_machines.join(', ')}
                    </p>
                  )}
                  {job.routing.preferred_agents && job.routing.preferred_agents.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Agents: {job.routing.preferred_agents.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payload */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Payload
              </h3>
            </div>
            <div className="p-4 bg-gray-950 overflow-x-auto">
              <pre className="font-mono text-sm text-green-400">
                {formatPayload(job.payload)}
              </pre>
            </div>
          </div>
        </div>

        {/* Run History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Run History ({runs.length})
            </h3>
            {runs.length > 0 && (
              <div className="text-sm text-gray-500">
                Latest: {new Date(runs[0].started_at || Date.now()).toLocaleString()}
              </div>
            )}
          </div>

          {runs.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No runs yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                This job is waiting to be picked up by an agent
              </p>
            </div>
          ) : (
            runs.map((run) => (
              <RunCard key={run.id} run={run} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
