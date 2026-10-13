import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOnline) {
      setShowReconnected(true);
      timer = setTimeout(() => setShowReconnected(false), 3500);
    }
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400 animate-bounce">
        <WifiOff className="w-4 h-4 shrink-0 text-white" />
        <div className="flex flex-col">
          <span>Offline Mode Active</span>
          <span className="text-[10px] font-normal text-amber-100">All billing & customer ledger updates are saved locally to device storage</span>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg border border-emerald-400 transition-opacity">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Back Online & Synced</span>
      </div>
    );
  }

  return null;
};
