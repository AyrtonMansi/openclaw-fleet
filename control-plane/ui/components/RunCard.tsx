import { Run } from '@/types';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Bot,
  FileText,
  Coins,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface RunCardProps {
  run: Run;
}

export function RunCard({ run }: RunCardProps) {
  const getStatusIcon = () => {
    switch (run.status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusClass = () => {
    switch (run.status) {
      case 'succeeded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
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

  const formatTokens = (tokens?: number) => {
    if (!tokens) return '-';
    if (tokens < 1000) return `${tokens}`;
    return `${(tokens / 1000).toFixed(1)}k`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '-';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusClass().split(' ')[0]}`}>
            {getStatusIcon()}
          </div>
          <div>
            <Link 
              href={`/runs/${run.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {run.job_title || 'Untitled Job'}
            </Link>
            <p className="text-xs text-gray-500">
              Run {run.id.slice(0, 8)}... • {new Date(run.started_at || run.created_at || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass()}`}>
          {run.status}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Agent</p>
            <p className="text-sm font-medium text-gray-900">
              {run.agent_name || run.agent_id?.slice(0, 8) || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDuration(run.duration_ms)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Tokens</p>
            <p className="text-sm font-medium text-gray-900">
              {formatTokens(run.tokens_used)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Cost</p>
            <p className="text-sm font-medium text-gray-900">
              {formatCost(run.cost_usd)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Preview */}
      {run.summary && Object.keys(run.summary).length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-xs text-gray-500 mb-1">Summary</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {typeof run.summary === 'string' 
              ? run.summary 
              : JSON.stringify(run.summary).slice(0, 100)}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Job: {run.job_id?.slice(0, 8)}...
        </div>
        <Link
          href={`/runs/${run.id}`}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
