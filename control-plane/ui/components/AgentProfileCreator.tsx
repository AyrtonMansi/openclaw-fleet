'use client';

import { useState } from 'react';
import { Bot, MessageCircle, User, Sparkles, Briefcase } from 'lucide-react';
import { AgentPersonality, AgentTelegramConfig } from '@/types/team';

interface AgentProfileCreatorProps {
  onCreate: (personality: AgentPersonality, telegram: AgentTelegramConfig) => void;
}

const PERSONALITY_PRESETS = [
  {
    name: 'Claw Junior',
    description: 'Eager junior dev, asks questions, learns fast',
    emoji: '🐣',
    style: 'casual',
    traits: { creativity: 7, thoroughness: 6, speed: 8, humor: 5, formality: 3 }
  },
  {
    name: 'Claw Senior',
    description: 'Experienced architect, thoughtful, thorough',
    emoji: '🦉',
    style: 'technical',
    traits: { creativity: 6, thoroughness: 9, speed: 5, humor: 3, formality: 6 }
  },
  {
    name: 'Claw DevOps',
    description: 'Infrastructure wizard, precise, reliable',
    emoji: '🔧',
    style: 'technical',
    traits: { creativity: 5, thoroughness: 10, speed: 7, humor: 4, formality: 5 }
  },
  {
    name: 'Claw Creative',
    description: 'Out-of-the-box thinker, witty, innovative',
    emoji: '🎨',
    style: 'witty',
    traits: { creativity: 10, thoroughness: 5, speed: 6, humor: 9, formality: 2 }
  },
  {
    name: 'Claw PM',
    description: 'Project manager, organized, communicative',
    emoji: '📊',
    style: 'formal',
    traits: { creativity: 6, thoroughness: 8, speed: 7, humor: 5, formality: 7 }
  }
];

export function AgentProfileCreator({ onCreate }: AgentProfileCreatorProps) {
  const [step, setStep] = useState<'personality' | 'telegram' | 'review'>('personality');
  const [selectedPreset, setSelectedPreset] = useState<typeof PERSONALITY_PRESETS[0] | null>(null);
  
  const [personality, setPersonality] = useState<AgentPersonality>({
    name: '',
    handle: '',
    emoji: '🤖',
    bio: '',
    backstory: '',
    communication_style: 'casual',
    specialties: [],
    catchphrases: [],
    personality_traits: {
      creativity: 5,
      thoroughness: 5,
      speed: 5,
      humor: 5,
      formality: 5
    }
  });

  const [telegram, setTelegram] = useState<AgentTelegramConfig>({
    bot_token: '',
    bot_username: '',
    allowed_chat_ids: [],
    direct_messages_enabled: true,
    group_chat_enabled: true,
    auto_respond: true,
    response_delay_ms: 1000
  });

  const applyPreset = (preset: typeof PERSONALITY_PRESETS[0]) => {
    setSelectedPreset(preset);
    setPersonality({
      ...personality,
      name: preset.name,
      emoji: preset.emoji,
      communication_style: preset.style as AgentPersonality['communication_style'],
      personality_traits: preset.traits,
      bio: `I'm ${preset.name}, ${preset.description.toLowerCase()}.`,
      backstory: `Created as part of the OpenClaw Fleet to assist with ${preset.description.toLowerCase()}. I'm here to help and learn alongside the team.`
    });
  };

  const handleCreate = () => {
    onCreate(personality, telegram);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900">Create Agent Profile</h3>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className={`px-3 py-1 rounded-full ${step === 'personality' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          1. Personality
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 'telegram' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          2. Telegram
        </span>
        <span className="text-gray-300">→</span>
        <span className={`px-3 py-1 rounded-full ${step === 'review' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          3. Review
        </span>
      </div>

      {/* Step 1: Personality */}
      {step === 'personality' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose a preset or customize:</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONALITY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`p-4 border rounded-xl text-left transition-colors ${
                  selectedPreset?.name === preset.name
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{preset.emoji}</span>
                  <span className="font-medium">{preset.name}</span>
                </div>
                <p className="text-sm text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>

          {selectedPreset && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={personality.name}
                  onChange={(e) => setPersonality({ ...personality, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Handle</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">@</span>
                  <input
                    type="text"
                    value={personality.handle}
                    onChange={(e) => setPersonality({ ...personality, handle: e.target.value })}
                    placeholder="claw_assistant"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={personality.bio}
                  onChange={(e) => setPersonality({ ...personality, bio: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={personality.specialties.join(', ')}
                  onChange={(e) => setPersonality({ ...personality, specialties: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="Python, Docker, APIs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                onClick={() => setStep('telegram')}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Continue to Telegram Setup
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Telegram */}
      {step === 'telegram' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">How to get a Telegram Bot Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message <a href="https://t.me/botfather" target="_blank" className="underline">@BotFather</a> on Telegram</li>
              <li>Send /newbot</li>
              <li>Follow the prompts to create your bot</li>
              <li>Copy the token here</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
            <input
              type="password"
              value={telegram.bot_token}
              onChange={(e) => setTelegram({ ...telegram, bot_token: e.target.value })}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bot Username</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">@</span>
              <input
                type="text"
                value={telegram.bot_username}
                onChange={(e) => setTelegram({ ...telegram, bot_username: e.target.value })}
                placeholder="my_claw_bot"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={telegram.direct_messages_enabled}
                onChange={(e) => setTelegram({ ...telegram, direct_messages_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Allow direct messages</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={telegram.group_chat_enabled}
                onChange={(e) => setTelegram({ ...telegram, group_chat_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Allow group chat messages</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('personality')}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={!telegram.bot_token || !telegram.bot_username}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
            <span className="text-4xl">{personality.emoji}</span>
            <div>
              <h4 className="font-semibold text-lg">{personality.name}</h4>
              <p className="text-sm text-gray-600">@{personality.handle}</p>
              <p className="text-sm text-gray-500">@{telegram.bot_username} on Telegram</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <p><span className="font-medium">Style:</span> {personality.communication_style}</p>
            <p><span className="font-medium">Specialties:</span> {personality.specialties.join(', ')}</p>
            <p><span className="font-medium">Bio:</span> {personality.bio}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-800 mb-1">What happens next:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Agent will be created in your fleet</li>
              <li>Telegram bot will be connected</li>
              <li>You can DM @{telegram.bot_username} directly</li>
              <li>Agent can join group chats and respond to mentions</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('telegram')}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Agent Team Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
