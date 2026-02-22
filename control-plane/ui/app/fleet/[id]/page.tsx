'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fleet } from '@/lib/api';
import { Machine, Agent } from '@/types';
import DashboardLayout from '../../dashboard';
import { AgentCard } from '@/components/AgentCard';
import { StatCard } from '@/components/StatCard';
import { 
  Server, 
  ArrowLeft,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Activity,
  MapPin,
  Terminal,
  RefreshCw,
  Bot,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface MachineMetrics {
  cpu_percent?: number;
  memory_percent?: number;
  disk_percent?: number;
  uptime_seconds?: number;
}

export default function MachineDetailPage() {
  const params = useParams();
  const machineId = params.id as string;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<MachineMetrics>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadMachine();
    const interval = setInterval(loadMachine, 10000);
    return () => clearInterval(interval);
  }, [machineId]);

  const loadMachine = async () => {
    try {
      const [machinesRes, agentsRes] = await Promise.all([
        fleet.machines(),
        fleet.agents(),
      ]);
      
      const machineData = machinesRes.data.find((m: Machine) => m.id === machineId);
      if (machineData) {
        setMachine(machineData);
        // Filter agents for this machine
        const machineAgents = agentsRes.data.filter((a: Agent) => a.machine_id === machineId);
        setAgents(machineAgents);
        
        // Mock metrics for now - would come from API
        setMetrics({
          cpu_percent: Math.floor(Math.random() * 60) + 10,
          memory_percent: Math.floor(Math.random() * 70) + 20,
          disk_percent: Math.floor(Math.random() * 50) + 30,
          uptime_seconds: 86400 * 5 + Math.floor(Math.random() * 86400),
        });
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load machine:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getStatusIcon = () => {
    switch (machine?.status) {
      case 'online':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'degraded':
        return <Activity className="w-6 h-6 text-amber-500" />;
      case 'offline':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusClass = () => {
    switch (machine?.status) {
      case 'online':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'degraded':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'offline':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading && !machine) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading machine...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!machine) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-900">Machine not found</h2>
          <p className="text-sm text-red-700 mt-1">The machine you're looking for doesn't exist.</p>
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
                <h1 className="text-2xl font-bold text-gray-900">{machine.hostname}</h1>
                <p className="text-sm text-gray-500">
                  ID: {machine.id} • Last seen: {new Date(machine.last_seen).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLoading(true); loadMachine(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusClass()}`}>
                {machine.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="CPU Usage"
            value={`${metrics.cpu_percent || 0}%`}
            icon={Cpu}
            color={metrics.cpu_percent && metrics.cpu_percent > 80 ? 'red' : 'blue'}
          />
          <StatCard
            title="Memory"
            value={`${metrics.memory_percent || 0}%`}
            icon={MemoryStick}
            color={metrics.memory_percent && metrics.memory_percent > 80 ? 'red' : 'green'}
          />
          <StatCard
            title="Disk"
            value={`${metrics.disk_percent || 0}%`}
            icon={HardDrive}
            color={metrics.disk_percent && metrics.disk_percent > 80 ? 'red' : 'amber'}
          />
          <StatCard
            title="Uptime"
            value={formatUptime(metrics.uptime_seconds)}
            icon={Clock}
            color="gray"
          />
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Information
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">OS</p>
                <p className="text-sm font-medium text-gray-900">{machine.os}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Architecture</p>
                <p className="text-sm font-medium text-gray-900">{machine.arch}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Runner Version</p>
                <p className="text-sm font-medium text-gray-900">{machine.runner_version}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">IP Address</p>
                <p className="text-sm font-medium text-gray-900">{machine.ip_address || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Location</p>
                <p className="text-sm font-medium text-gray-900">{machine.location || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Agents</p>
                <p className="text-sm font-medium text-gray-900">{agents.length}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Last Seen</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(machine.last_seen).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{machine.status}</p>
              </div>
            </div>

            {/* Labels */}
            {Object.keys(machine.labels).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-2">Labels</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(machine.labels).map(([key, value]) => (
                    <span key={key} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agents on this Machine */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agents on this Machine ({agents.length})
            </h3>
          </div>

          {agents.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No agents on this machine</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure agents in the runner config to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Resource Usage Graph (Placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Resource History
            </h3>
          </div>
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Resource usage charts coming soon</p>
            <p className="text-sm">Historical CPU, memory, and disk metrics will appear here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
