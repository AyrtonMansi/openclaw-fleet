export interface AgentPersonality {
  name: string;
  handle: string; // Telegram handle like @claw_dev
  avatar_url?: string;
  emoji: string;
  bio: string;
  backstory: string;
  communication_style: 'formal' | 'casual' | 'witty' | 'technical' | 'friendly';
  specialties: string[];
  catchphrases: string[];
  personality_traits: {
    creativity: number; // 1-10
    thoroughness: number;
    speed: number;
    humor: number;
    formality: number;
  };
}

export interface AgentTelegramConfig {
  bot_token: string;
  bot_username: string;
  allowed_chat_ids: string[];
  direct_messages_enabled: boolean;
  group_chat_enabled: boolean;
  auto_respond: boolean;
  response_delay_ms: number; // Simulate typing
}

export interface AgentMemory {
  short_term: string[]; // Recent conversations
  long_term: Record<string, any>; // Learned preferences, facts about users
  relationships: Record<string, {
    user_id: string;
    nickname?: string;
    last_interaction: string;
    topics_discussed: string[];
    rapport_score: number; // 0-100
  }>;
}

export interface TeamAgent extends Agent {
  personality: AgentPersonality;
  telegram: AgentTelegramConfig;
  memory: AgentMemory;
  reports_to?: string; // Agent ID of project manager
  manages?: string[]; // Agent IDs this agent manages
  work_hours?: {
    timezone: string;
    start: string; // HH:mm
    end: string;
  };
  status_message?: string; // Custom status like "Working on API refactor"
  current_task?: {
    description: string;
    started_at: string;
    estimated_completion?: string;
  };
}

export interface TeamDirectory {
  agents: TeamAgent[];
  org_chart: {
    [manager_id: string]: string[]; // manager_id -> list of managed agents
  };
}

export interface TelegramMessage {
  message_id: string;
  from_agent_id: string;
  chat_id: string;
  text: string;
  timestamp: string;
  reply_to?: string;
  attachments?: string[];
}
