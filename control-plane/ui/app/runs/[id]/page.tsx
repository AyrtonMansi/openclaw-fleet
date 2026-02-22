'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobs } from '@/lib/api';
import { RunDetail, Event, Artifact } from '@/types';
import DashboardLayout from '../../dashboard';
import { StatCard } from '@/components/StatCard';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Bot,
  FileText,
  Coins,
  ArrowLeft,
  Download,
  Terminal,
  Archive,
  Loader2
} from 'lucide-react';

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRun();
    const interval = setInterval(loadRun, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [run?.events, autoScroll]);

  const loadRun = async () => {
    try {
      const res = await jobs.run(runId);
      setRun(res.data);
    } catch (err) {
      console.error('Failed to load run:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  const getStatusIcon = () => {
    switch (run?.status) {
      case 'succeeded':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'running':
      case 'pending':
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
    switch (run?.status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running':
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const renderEvent = (event: Event) => {
    const timestamp = new Date(event.ts).toLocaleTimeString();
    
    switch (event.type) {
      case 'stdout':
        return (
          <div className="font-mono text-sm text-gray-300 py-0.5">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            <span>{event.data.message}</span>
          </div>
        );
      case 'stderr':
        return (
          <div className="font-mono text-sm text-red-400 py-0.5">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            <span>{event.data.message}</span>
          </div>
        );
      case 'error':
        return (
          <div className="my-2 p-3 bg-red-900/30 border border-red-800 rounded">
            <span className="text-red-400 font-semibold">Error: </span>
            <span className="text-red-300">{event.data.error}</span>
          </div>
        );
      case 'run_started':
        return (
          <div className="my-2 py-1 text-emerald-400 font-medium">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            ▶ Run started
          </div>
        );
      case 'run_finished':
        return (
          <div className={`my-2 py-1 font-medium ${
            event.data.status === 'succeeded' ? 'text-emerald-400' : 'text-red-400'
          }`}>
            <span className="text-gray-600 mr-2">{timestamp}</span>
            ⏹ Run finished: {event.data.status}
            {event.data.exit_code !== undefined && ` (exit code: ${event.data.exit_code})`}
          </div>
        );
      case 'tool_call':
        return (
          <div className="my-1 text-blue-400 text-sm">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            🔧 Tool call: {event.data.tool_name}
          </div>
        );
      case 'llm_request':
        return (
          <div className="my-1 text-purple-400 text-sm">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            🤖 LLM request: {event.data.model}
          </div>
        );
      case 'llm_response':
        return (
          <div className="my-1 text-purple-400 text-sm">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            ✓ LLM response ({event.data.tokens?.toLocaleString()} tokens)
          </div>
        );
      default:
        return (
          <div className="my-1 text-gray-500 text-sm">
            <span className="text-gray-600 mr-2">{timestamp}</span>
            [{event.type}] {JSON.stringify(event.data).slice(0, 200)}
          </div>
        );
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading run details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!run) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-900">Run not found</h2>
          <p className="text-sm text-red-700 mt-1">The run you're looking for doesn't exist or has been deleted.</p>
          <Link 
            href="/runs" 
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Runs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isRunning = run.status === 'running' || run.status === 'pending';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <Link 
            href="/runs" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Runs
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusClass().split(' ')[0]}`}>
                {getStatusIcon()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{run.job_title || 'Untitled Job'}</h1>
                <p className="text-sm text-gray-500">
                  Run ID: {run.id} • Job ID: {run.job_id}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusClass()}`}>
              {run.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Agent"
            value={run.agent_name?.slice(0, 15) || run.agent_id.slice(0, 8) + '...'}
            icon={Bot}
            color="blue"
          />
          <StatCard
            title="Duration"
            value={formatDuration(run.duration_ms)}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Tokens"
            value={run.tokens_used?.toLocaleString() || '-'}
            icon={FileText}
            color="indigo"
          />
          <StatCard
            title="Cost"
            value={run.cost_usd ? `$${run.cost_usd.toFixed(4)}` : '-'}
            icon={Coins}
            color="green"
          />
        </div>

        {/* Timing Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Started</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {run.started_at 
                  ? new Date(run.started_at).toLocaleString() 
                  : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Finished</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {run.finished_at 
                  ? new Date(run.finished_at).toLocaleString() 
                  : isRunning ? 'In progress...' : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatDuration(run.duration_ms)}
              </p>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Execution Logs
            </h3>
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Live
              </div>
            )}
          </div>
          <div 
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="bg-gray-950 p-4 h-[500px] overflow-y-auto font-mono text-sm"
          >
            {run.events?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Clock className="w-8 h-8 text-gray-600 mb-2" />
                <p>Waiting for logs...</p>
              </div>
            ) : (
              <>
                {run.events?.map((event, idx) => (
                  <div key={idx}>
                    {renderEvent(event)}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {run.summary && Object.keys(run.summary).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {typeof run.summary === 'string' 
                  ? run.summary 
                  : JSON.stringify(run.summary, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Artifacts */}
        {run.artifacts && run.artifacts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Artifacts ({run.artifacts.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {run.artifacts.map((artifact: Artifact) => (
                <div 
                  key={artifact.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Archive className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{artifact.name}</p>
                      <p className="text-xs text-gray-500">
                        {artifact.mime_type} • {artifact.size ? `${(artifact.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  {artifact.download_url && (
                    <a
                      href={artifact.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
