'use client';

import { useEffect, useState } from 'react';
import { fleet } from '@/lib/api';
import { Agent } from '@/types';
import DashboardLayout from '../dashboard';
import { TeamDirectory } from '@/components/TeamDirectory';
import { AgentEditor } from '@/components/AgentEditor';
import { AgentPersonality, AgentTelegramConfig, TeamAgent } from '@/types/team';
import { Users, Plus, Pencil, Bot, Sparkles } from 'lucide-react';

// Convert Agent to TeamAgent for display
function agentToTeamAgent(agent: Agent): TeamAgent {
  return {
    ...agent,
    personality: {
      name: agent.name,
      handle: agent.name.toLowerCase().replace(/\s+/g, '_'),
      emoji: '🤖',
      bio: `Agent running on ${agent.machine_hostname || 'unknown machine'}`,
      backstory: 'An OpenClaw agent ready to help.',
      communication_style: 'casual',
      specialties: agent.tags,
      catchphrases: [],
      personality_traits: {
        creativity: 5,
        thoroughness: 5,
        speed: 5,
        humor: 5,
        formality: 5,
      },
    },
    telegram: {
      bot_token: '',
      bot_username: '',
      allowed_chat_ids: [],
      direct_messages_enabled: true,
      group_chat_enabled: true,
      auto_respond: true,
      response_delay_ms: 1000,
    },
    memory: {
      short_term: [],
      long_term: {},
      relationships: {},
    },
  };
}

export default function TeamPage() {
  const [agents, setAgents] = useState<TeamAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAgent, setEditingAgent] = useState<TeamAgent | undefined>(undefined);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fleet.agents();
      const teamAgents = res.data.map(agentToTeamAgent);
      setAgents(teamAgents);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = (agentData: {
    personality: AgentPersonality;
    telegram: AgentTelegramConfig;
    work_hours?: { timezone: string; start: string; end: string };
  }) => {
    // TODO: Call API to create agent
    console.log('Creating agent:', agentData);
    
    // For now, add to local state
    const newAgent: TeamAgent = {
      id: `new-${Date.now()}`,
      machine_id: '',
      name: agentData.personality.name,
      model: 'gpt-4',
      tags: agentData.personality.specialties,
      tools: [],
      max_concurrency: 2,
      status: 'idle',
      updated_at: new Date().toISOString(),
      machine_hostname: 'Pending setup...',
      personality: agentData.personality,
      telegram: agentData.telegram,
      work_hours: agentData.work_hours,
      memory: {
        short_term: [],
        long_term: {},
        relationships: {},
      },
    };
    
    setAgents([...agents, newAgent]);
    setMode('list');
  };

  const handleEditAgent = (agentData: {
    personality: AgentPersonality;
    telegram: AgentTelegramConfig;
    work_hours?: { timezone: string; start: string; end: string };
  }) => {
    // TODO: Call API to update agent
    console.log('Updating agent:', editingAgent?.id, agentData);
    
    if (editingAgent) {
      const updatedAgents = agents.map(a => 
        a.id === editingAgent.id 
          ? { ...a, personality: agentData.personality, telegram: agentData.telegram, work_hours: agentData.work_hours }
          : a
      );
      setAgents(updatedAgents);
    }
    
    setMode('list');
    setEditingAgent(undefined);
  };

  const handleEditClick = (agent: TeamAgent) => {
    setEditingAgent(agent);
    setMode('edit');
  };

  if (loading && agents.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading team...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        {mode === 'list' && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} in your fleet
              </p>
            </div>
            <div className="flex items-center gap-2">
              {agents.length > 0 && (
                <button
                  onClick={() => handleEditClick(agents[0])}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => {
                  setEditingAgent(undefined);
                  setMode('create');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {mode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {agents.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                  <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No agents yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Create your first AI team member with a unique personality, 
                    specialties, and Telegram integration.
                  </p>
                  <button
                    onClick={() => setMode('create')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create Your First Agent
                  </button>
                </div>
              ) : (
                <TeamDirectory 
                  agents={agents} 
                  onEditAgent={handleEditClick}
                />
              )}
            </div>
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Agents</span>
                    <span className="font-medium text-gray-900 dark:text-white">{agents.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
                    <span className="font-medium text-emerald-600">
                      {agents.filter(a => a.status !== 'offline').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Busy</span>
                    <span className="font-medium text-blue-600">
                      {agents.filter(a => a.status === 'busy').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Idle</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {agents.filter(a => a.status === 'idle').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  How It Works
                </h3>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <p>Create an agent with a unique personality</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <p>Connect a Telegram bot for messaging</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <p>Chat with your agent directly or in groups</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <p>Agents remember conversations and build rapport</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AgentEditor
            agent={editingAgent}
            onSave={mode === 'create' ? handleCreateAgent : handleEditAgent}
            onCancel={() => {
              setMode('list');
              setEditingAgent(undefined);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
