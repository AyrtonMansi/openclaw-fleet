import { Machine } from '@/types';
import { Server, Cpu, Clock, Circle } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  agentCount?: number;
  onClick?: (machine: Machine) => void;
}

export function MachineCard({ machine, agentCount = 0, onClick }: MachineCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'degraded':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'offline':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
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
      onClick={() => onClick?.(machine)}
      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${
            machine.status === 'online' ? 'bg-emerald-50 text-emerald-600' :
            machine.status === 'degraded' ? 'bg-amber-50 text-amber-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{machine.hostname}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Circle className={`w-2 h-2 ${getStatusDot(machine.status)} rounded-full`} />
              <span className="text-xs text-gray-500 capitalize">{machine.status}</span>
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(machine.status)}`}>
          {agentCount} agent{agentCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* System Info */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
        <Cpu className="w-4 h-4 text-gray-400" />
        <span>{machine.os} / {machine.arch}</span>
      </div>

      {/* Labels */}
      {machine.labels && Object.keys(machine.labels).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(machine.labels).slice(0, 3).map(([key, value]) => (
            <span
              key={key}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md"
            >
              {key}: {value}
            </span>
          ))}
          {Object.keys(machine.labels).length > 3 && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">
              +{Object.keys(machine.labels).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Seen {formatTime(machine.last_seen)}</span>
        </div>
        <div className="text-xs text-gray-400">
          v{machine.runner_version}
        </div>
      </div>
    </div>
  );
}
