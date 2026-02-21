"""Telegram bot integration for agents."""

import asyncio
import logging
from typing import Dict, List, Optional
from telegram import Update, Bot
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters
)

logger = logging.getLogger(__name__)


class AgentTelegramBot:
    """Telegram bot wrapper for an agent."""
    
    def __init__(self, agent_id: str, bot_token: str, agent_name: str):
        self.agent_id = agent_id
        self.bot_token = bot_token
        self.agent_name = agent_name
        self.application: Optional[Application] = None
        self.conversation_history: Dict[str, List[dict]] = {}
        
    async def start(self):
        """Start the bot."""
        self.application = (
            Application.builder()
            .token(self.bot_token)
            .build()
        )
        
        # Add handlers
        self.application.add_handler(CommandHandler("start", self.cmd_start))
        self.application.add_handler(CommandHandler("help", self.cmd_help))
        self.application.add_handler(CommandHandler("status", self.cmd_status))
        self.application.add_handler(CommandHandler("agents", self.cmd_agents))
        self.application.add_handler(CommandHandler("job", self.cmd_job))
        
        # Handle mentions and direct messages
        self.application.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message)
        )
        
        await self.application.initialize()
        await self.application.start()
        logger.info(f"Agent {self.agent_name} bot started")
        
    async def stop(self):
        """Stop the bot."""
        if self.application:
            await self.application.stop()
            
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        welcome = f"""
🔧 **{self.agent_name}**

Ready to work. I'm connected to your OpenClaw Fleet.

**Quick commands:**
/status - Check fleet status
/agents - List available agents  
/job - Create a new job
/help - Show all commands

Or just message me directly with what you need.
        """
        await update.message.reply_text(welcome, parse_mode='Markdown')
        
    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command."""
        help_text = f"""
**{self.agent_name} Commands**

/start - Start working with me
/status - Fleet status and health
/agents - List all agents and their status
/job <description> - Create a new job
/help - Show this help

**Direct Messages:**
Just send me any task or question. I can:
• Write and deploy code
• Manage infrastructure
• Coordinate other agents
• Review work and give feedback
        """
        await update.message.reply_text(help_text, parse_mode='Markdown')
        
    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command."""
        # This would fetch from the Fleet API
        status = """
📊 **Fleet Status**

🟢 Online: 1 machine
🟢 Idle: 1 agent
⚪ Queued jobs: 0

All systems operational.
        """
        await update.message.reply_text(status, parse_mode='Markdown')
        
    async def cmd_agents(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /agents command."""
        agents_list = """
🤖 **Available Agents**

1. **mac-studio-main** @ ayrtons-Laptop.local
   Status: 🟢 Idle
   Tags: general, mac, local
   Capabilities: General tasks

Message any agent directly or create a job and I'll route it.
        """
        await update.message.reply_text(agents_list, parse_mode='Markdown')
        
    async def cmd_job(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /job command."""
        if not context.args:
            await update.message.reply_text(
                "Usage: /job <description>\n\n"
                "Example: /job Deploy the new API endpoint"
            )
            return
            
        job_desc = ' '.join(context.args)
        
        # This would create a job via the Fleet API
        await update.message.reply_text(
            f"✅ Created job: _{job_desc}_\n\n"
            f"Routing to available agent...",
            parse_mode='Markdown'
        )
        
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle direct messages."""
        chat_id = update.effective_chat.id
        message_text = update.message.text
        user = update.effective_user
        
        # Store in conversation history
        if chat_id not in self.conversation_history:
            self.conversation_history[chat_id] = []
            
        self.conversation_history[chat_id].append({
            'role': 'user',
            'name': user.first_name,
            'text': message_text,
            'timestamp': update.message.date.isoformat()
        })
        
        # Simple acknowledgment for now
        # In real implementation, this would call the agent's LLM
        await update.message.reply_text(
            f"Got it. Working on: _{message_text[:100]}..._\n\n"
            f"(Full agent response system coming soon)",
            parse_mode='Markdown'
        )
        
    def get_conversation_history(self, chat_id: str) -> List[dict]:
        """Get conversation history for a chat."""
        return self.conversation_history.get(chat_id, [])
