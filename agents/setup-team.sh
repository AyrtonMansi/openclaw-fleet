#!/bin/bash
# Setup script for Claw Team Telegram bots

echo "=========================================="
echo "Claw Team - Telegram Bot Setup"
echo "=========================================="
echo ""
echo "You need to create 6 bots with @BotFather on Telegram"
echo ""
echo "Step 1: Message @BotFather on Telegram"
echo "Step 2: Send /newbot 6 times"
echo "Step 3: Use these names:"
echo ""
echo "1. claw_general_bot"
echo "2. claw_dev_bot"
echo "3. claw_research_bot"
echo "4. claw_finance_bot"
echo "5. claw_ops_bot"
echo "6. claw_mining_bot"
echo ""
echo "Step 4: Copy each token and paste below"
echo "=========================================="
echo ""

# Create config directory
sudo mkdir -p /etc/openclaw-runner/agents

# Get tokens from user
echo "Paste token for Claw General (@claw_general_bot):"
read -s GENERAL_TOKEN
echo ""

echo "Paste token for Claw Dev (@claw_dev_bot):"
read -s DEV_TOKEN
echo ""

echo "Paste token for Claw Research (@claw_research_bot):"
read -s RESEARCH_TOKEN
echo ""

echo "Paste token for Claw Finance (@claw_finance_bot):"
read -s FINANCE_TOKEN
echo ""

echo "Paste token for Claw Ops (@claw_ops_bot):"
read -s OPS_TOKEN
echo ""

echo "Paste token for Claw Mining (@claw_mining_bot):"
read -s MINING_TOKEN
echo ""

# Create the config
cat > /tmp/claw-team-config.yaml << EOF
control_plane_url: https://fleet.amansi.com.au/api
runner_token: YOUR_RUNNER_TOKEN_HERE
agents:
  - name: "Claw"
    handle: "claw_general"
    model: gpt-4
    tags: [general, strategy, coordination]
    max_concurrency: 2
    telegram:
      bot_token: "$GENERAL_TOKEN"
      bot_username: "claw_general_bot"
      
  - name: "Claw Dev"
    handle: "claw_dev"
    model: gpt-4
    tags: [coding, infrastructure, devops]
    max_concurrency: 3
    telegram:
      bot_token: "$DEV_TOKEN"
      bot_username: "claw_dev_bot"
      
  - name: "Claw Research"
    handle: "claw_research"
    model: gpt-4
    tags: [research, analysis, due_diligence]
    max_concurrency: 2
    telegram:
      bot_token: "$RESEARCH_TOKEN"
      bot_username: "claw_research_bot"
      
  - name: "Claw Finance"
    handle: "claw_finance"
    model: gpt-4
    tags: [finance, fundraising, modeling]
    max_concurrency: 2
    telegram:
      bot_token: "$FINANCE_TOKEN"
      bot_username: "claw_finance_bot"
      
  - name: "Claw Ops"
    handle: "claw_ops"
    model: gpt-4
    tags: [operations, project_management, execution]
    max_concurrency: 3
    telegram:
      bot_token: "$OPS_TOKEN"
      bot_username: "claw_ops_bot"
      
  - name: "Claw Mining"
    handle: "claw_mining"
    model: gpt-4
    tags: [mining, geology, tenements, processing]
    max_concurrency: 2
    telegram:
      bot_token: "$MINING_TOKEN"
      bot_username: "claw_mining_bot"
EOF

echo ""
echo "Config created!"
echo "Now copy it to the runner:"
echo "  sudo cp /tmp/claw-team-config.yaml /etc/openclaw-runner/config.yaml"
echo "  sudo launchctl stop com.openclaw.runner"
echo "  sudo launchctl start com.openclaw.runner"
echo ""
echo "Then check Fleet Manager - you'll see all 6 agents!"
