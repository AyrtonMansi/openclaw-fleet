export interface User {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
  created_at: string;
  last_login?: string;
}

export interface Machine {
  id: string;
  hostname: string;
  os: string;
  arch: string;
  labels: Record<string, string>;
  runner_version: string;
  last_seen: string;
  status: 'online' | 'offline' | 'degraded';
  agent_count?: number;
  ip_address?: string;
  location?: string;
}

export interface Agent {
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
}

export interface Job {
  id: string;
  created_by: string;
  title: string;
  priority: number;
  routing: {
    required_tags?: string[];
    preferred_machines?: string[];
    preferred_agents?: string[];
  };
  payload: Record<string, any>;
  status: 'queued' | 'leased' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  retries: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  estimated_tokens?: number;
  actual_tokens?: number;
  cost_estimate?: number;
}

export interface Run {
  id: string;
  job_id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  started_at?: string;
  finished_at?: string;
  created_at?: string;
  summary: Record<string, any>;
  agent_name?: string;
  job_title?: string;
  duration_ms?: number;
  tokens_used?: number;
  cost_usd?: number;
}

export interface RunDetail extends Run {
  events: Event[];
  artifacts: Artifact[];
}

export interface Event {
  id: string;
  run_id: string;
  ts: string;
  type: string;
  data: Record<string, any>;
}

export interface Artifact {
  id: string;
  run_id: string;
  name: string;
  storage_uri: string;
  checksum?: string;
  size?: number;
  mime_type?: string;
  created_at: string;
  download_url?: string;
}

export interface RunnerToken {
  id: string;
  token?: string;
  token_hash: string;
  description?: string;
  created_at: string;
  revoked_at?: string;
  machine_id?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export interface FleetStats {
  total_machines: number;
  online_machines: number;
  total_agents: number;
  idle_agents: number;
  busy_agents: number;
  total_jobs_today: number;
  total_tokens_today: number;
  total_cost_today: number;
  avg_job_duration_ms: number;
}

export interface DropletTemplate {
  id: string;
  name: string;
  size: string;
  region: string;
  image: string;
  tags: string[];
  count: number;
}
