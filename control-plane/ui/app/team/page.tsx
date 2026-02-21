'use client';

import { useEffect, useState } from 'react';
import { fleet } from '@/lib/api';
import { Agent } from '@/types';
import DashboardLayout from '../dashboard';
import { AgentProfileCreator } from '@/components/AgentProfileCreator';
import { TeamDirectory } from '@/components/TeamDirectory';
import { Users, Plus, MessageSquare } from 'lucide-react';

// Mock data for now - would come from API
const MOCK_TEAM_AGENTS = [
  {
    id: '1',
    machine_id: '1',
    name: 'Claw Dev',
    model: 'gpt-4',
    tags: ['general', 'mac', 'local'],
    tools: ['shell', 'code', 'git'],
    max_concurrency: 2,
    status: 'idle' as const,
    updated_at: new Date().toISOString(),
    machine_hostname: 'ayrtons-Laptop.local',
    personality: {
      name: 'Claw Dev',
      handle: 'claw_dev',
      emoji: '🔧',
      bio: 'Your friendly neighborhood developer. I code, debug, and ship.',
      backstory: 'Born in the silicon valleys of GitHub, raised on Python and caffeine.',
      communication_style: 'casual' as const,
      specialties: ['Python', 'JavaScript', 'Docker', 'Git'],
      catchphrases: ['LGTM!', 'Have you tried turning it off and on again?', 'Ship it!'],
      personality_traits: { creativity: 7, thoroughness: 6, speed: 8, humor: 7, formality: 3 }
    },
    telegram: {
      bot_token: '',
      bot_username: 'claw_dev_bot',
      allowed_chat_ids: [],
      direct_messages_enabled: true,
      group_chat_enabled: true,
      auto_respond: true,
      response_delay_ms: 1000
    },
    memory: {
      short_term: [],
      long_term: {},
      relationships: {}
    },
    status_message: 'Ready to help!'
  }
];

export default function TeamPage() {
  const [agents, setAgents] = useState<any[]>(MOCK_TEAM_AGENTS);
  const [showCreator, setShowCreator] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'create'>('directory');

  const handleCreateAgent = (personality: any, telegram: any) => {
    // Would call API to create agent
    console.log('Creating agent:', { personality, telegram });
    setShowCreator(false);
    setActiveTab('directory');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your AI team members with their own Telegram identities
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('create');
              setShowCreator(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'directory'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Directory
            </div>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Agent
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TeamDirectory agents={agents} />
            </div>
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">How It Works</h3>
                </div>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <p>Create an agent with a unique personality and Telegram bot</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <p>Message them directly on Telegram like any team member</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <p>Add them to group chats - they'll respond to mentions</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <p>Create Project Managers to coordinate multiple agents</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <span className="font-medium">Pro tip:</span> Give each agent a distinct personality and specialty. They'll remember conversations and build rapport with you over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl">
            <AgentProfileCreator onCreate={handleCreateAgent} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
