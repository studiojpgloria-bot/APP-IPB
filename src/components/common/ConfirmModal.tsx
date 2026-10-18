import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const ConfirmModal: React.FC = () => {
  const { confirmDialog, closeConfirmation } = useChurch();

  if (!confirmDialog || !confirmDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-stone-900 tracking-tight">{confirmDialog.title}</h3>
              <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <button
              onClick={closeConfirmation}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeConfirmation}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirmation();
              }}
              className={`min-h-[44px] px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-colors ${
                confirmDialog.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#344E41] hover:bg-[#284136]'
              }`}
            >
              {confirmDialog.confirmLabel || 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
