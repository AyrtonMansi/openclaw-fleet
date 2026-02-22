'use client';

import { useState } from 'react';
import { MessageCircle, Users, Crown, Briefcase, Clock, Pencil } from 'lucide-react';
import { TeamAgent } from '@/types/team';

interface TeamDirectoryProps {
  agents: TeamAgent[];
  onMessageAgent?: (agentId: string) => void;
  onEditAgent?: (agent: TeamAgent) => void;
}

export function TeamDirectory({ agents, onMessageAgent, onEditAgent }: TeamDirectoryProps) {
  const [filter, setFilter] = useState<'all' | 'online' | 'managers'>('all');
  const [selectedAgent, setSelectedAgent] = useState<TeamAgent | null>(null);

  const filteredAgents = agents.filter(agent => {
    if (filter === 'online') return agent.status !== 'offline';
    if (filter === 'managers') return agent.manages && agent.manages.length > 0;
    return true;
  });

  const managers = agents.filter(a => a.manages && a.manages.length > 0);
  const regularAgents = agents.filter(a => !a.manages || a.manages.length === 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">Team Directory</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {agents.length} members
          </span>
        </div>
        <div className="flex gap-2">
          {(['all', 'online', 'managers'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full capitalize ${
                filter === f
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Org Chart */}
      {managers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Leadership</h4>
          <div className="space-y-4">
            {managers.map((manager) => (
              <div key={manager.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <span className="text-3xl">{manager.personality?.emoji || '🤖'}</span>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-amber-100 rounded-full">
                      <Crown className="w-3 h-3 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-gray-900">{manager.personality?.name || manager.name}</h5>
                      <span className={`w-2 h-2 rounded-full ${
                        manager.status === 'idle' ? 'bg-emerald-500' :
                        manager.status === 'busy' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                    </div>
                    <p className="text-sm text-gray-500">@{manager.personality?.handle || manager.name.toLowerCase()}</p>
                    {manager.status_message && (
                      <p className="text-xs text-indigo-600 mt-1">{manager.status_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditAgent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAgent(manager);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit agent"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {manager.telegram?.bot_username && (
                      <a
                        href={`https://t.me/${manager.telegram.bot_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Message on Telegram"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Team members */}
                {manager.manages && manager.manages.length > 0 && (
                  <div className="ml-12 space-y-2">
                    <p className="text-xs text-gray-500 mb-2">Manages {manager.manages.length} agents:</p>
                    <div className="flex flex-wrap gap-2">
                      {manager.manages.map((memberId) => {
                        const member = agents.find(a => a.id === memberId);
                        if (!member) return null;
                        return (
                          <div
                            key={memberId}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200"
                          >
                            <span>{member.personality?.emoji || '🤖'}</span>
                            <span className="text-sm">{member.personality?.name || member.name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'idle' ? 'bg-emerald-500' :
                              member.status === 'busy' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Agents */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          {managers.length > 0 ? 'Team Members' : 'All Agents'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredAgents
            .filter(a => !a.manages || a.manages.length === 0)
            .map((agent) => (
              <div
                key={agent.id}
                className="p-3 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="text-2xl">{agent.personality?.emoji || '🤖'}</span>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      agent.status === 'idle' ? 'bg-emerald-500' :
                      agent.status === 'busy' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{agent.personality?.name || agent.name}</p>
                    <p className="text-sm text-gray-500 truncate">@{agent.personality?.handle || agent.name.toLowerCase()}</p>
                    {agent.current_task && (
                      <p className="text-xs text-indigo-600 truncate mt-0.5">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        {agent.current_task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditAgent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAgent(agent);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit agent"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {agent.telegram?.bot_username && (
                      <a
                        href={`https://t.me/${agent.telegram.bot_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{selectedAgent.personality?.emoji || '🤖'}</span>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedAgent.personality?.name || selectedAgent.name}</h4>
                  <p className="text-gray-500">@{selectedAgent.personality?.handle}</p>
                  <p className="text-sm text-gray-400">{selectedAgent.machine_hostname}</p>
                </div>
              </div>

              {selectedAgent.personality?.bio && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Bio</h5>
                  <p className="text-sm text-gray-600">{selectedAgent.personality.bio}</p>
                </div>
              )}

              {selectedAgent.personality?.specialties && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Specialties</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.personality.specialties.map((spec) => (
                      <span key={spec} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Status</h5>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedAgent.status === 'idle' ? 'bg-emerald-100 text-emerald-700' :
                    selectedAgent.status === 'busy' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedAgent.status}
                  </span>
                  {selectedAgent.status_message && (
                    <span className="text-sm text-gray-600">{selectedAgent.status_message}</span>
                  )}
                </div>
              </div>

              {selectedAgent.telegram?.bot_username && (
                <a
                  href={`https://t.me/${selectedAgent.telegram.bot_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message on Telegram
                </a>
              )}

              <button
                onClick={() => setSelectedAgent(null)}
                className="w-full mt-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
