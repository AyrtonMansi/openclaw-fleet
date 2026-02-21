'use client';

import { useState } from 'react';
import { Cloud, Plus, Server, Trash2, Copy } from 'lucide-react';

interface DropletConfig {
  count: number;
  size: string;
  region: string;
  name_prefix: string;
}

const DROPLET_SIZES = [
  { value: 's-1vcpu-1gb', label: 'Basic (1 CPU, 1 GB RAM) - $6/mo', cost: 6 },
  { value: 's-1vcpu-2gb', label: 'Standard (1 CPU, 2 GB RAM) - $12/mo', cost: 12 },
  { value: 's-2vcpu-2gb', label: 'Pro (2 CPU, 2 GB RAM) - $18/mo', cost: 18 },
  { value: 's-2vcpu-4gb', label: 'Pro+ (2 CPU, 4 GB RAM) - $24/mo', cost: 24 },
];

const REGIONS = [
  { value: 'nyc1', label: 'New York (NYC1)' },
  { value: 'nyc3', label: 'New York (NYC3)' },
  { value: 'sfo3', label: 'San Francisco (SFO3)' },
  { value: 'ams3', label: 'Amsterdam (AMS3)' },
  { value: 'sgp1', label: 'Singapore (SGP1)' },
  { value: 'lon1', label: 'London (LON1)' },
  { value: 'fra1', label: 'Frankfurt (FRA1)' },
  { value: 'tor1', label: 'Toronto (TOR1)' },
  { value: 'blr1', label: 'Bangalore (BLR1)' },
  { value: 'syd1', label: 'Sydney (SYD1)' },
];

export function DropletProvisioner() {
  const [config, setConfig] = useState<DropletConfig>({
    count: 1,
    size: 's-1vcpu-1gb',
    region: 'syd1',
    name_prefix: 'openclaw-agent',
  });
  const [showCloudInit, setShowCloudInit] = useState(false);

  const selectedSize = DROPLET_SIZES.find(s => s.value === config.size);
  const totalCost = (selectedSize?.cost || 0) * config.count;

  const generateCloudInit = () => {
    return `#cloud-config
package_update: true
packages:
  - docker.io
  - docker-compose
  - git
  - curl

runcmd:
  # Install runner
  - mkdir -p /opt/openclaw-runner
  - cd /opt/openclaw-runner
  - curl -fsSL https://raw.githubusercontent.com/AyrtonMansi/openclaw-fleet/main/runner/runner.py -o runner.py
  - curl -fsSL https://raw.githubusercontent.com/AyrtonMansi/openclaw-fleet/main/runner/requirements.txt -o requirements.txt
  - pip3 install -r requirements.txt
  
  # Create config
  - |
    cat > /etc/openclaw-runner/config.yaml << 'EOF'
    control_plane_url: https://fleet.amansi.com.au/api
    runner_token: YOUR_TOKEN_HERE
    agents:
      - name: ${config.name_prefix}-\$HOSTNAME
        model: gpt-4
        tags: [cloud, ${config.region}, auto-provisioned]
        max_concurrency: 2
    EOF
  
  # Create systemd service
  - |
    cat > /etc/systemd/system/openclaw-runner.service << 'EOF'
    [Unit]
    Description=OpenClaw Fleet Runner
    After=network.target
    
    [Service]
    Type=simple
    ExecStart=/usr/bin/python3 /opt/openclaw-runner/runner.py
    Restart=always
    RestartSec=10
    
    [Install]
    WantedBy=multi-user.target
    EOF
  
  - systemctl daemon-reload
  - systemctl enable openclaw-runner
  - systemctl start openclaw-runner

final_message: "OpenClaw Runner installed and started"
`;
  };

  const copyCloudInit = () => {
    navigator.clipboard.writeText(generateCloudInit());
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">Provision Droplets</h3>
      </div>

      <div className="space-y-4">
        {/* Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Droplets
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.count}
            onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Droplet Size
          </label>
          <select
            value={config.size}
            onChange={(e) => setConfig({ ...config, size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {DROPLET_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            value={config.region}
            onChange={(e) => setConfig({ ...config, region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name Prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name Prefix
          </label>
          <input
            type="text"
            value={config.name_prefix}
            onChange={(e) => setConfig({ ...config, name_prefix: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Cost Estimate */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated Cost:</span>
            <span className="font-semibold">${totalCost}/month</span>
          </div>
        </div>

        {/* Cloud-init Toggle */}
        <button
          onClick={() => setShowCloudInit(!showCloudInit)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg"
        >
          {showCloudInit ? 'Hide Cloud-init Script' : 'Show Cloud-init Script'}
        </button>

        {/* Cloud-init Script */}
        {showCloudInit && (
          <div className="relative">
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
              {generateCloudInit()}
            </pre>
            <button
              onClick={copyCloudInit}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded text-white hover:bg-gray-600"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">To provision:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copy the cloud-init script</li>
            <li>Go to DigitalOcean → Create Droplet</li>
            <li>Select size: {selectedSize?.label.split(' - ')[0]}</li>
            <li>Select region: {REGIONS.find(r => r.value === config.region)?.label}</li>
            <li>Paste cloud-init in User Data</li>
            <li>Create {config.count} droplets</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
