#!/bin/bash
# Cloud-init for Claw Agent Droplet
# Paste this into DigitalOcean user data when creating droplet

# Update and install dependencies
apt-get update
apt-get install -y python3-pip python3-venv git curl

# Create agent directory
mkdir -p /opt/claw-agent
cd /opt/claw-agent

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install httpx pyyaml python-telegram-bot

# Download runner
curl -fsSL https://raw.githubusercontent.com/AyrtonMansi/openclaw-fleet/main/runner/runner.py -o runner.py

# Create config (YOU EDIT THESE VALUES)
cat > /opt/claw-agent/config.yaml << 'EOF'
control_plane_url: https://fleet.amansi.com.au/api
runner_token: YOUR_RUNNER_TOKEN_FROM_FLEET

agents:
  - name: "Claw AGENT_NAME"  # e.g., "Claw Dev"
    handle: "claw_AGENT_HANDLE"  # e.g., "claw_dev"
    model: gpt-4
    tags: [AGENT_TAGS]  # e.g., [coding, infrastructure]
    max_concurrency: 2
    telegram:
      bot_token: "YOUR_BOT_TOKEN_FROM_BOTFATHER"
      bot_username: "claw_AGENT_bot"  # e.g., "claw_dev_bot"
EOF

# Create systemd service
cat > /etc/systemd/system/claw-agent.service << 'EOF'
[Unit]
Description=Claw Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/claw-agent
Environment=PYTHONPATH=/opt/claw-agent
ExecStart=/opt/claw-agent/venv/bin/python /opt/claw-agent/runner.py
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable claw-agent
systemctl start claw-agent

echo "Claw Agent installed!"
echo "Check status: systemctl status claw-agent"
echo "View logs: journalctl -u claw-agent -f"
