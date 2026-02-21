'use client';

import { useState } from 'react';
import { Users, Crown, UserPlus, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Agent } from '@/types';

interface ProjectManagerAgentProps {
  agents: Agent[];
  onCreateProjectManager?: (name: string, managedAgentIds: string[]) => void;
}

export function ProjectManagerAgent({ agents, onCreateProjectManager }: ProjectManagerAgentProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [pmName, setPmName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [expandedPm, setExpandedPm] = useState<string | null>(null);

  // Filter out project managers and already managed agents
  const availableAgents = agents.filter(a => 
    !a.is_project_manager && 
    !a.managed_agents?.length
  );

  const projectManagers = agents.filter(a => a.is_project_manager);

  const handleCreate = () => {
    if (pmName && selectedAgents.length > 0) {
      onCreateProjectManager?.(pmName, selectedAgents);
      setPmName('');
      setSelectedAgents([]);
      setShowCreate(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Project Managers</h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          Create PM
        </button>
      </div>

      {/* Create PM Form */}
      {showCreate && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Manager Name
              </label>
              <input
                type="text"
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                placeholder="e.g., DevOps Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agents to Manage
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableAgents.length === 0 ? (
                  <p className="text-sm text-gray-500">No available agents</p>
                ) : (
                  availableAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAgents([...selectedAgents, agent.id]);
                          } else {
                            setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{agent.name}</span>
                      <span className="text-xs text-gray-500">({agent.machine_hostname})</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!pmName || selectedAgents.length === 0}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Project Manager
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Project Managers */}
      {projectManagers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No project managers yet. Create one to delegate tasks to multiple agents.
        </p>
      ) : (
        <div className="space-y-3">
          {projectManagers.map((pm) => (
            <div
              key={pm.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedPm(expandedPm === pm.id ? null : pm.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{pm.name}</p>
                    <p className="text-xs text-gray-500">
                      Managing {pm.managed_agents?.length || 0} agents
                    </p>
                  </div>
                </div>
                {expandedPm === pm.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedPm === pm.id && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Managed Agents:</p>
                  <div className="space-y-2">
                    {pm.managed_agents?.map((agentId) => {
                      const agent = agents.find(a => a.id === agentId);
                      return agent ? (
                        <div
                          key={agentId}
                          className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                        >
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{agent.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            agent.status === 'idle' ? 'bg-emerald-100 text-emerald-700' :
                            agent.status === 'busy' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
        <p className="font-medium mb-1">What are Project Managers?</p>
        <p>
          Project Managers are special agents that can delegate tasks to other agents, 
          coordinate multi-step workflows, and report back consolidated results.
        </p>
      </div>
    </div>
  );
}
