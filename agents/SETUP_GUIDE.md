# Claw Team - Agent Setup Guide

## Architecture

Each agent runs on its own DigitalOcean droplet:
- **1 vCPU, 1 GB RAM** minimum per agent ($6/mo each)
- **Ubuntu 22.04**
- **Auto-starts** on boot
- **Telegram bot** for direct communication
- **Connects to Fleet Manager** for coordination

## Prerequisites

1. **Fleet Manager running** at https://fleet.amansi.com.au
2. **Runner token** from Fleet Manager → Settings → Runner Tokens
3. **6 Telegram bots** created with @BotFather

## Step 1: Create Telegram Bots

Message @BotFather on Telegram:

```
/newbot
Claw General
claw_general_bot

/newbot
Claw Dev
claw_dev_bot

/newbot
Claw Research
claw_research_bot

/newbot
Claw Finance
claw_finance_bot

/newbot
Claw Ops
claw_ops_bot

/newbot
Claw Mining
claw_mining_bot
```

Save all 6 tokens.

## Step 2: Get Runner Token

1. Go to https://fleet.amansi.com.au
2. Login → Settings → Runner Tokens
3. Create token: "Claw Team"
4. Copy the token

## Step 3: Create Droplets

For each agent, create a droplet:

### Agent 1: Claw-General (Coordinator)
- **Droplet**: Basic (1 CPU, 1 GB)
- **Region**: Sydney (syd1)
- **Image**: Ubuntu 22.04
- **User Data**: Use cloud-init below with these values:

```yaml
AGENT_NAME: "Claw"
AGENT_HANDLE: "claw_general"
AGENT_TAGS: "general, strategy, coordination"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_general_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

### Agent 2: Claw-Dev
- **Droplet**: Basic (1 CPU, 1 GB)
- **User Data**:

```yaml
AGENT_NAME: "Claw Dev"
AGENT_HANDLE: "claw_dev"
AGENT_TAGS: "coding, infrastructure, devops"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_dev_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

### Agent 3: Claw-Research
```yaml
AGENT_NAME: "Claw Research"
AGENT_HANDLE: "claw_research"
AGENT_TAGS: "research, analysis, due_diligence"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_research_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

### Agent 4: Claw-Finance
```yaml
AGENT_NAME: "Claw Finance"
AGENT_HANDLE: "claw_finance"
AGENT_TAGS: "finance, fundraising, modeling"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_finance_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

### Agent 5: Claw-Ops
```yaml
AGENT_NAME: "Claw Ops"
AGENT_HANDLE: "claw_ops"
AGENT_TAGS: "operations, project_management"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_ops_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

### Agent 6: Claw-Mining
```yaml
AGENT_NAME: "Claw Mining"
AGENT_HANDLE: "claw_mining"
AGENT_TAGS: "mining, geology, tenements, processing"
BOT_TOKEN: "paste_from_botfather"
BOT_USERNAME: "claw_mining_bot"
RUNNER_TOKEN: "paste_from_fleet_manager"
```

## Step 4: Verify

1. Go to https://fleet.amansi.com.au/fleet
2. You should see 6 machines (the droplets)
3. You should see 6 agents
4. Message each bot on Telegram - they should respond

## Cost

- 6 droplets × $6/mo = **$36/month**
- Plus Fleet Manager VPS = **$12/month**
- **Total: ~$48/month** for full Claw Team

## Troubleshooting

**Agent not showing in Fleet Manager:**
```bash
ssh root@DROPLET_IP
journalctl -u claw-agent -f
```

**Telegram bot not responding:**
- Check bot token is correct
- Message @BotFather: /setprivacy → Disable

**Want to add more agents:**
Just create more droplets with the same cloud-init, different name/token.
