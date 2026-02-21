import { Agent } from '@/types';
import { Bot, Cpu, Tag, Activity, AlertCircle, Layers } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'busy':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'offline':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <Activity className="w-3 h-3" />;
      case 'busy':
        return <Cpu className="w-3 h-3 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      case 'offline':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onClick?.(agent)}
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            agent.status === 'idle' ? 'bg-emerald-50 text-emerald-600' :
            agent.status === 'busy' ? 'bg-blue-50 text-blue-600' :
            agent.status === 'error' ? 'bg-red-50 text-red-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.machine_hostname}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
          {getStatusIcon(agent.status)}
          {agent.status}
        </span>
      </div>

      {/* Model */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
        <Cpu className="w-4 h-4 text-gray-400" />
        <span className="truncate">{agent.model}</span>
      </div>

      {/* Tags */}
      {agent.tags && agent.tags.length > 0 && (
        <div className="flex items-start gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex flex-wrap gap-1.5">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {agent.tools && agent.tools.length > 0 && (
        <div className="flex items-start gap-2 mb-3">
          <Layers className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.slice(0, 3).map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md"
              >
                {tool}
              </span>
            ))}
            {agent.tools.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{agent.tools.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Updated {formatTime(agent.updated_at)}
        </div>
        {agent.current_run_id && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md">
            <Activity className="w-3 h-3 animate-pulse" />
            Running
          </span>
        )}
        {agent.max_concurrency > 1 && (
          <span className="text-xs text-gray-500">
            {agent.max_concurrency} concurrent
          </span>
        )}
      </div>

      {/* Error indicator */}
      {agent.last_error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600 line-clamp-2">{agent.last_error}</p>
        </div>
      )}
    </div>
  );
}
