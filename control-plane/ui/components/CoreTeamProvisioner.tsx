'use client';

import { useState } from 'react';
import { Copy, Server, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const CORE_TEAM = [
  {
    id: 'general',
    name: 'Claw-General',
    handle: 'claw_general',
    emoji: '🔧',
    description: 'You. Strategy, coordination, system design',
    tags: 'general, strategy, coordination, architecture',
    droplet_size: 's-1vcpu-1gb',
    cost: 6,
    role: 'Coordinator'
  },
  {
    id: 'engineer',
    name: 'Claw-Global Engineer',
    handle: 'claw_engineer',
    emoji: '🌐',
    description: 'Infrastructure, DevOps, cloud, security',
    tags: 'devops, infrastructure, cloud, security',
    droplet_size: 's-1vcpu-2gb',
    cost: 12,
    role: 'Infrastructure'
  },
  {
    id: 'software',
    name: 'Claw-Software Dev',
    handle: 'claw_software',
    emoji: '💻',
    description: 'Code, features, APIs, shipped daily',
    tags: 'coding, frontend, backend, apis',
    droplet_size: 's-1vcpu-2gb',
    cost: 12,
    role: 'Development'
  },
  {
    id: 'business',
    name: 'Claw-Business Manager',
    handle: 'claw_business',
    emoji: '📊',
    description: 'Project management, coordination, deadlines',
    tags: 'project_management, coordination, reporting',
    droplet_size: 's-1vcpu-1gb',
    cost: 6,
    role: 'Management'
  }
];

export function CoreTeamProvisioner() {
  const [runnerToken, setRunnerToken] = useState('');
  const [botTokens, setBotTokens] = useState<Record<string, string>>({});
  const [generatedScript, setGeneratedScript] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [step, setStep] = useState<'tokens' | 'generate' | 'deploy'>('tokens');

  const totalCost = CORE_TEAM.reduce((acc, a) => acc + a.cost, 0);

  const generateAllScripts = () => {
    const scripts = CORE_TEAM.map(agent => `#!/bin/bash
# =====================================================
# ${agent.name} - ${agent.role}
# Droplet: ${agent.droplet_size} ($${agent.cost}/mo)
# Telegram: @${agent.handle}_bot
# =====================================================

apt-get update
apt-get install -y python3-pip python3-venv git curl

mkdir -p /opt/claw-agent
cd /opt/claw-agent

python3 -m venv venv
source venv/bin/activate

pip install httpx pyyaml python-telegram-bot 2>/dev/null

curl -fsSL https://raw.githubusercontent.com/AyrtonMansi/openclaw-fleet/main/runner/runner.py -o runner.py

cat > /opt/claw-agent/config.yaml << 'EOF'
control_plane_url: https://fleet.amansi.com.au/api
runner_token: "${runnerToken}"

agents:
  - name: "${agent.name}"
    handle: "${agent.handle}"
    model: gpt-4
    tags: [${agent.tags}]
    max_concurrency: 2
    telegram:
      bot_token: "${botTokens[agent.id] || 'PASTE_BOT_TOKEN'}"
      bot_username: "${agent.handle}_bot"
EOF

cat > /etc/systemd/system/claw-agent.service << 'EOF'
[Unit]
Description=${agent.name}
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/claw-agent
ExecStart=/opt/claw-agent/venv/bin/python /opt/claw-agent/runner.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable claw-agent
systemctl start claw-agent

echo "${agent.name} is online!"
`).join('\n\n# =====================================================\n');

    setGeneratedScript(scripts);
    setStep('deploy');
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generatedScript);
  };

  const allTokensEntered = CORE_TEAM.every(a => botTokens[a.id]?.length > 20);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">Core Team (4 Agents)</h3>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
          ${totalCost + 12}/mo total
        </span>
      </div>

      {/* Cost Breakdown */}
      <div className="p-3 bg-gray-50 rounded-lg mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">4 Agents (DO Droplets):</span>
          <span className="font-medium">${totalCost}/mo</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Fleet Manager VPS:</span>
          <span className="font-medium">$12/mo</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-900 font-medium">Total:</span>
          <span className="text-indigo-600 font-bold">${totalCost + 12}/mo</span>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {CORE_TEAM.map((agent) => (
          <div
            key={agent.id}
            className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{agent.emoji}</span>
              <div>
                <p className="font-medium text-sm">{agent.name}</p>
                <p className="text-xs text-gray-500">{agent.role}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">@{agent.handle}_bot</span>
              <span className="font-medium text-indigo-600">${agent.cost}/mo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Steps */}
      {step === 'tokens' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
            <p className="font-medium mb-1">Step 1: Create Telegram Bots</p>
            <p>Message @BotFather and create 4 bots:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {CORE_TEAM.map(a => (
                <li key={a.id}>@{a.handle}_bot</li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fleet Manager Runner Token
            </label>
            <input
              type="text"
              value={runnerToken}
              onChange={(e) => setRunnerToken(e.target.value)}
              placeholder="From Settings → Runner Tokens"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Bot Tokens (from @BotFather):</p>
            {CORE_TEAM.map((agent) => (
              <div key={agent.id}>
                <label className="text-xs text-gray-500">{agent.name} (@{agent.handle}_bot)</label>
                <input
                  type="password"
                  value={botTokens[agent.id] || ''}
                  onChange={(e) => setBotTokens({ ...botTokens, [agent.id]: e.target.value })}
                  placeholder="Paste token here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('generate')}
            disabled={!runnerToken || !allTokensEntered}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate Deploy Scripts
          </button>
        </div>
      )}

      {step === 'generate' && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Ready to generate deployment scripts for 4 agents</p>
          <button
            onClick={generateAllScripts}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Generate All 4 Scripts
          </button>
          <button
            onClick={() => setStep('tokens')}
            className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Edit tokens
          </button>
        </div>
      )}

      {step === 'deploy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Cloud-Init Scripts</h4>
            <button
              onClick={copyScript}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
              Copy All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {CORE_TEAM.map((agent) => (
              <div key={agent.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span>{agent.emoji}</span>
                    <span className="font-medium text-sm">{agent.name}</span>
                    <span className="text-xs text-gray-400">(${agent.cost}/mo)</span>
                  </div>
                  {expandedAgent === agent.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedAgent === agent.id && (
                  <div className="p-3 bg-gray-900 text-gray-100 text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {generatedScript.split('# =====================================================')[CORE_TEAM.findIndex(a => a.id === agent.id) + 1]}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg text-sm">
            <p className="font-medium text-indigo-900 mb-2">Deploy Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-indigo-800">
              <li>Create 4 DigitalOcean droplets (Ubuntu 22.04)</li>
              <li>Use sizes: 2× 1GB ($6) + 2× 2GB ($12)</li>
              <li>Paste each agent's cloud-init script</li>
              <li>Wait 2-3 minutes for provisioning</li>
              <li>Check Fleet Manager - all 4 agents should appear</li>
              <li>Message each on Telegram to test</li>
            </ol>
          </div>

          <a
            href="https://cloud.digitalocean.com/droplets/new"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            Open DigitalOcean
          </a>
        </div>
      )}
    </div>
  );
}
