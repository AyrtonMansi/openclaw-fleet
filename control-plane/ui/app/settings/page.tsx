'use client';

import { useEffect, useState } from 'react';
import { tokens, audit } from '@/lib/api';
import { RunnerToken, AuditLog } from '@/types';
import DashboardLayout from '../dashboard';
import { StatCard } from '@/components/StatCard';
import { 
  Key, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Trash2,
  Plus,
  X,
  Search,
  Filter
} from 'lucide-react';

export default function SettingsPage() {
  const [tokensList, setTokensList] = useState<RunnerToken[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [newTokenDesc, setNewTokenDesc] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tokensRes, logsRes] = await Promise.all([
        tokens.list(),
        audit.list(),
      ]);
      setTokensList(tokensRes.data);
      setLogs(logsRes.data.slice(0, 50));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenDesc.trim()) return;
    try {
      const res = await tokens.create({ description: newTokenDesc });
      setShowToken(res.data.token);
      setNewTokenDesc('');
      loadData();
    } catch (err) {
      alert('Failed to create token');
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    try {
      await tokens.revoke(id);
      loadData();
    } catch (err) {
      alert('Failed to revoke token');
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
  };

  // Stats
  const activeTokens = tokensList.filter(t => !t.revoked_at).length;
  const revokedTokens = tokensList.filter(t => t.revoked_at).length;
  const recentActions = logs.filter(l => {
    const hoursAgo = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
    return hoursAgo < 24;
  }).length;

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <Plus className="w-4 h-4 text-emerald-500" />;
    if (action.includes('delete') || action.includes('revoke')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes('update')) return <CheckCircle className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage tokens, security, and audit logs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Active Tokens"
            value={activeTokens}
            subtitle="Ready to use"
            icon={Key}
            color="green"
          />
          <StatCard
            title="Revoked Tokens"
            value={revokedTokens}
            subtitle="No longer valid"
            icon={Shield}
            color="gray"
          />
          <StatCard
            title="Actions (24h)"
            value={recentActions}
            subtitle="Audit log entries"
            icon={Clock}
            color="blue"
          />
        </div>

        {/* New Token Modal */}
        {showToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Save Your Token</h3>
                </div>
                <button
                  onClick={() => setShowToken(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Copy this token now!</strong> It will not be shown again.
                  </p>
                </div>
                <div className="relative">
                  <code className="block p-4 bg-gray-900 text-green-400 rounded-lg text-sm font-mono break-all">
                    {showToken}
                  </code>
                  <button
                    onClick={() => handleCopyToken(showToken)}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowToken(null)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  I've Saved It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Token Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Token */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Token
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g., Production Runner, Ayrton's Laptop"
                  value={newTokenDesc}
                  onChange={(e) => setNewTokenDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateToken()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleCreateToken}
                  disabled={!newTokenDesc.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tokens are used to authenticate runner installations. Keep them secure.
              </p>
            </div>

            {/* Tokens List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Runner Tokens
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {tokensList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No tokens yet</p>
                    <p className="text-sm">Create a token to register new runners</p>
                  </div>
                ) : (
                  tokensList.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          token.revoked_at 
                            ? 'bg-gray-100' 
                            : 'bg-emerald-50'
                        }`}>
                          {token.revoked_at ? (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {token.description || 'Unnamed Token'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(token.created_at).toLocaleDateString()}
                            {token.machine_id && (
                              <span className="ml-2 text-blue-600">
                                • Linked to {token.machine_id.slice(0, 8)}...
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          token.revoked_at
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {token.revoked_at ? 'Revoked' : 'Active'}
                        </span>
                        {!token.revoked_at && (
                          <button
                            onClick={() => handleRevokeToken(token.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke token"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Audit Log */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Audit Log
                </h3>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Log Entries */}
              <div className="max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No matching log entries
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getActionIcon(log.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {log.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.user_email || 'System'} • {log.resource_type}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
