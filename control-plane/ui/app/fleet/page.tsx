'use client';

import { useEffect, useState } from 'react';
import { fleet } from '@/lib/api';
import { Machine, Agent } from '@/types';
import DashboardLayout from '../dashboard';
import { MachineCard } from '@/components/MachineCard';
import { AgentCard } from '@/components/AgentCard';
import { StatCard } from '@/components/StatCard';
import { Server, Bot, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function FleetPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [machinesRes, agentsRes] = await Promise.all([
        fleet.machines(),
        fleet.agents(),
      ]);
      setMachines(machinesRes.data);
      setAgents(agentsRes.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  // Stats calculations
  const onlineMachines = machines.filter(m => m.status === 'online').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  const getMachineAgentCount = (machineId: string) => {
    return agents.filter(a => a.machine_id === machineId).length;
  };

  if (loading && machines.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading fleet data...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Fleet Overview</h1>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Machines"
            value={machines.length}
            subtitle={`${onlineMachines} online`}
            icon={Server}
            color="blue"
          />
          <StatCard
            title="Idle Agents"
            value={idleAgents}
            subtitle="Ready for jobs"
            icon={Bot}
            color="green"
          />
          <StatCard
            title="Busy Agents"
            value={busyAgents}
            subtitle="Processing jobs"
            icon={Activity}
            color="amber"
          />
          <StatCard
            title="Errors"
            value={errorAgents}
            subtitle={errorAgents > 0 ? 'Needs attention' : 'All good'}
            icon={AlertCircle}
            color={errorAgents > 0 ? 'red' : 'gray'}
          />
        </div>

        {/* Machines Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Machines</h2>
          {machines.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No machines connected</h3>
              <p className="text-sm text-gray-500 mt-1">
                Install the runner on your machines to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  agentCount={getMachineAgentCount(machine.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Agents Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agents</h2>
          {agents.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No agents registered</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure agents in your runner config to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
