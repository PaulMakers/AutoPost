import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      bg: 'bg-[#182a20] border-[#57F287]/40 text-white',
      icon: <CheckCircle2 className="w-4 h-4 text-[#57F287] shrink-0" />,
    },
    error: {
      bg: 'bg-[#2d1517] border-[#ED4245]/40 text-white',
      icon: <XCircle className="w-4 h-4 text-[#ED4245] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#2b2512] border-[#FEE75C]/40 text-white',
      icon: <AlertTriangle className="w-4 h-4 text-[#FEE75C] shrink-0" />,
    },
    info: {
      bg: 'bg-[#141b30] border-[#5865F2]/40 text-white',
      icon: <Info className="w-4 h-4 text-[#5865F2] shrink-0" />,
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 ${config.bg}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold leading-none mb-1">{toast.title}</h4>
        {toast.message && (
          <p className="text-[11px] text-slate-300 leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
