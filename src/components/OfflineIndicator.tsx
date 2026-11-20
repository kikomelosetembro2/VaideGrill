import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white border border-[#D4A017] px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold"
    >
      <WifiOff className="w-4 h-4 text-[#D4A017] shrink-0" />
      <span>
        Sem conexão com a internet · O cardápio salvo continua disponível offline.
      </span>
    </div>
  );
};
