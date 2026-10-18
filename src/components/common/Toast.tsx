import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useChurch();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 border-rose-700 text-white'
              : toast.type === 'info'
              ? 'bg-stone-900/95 border-stone-700 text-white'
              : 'bg-[#344E41]/95 border-emerald-700 text-white'
          }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-stone-300 shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />}
          <span className="font-medium flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
