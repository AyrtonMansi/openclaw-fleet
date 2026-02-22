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

export interface TeamAgent {
  // Base Agent fields
  id: string;
  machine_id: string;
  name: string;
  model: string;
  tags: string[];
  tools: string[];
  max_concurrency: number;
  status: 'idle' | 'busy' | 'error' | 'offline';
  current_run_id?: string;
  last_error?: string;
  updated_at: string;
  machine_hostname?: string;
  total_jobs_completed?: number;
  total_tokens_used?: number;
  avg_response_time_ms?: number;
  is_project_manager?: boolean;
  managed_agents?: string[];
  // Team-specific fields
  personality?: AgentPersonality;
  telegram?: AgentTelegramConfig;
  memory?: AgentMemory;
  reports_to?: string;
  manages?: string[];
  work_hours?: {
    timezone: string;
    start: string;
    end: string;
  };
  status_message?: string;
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
