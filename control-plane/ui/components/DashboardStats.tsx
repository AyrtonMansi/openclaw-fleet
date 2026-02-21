import { FleetStats } from '@/types';
import { LucideIcon } from 'lucide-react';

interface DashboardStatsProps {
  stats: FleetStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Machines */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Machines</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_machines}</p>
            <p className="text-xs text-emerald-600 mt-1">{stats.online_machines} online</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Agents</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_agents}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-emerald-600">{stats.idle_agents} idle</span>
              <span className="text-xs text-blue-600">{stats.busy_agents} busy</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Jobs Today */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Jobs Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_jobs_today}</p>
            <p className="text-xs text-gray-500 mt-1">
              Avg {(stats.avg_job_duration_ms / 1000).toFixed(1)}s
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tokens Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_tokens_today > 1000000 
                ? (stats.total_tokens_today / 1000000).toFixed(1) + 'M'
                : stats.total_tokens_today > 1000
                ? (stats.total_tokens_today / 1000).toFixed(1) + 'K'
                : stats.total_tokens_today}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ${stats.total_cost_today.toFixed(2)} estimated
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
