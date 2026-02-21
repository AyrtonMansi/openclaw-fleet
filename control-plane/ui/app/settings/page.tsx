'use client';

import { useEffect, useState } from 'react';
import { tokens, audit } from '@/lib/api';
import { RunnerToken, AuditLog, User } from '@/types';
import DashboardLayout from '../dashboard';

export default function SettingsPage() {
  const [tokens, setTokens] = useState<RunnerToken[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [newTokenDesc, setNewTokenDesc] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tokensRes, logsRes] = await Promise.all([
        tokens.list(),
        audit.list(),
      ]);
      setTokens(tokensRes.data);
      setLogs(logsRes.data.slice(0, 20));
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleCreateToken = async () => {
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

        {/* Runner Tokens */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Runner Tokens</h3>

          {showToken && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Copy this token now!</strong> It will not be shown again.
              </p>
              <code className="block p-2 bg-white rounded text-sm break-all">{showToken}</code>
              <button
                onClick={() => setShowToken(null)}
                className="mt-2 text-sm text-yellow-700 hover:text-yellow-900"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Token description"
              value={newTokenDesc}
              onChange={(e) => setNewTokenDesc(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleCreateToken}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Create Token
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{token.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(token.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {token.revoked_at ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Revoked
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!token.revoked_at && (
                      <button
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Log */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.user_email || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.resource_type}:{log.resource_id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
