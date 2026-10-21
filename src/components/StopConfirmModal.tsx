import React from 'react';
import { AlertTriangle, X, Square } from 'lucide-react';

interface StopConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const StopConfirmModal: React.FC<StopConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161824] p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[#ED4245]/20 border border-[#ED4245]/30 text-[#ED4245] flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          Hentikan Autopost Discord?
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Pengiriman pesan otomatis yang sedang berjalan akan segera dihentikan.
          Semua timer dan antrean pengiriman akan dibatalkan.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            id="cancel-stop-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="confirm-stop-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#ED4245] hover:bg-[#d83a3d] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#ED4245]/25 transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Ya, Hentikan Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
