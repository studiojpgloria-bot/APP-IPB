import React from 'react';
import { WifiOff } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { useOnlineStatus } from '../../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { cacheMetadata } = useChurch();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-900/95 border border-amber-700 px-4 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-xs">
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
      <div>
        <span className="font-bold block">Modo Offline Ativo</span>
        <span className="text-[11px] text-amber-200">
          Usando cache local ({cacheMetadata.notesCount} notas salvas no aparelho)
        </span>
      </div>
    </div>
  );
};
