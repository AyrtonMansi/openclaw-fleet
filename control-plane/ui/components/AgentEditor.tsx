'use client';

import { useState } from 'react';
import { Bot, MessageCircle, Sparkles, Briefcase, Clock, Save, X, Plus, Trash2 } from 'lucide-react';
import { AgentPersonality, AgentTelegramConfig, TeamAgent } from '@/types/team';

interface AgentEditorProps {
  agent?: TeamAgent;
  onSave: (agentData: {
    personality: AgentPersonality;
    telegram: AgentTelegramConfig;
    work_hours?: { timezone: string; start: string; end: string };
  }) => void;
  onCancel: () => void;
}

const EMOJI_OPTIONS = ['🤖', '🐣', '🦉', '🔧', '🎨', '📊', '🚀', '💡', '🔮', '🎯', '🦾', '🧠', '👨‍💻', '👩‍💻', '🧑‍🔬', '⚡', '🔥', '❄️', '🌟', '🎭'];

const COMMUNICATION_STYLES = [
  { value: 'formal', label: 'Formal', description: 'Professional, structured, business-like' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational, friendly' },
  { value: 'witty', label: 'Witty', description: 'Clever, humorous, playful' },
  { value: 'technical', label: 'Technical', description: 'Precise, detailed, jargon-friendly' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, supportive, approachable' },
];

const TIMEZONES = [
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'UTC',
];

export function AgentEditor({ agent, onSave, onCancel }: AgentEditorProps) {
  const isEditing = !!agent;
  
  const [activeTab, setActiveTab] = useState<'personality' | 'telegram' | 'advanced'>('personality');
  
  const [personality, setPersonality] = useState<AgentPersonality>({
    name: agent?.personality?.name || '',
    handle: agent?.personality?.handle || '',
    emoji: agent?.personality?.emoji || '🤖',
    bio: agent?.personality?.bio || '',
    backstory: agent?.personality?.backstory || '',
    communication_style: agent?.personality?.communication_style || 'casual',
    specialties: agent?.personality?.specialties || [],
    catchphrases: agent?.personality?.catchphrases || [],
    personality_traits: agent?.personality?.personality_traits || {
      creativity: 5,
      thoroughness: 5,
      speed: 5,
      humor: 5,
      formality: 5,
    },
  });

  const [telegram, setTelegram] = useState<AgentTelegramConfig>({
    bot_token: agent?.telegram?.bot_token || '',
    bot_username: agent?.telegram?.bot_username || '',
    allowed_chat_ids: agent?.telegram?.allowed_chat_ids || [],
    direct_messages_enabled: agent?.telegram?.direct_messages_enabled ?? true,
    group_chat_enabled: agent?.telegram?.group_chat_enabled ?? true,
    auto_respond: agent?.telegram?.auto_respond ?? true,
    response_delay_ms: agent?.telegram?.response_delay_ms || 1000,
  });

  const [workHours, setWorkHours] = useState({
    timezone: agent?.work_hours?.timezone || 'Australia/Brisbane',
    start: agent?.work_hours?.start || '09:00',
    end: agent?.work_hours?.end || '17:00',
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCatchphrase, setNewCatchphrase] = useState('');

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !personality.specialties.includes(newSpecialty.trim())) {
      setPersonality({
        ...personality,
        specialties: [...personality.specialties, newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setPersonality({
      ...personality,
      specialties: personality.specialties.filter((_, i) => i !== index),
    });
  };

  const handleAddCatchphrase = () => {
    if (newCatchphrase.trim() && !personality.catchphrases.includes(newCatchphrase.trim())) {
      setPersonality({
        ...personality,
        catchphrases: [...personality.catchphrases, newCatchphrase.trim()],
      });
      setNewCatchphrase('');
    }
  };

  const handleRemoveCatchphrase = (index: number) => {
    setPersonality({
      ...personality,
      catchphrases: personality.catchphrases.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    onSave({
      personality,
      telegram,
      work_hours: workHours,
    });
  };

  const updateTrait = (trait: keyof typeof personality.personality_traits, value: number) => {
    setPersonality({
      ...personality,
      personality_traits: {
        ...personality.personality_traits,
        [trait]: value,
      },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Agent' : 'Create New Agent'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditing ? `Editing ${agent?.personality?.name || agent?.name}` : 'Define your agent\'s personality and behavior'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!personality.name || !personality.handle}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Save Changes' : 'Create Agent'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['personality', 'telegram', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {activeTab === 'personality' && (
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{personality.emoji}</span>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {personality.name || 'Unnamed Agent'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{personality.handle || 'handle'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {personality.bio || 'No bio yet...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={personality.name}
                  onChange={(e) => setPersonality({ ...personality, name: e.target.value })}
                  placeholder="e.g., Claw Assistant"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telegram Handle *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500">@</span>
                  <input
                    type="text"
                    value={personality.handle}
                    onChange={(e) => setPersonality({ ...personality, handle: e.target.value })}
                    placeholder="claw_assistant"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Emoji Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setPersonality({ ...personality, emoji })}
                    className={`w-10 h-10 text-2xl rounded-lg border transition-colors ${
                      personality.emoji === emoji
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio & Backstory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={personality.bio}
                onChange={(e) => setPersonality({ ...personality, bio: e.target.value })}
                placeholder="Short description of who this agent is..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backstory
              </label>
              <textarea
                value={personality.backstory}
                onChange={(e) => setPersonality({ ...personality, backstory: e.target.value })}
                placeholder="The agent's origin story, how they came to be..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Communication Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Communication Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMUNICATION_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setPersonality({ ...personality, communication_style: style.value as any })}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      personality.communication_style === style.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{style.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Personality Traits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Personality Traits (1-10)
              </label>
              <div className="space-y-3">
                {Object.entries(personality.personality_traits).map(([trait, value]) => (
                  <div key={trait} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">{trait}</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={value}
                      onChange={(e) => updateTrait(trait as any, parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="w-8 text-sm font-medium text-gray-900 dark:text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                Specialties
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {personality.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full"
                  >
                    {specialty}
                    <button
                      onClick={() => handleRemoveSpecialty(index)}
                      className="hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialty()}
                  placeholder="Add a specialty..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleAddSpecialty}
                  disabled={!newSpecialty.trim()}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Catchphrases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Catchphrases
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {personality.catchphrases.map((phrase, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full"
                  >
                    "{phrase}"
                    <button
                      onClick={() => handleRemoveCatchphrase(index)}
                      className="hover:text-purple-900 dark:hover:text-purple-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatchphrase}
                  onChange={(e) => setNewCatchphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCatchphrase()}
                  placeholder="Add a catchphrase..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleAddCatchphrase}
                  disabled={!newCatchphrase.trim()}
                  className="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>How to create a Telegram bot:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                <li>Message <a href="https://t.me/botfather" target="_blank" className="underline">@BotFather</a> on Telegram</li>
                <li>Send <code>/newbot</code></li>
                <li>Follow the prompts to name your bot</li>
                <li>Copy the API token here</li>
                <li>Start chatting with your agent!</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={telegram.bot_token}
                onChange={(e) => setTelegram({ ...telegram, bot_token: e.target.value })}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Keep this secret! Never share your bot token.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Username
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg text-gray-500">@</span>
                <input
                  type="text"
                  value={telegram.bot_username}
                  onChange={(e) => setTelegram({ ...telegram, bot_username: e.target.value })}
                  placeholder="my_claw_bot"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={telegram.direct_messages_enabled}
                  onChange={(e) => setTelegram({ ...telegram, direct_messages_enabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow direct messages</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={telegram.group_chat_enabled}
                  onChange={(e) => setTelegram({ ...telegram, group_chat_enabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Allow group chat messages</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={telegram.auto_respond}
                  onChange={(e) => setTelegram({ ...telegram, auto_respond: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-respond to messages</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Response Delay (ms)
              </label>
              <input
                type="number"
                value={telegram.response_delay_ms}
                onChange={(e) => setTelegram({ ...telegram, response_delay_ms: parseInt(e.target.value) || 0 })}
                min={0}
                max={10000}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Simulates typing time. 0 for instant responses.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Work Hours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timezone
                  </label>
                  <select
                    value={workHours.timezone}
                    onChange={(e) => setWorkHours({ ...workHours, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={workHours.start}
                    onChange={(e) => setWorkHours({ ...workHours, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={workHours.end}
                    onChange={(e) => setWorkHours({ ...workHours, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                The agent will indicate when it\'s outside working hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
