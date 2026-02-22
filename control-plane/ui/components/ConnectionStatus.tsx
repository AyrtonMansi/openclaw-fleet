'use client';

import { useFleetRealtime } from '@/lib/websocket';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const { status, isConnected } = useFleetRealtime();

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Live',
          className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Connecting...',
          className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        };
      case 'error':
      case 'disconnected':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Offline',
          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${display.className}`}>
      {display.icon}
      <span>{display.text}</span>
    </div>
  );
}
