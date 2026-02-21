'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity, Clock, AlertTriangle } from 'lucide-react';
import { Machine } from '@/types';

interface ConnectionMonitorProps {
  machines: Machine[];
}

interface ConnectionStatus {
  machineId: string;
  hostname: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency?: number;
  lastSeen: string;
  error?: string;
}

export function ConnectionMonitor({ machines }: ConnectionMonitorProps) {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);

  useEffect(() => {
    // Map machines to connection status
    const statuses: ConnectionStatus[] = machines.map(m => {
      const lastSeen = new Date(m.last_seen);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
      
      let status: ConnectionStatus['status'] = 'connected';
      if (diffSeconds > 120) status = 'disconnected';
      else if (diffSeconds > 60) status = 'degraded';
      
      return {
        machineId: m.id,
        hostname: m.hostname,
        status,
        lastSeen: m.last_seen,
      };
    });
    
    setConnections(statuses);
  }, [machines]);

  const connected = connections.filter(c => c.status === 'connected').length;
  const degraded = connections.filter(c => c.status === 'degraded').length;
  const disconnected = connections.filter(c => c.status === 'disconnected').length;

  const getStatusIcon = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      case 'degraded':
        return <Activity className="w-4 h-4 text-amber-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusClass = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'degraded':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'disconnected':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const formatLastSeen = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Connection Status</h3>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
            {connected} up
          </span>
          {degraded > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
              {degraded} slow
            </span>
          )}
          {disconnected > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              {disconnected} down
            </span>
          )}
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No machines connected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.machineId}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusClass(conn.status)}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(conn.status)}
                <div>
                  <p className="font-medium text-sm">{conn.hostname}</p>
                  <p className="text-xs opacity-75">
                    Last seen {formatLastSeen(conn.lastSeen)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full bg-white/50`}>
                  {conn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {disconnected > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">{disconnected} machine(s) disconnected</p>
            <p className="text-red-700">
              Check that runners are running on those machines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
