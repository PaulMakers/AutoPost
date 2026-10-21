import React from 'react';
import { Send, CheckCircle2, XCircle, Timer, Clock, Zap } from 'lucide-react';

interface StatsBarProps {
  isRunning: boolean;
  total: number;
  success: number;
  failed: number;
  uptimeSeconds: number;
  nextPostInSeconds: number | null;
  nextPostTime?: number | null;
  delaySeconds: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  isRunning,
  total,
  success,
  failed,
  uptimeSeconds,
  nextPostInSeconds,
  nextPostTime,
  delaySeconds,
}) => {
  // Local high-frequency tick for smooth countdown
  const [liveSecondsLeft, setLiveSecondsLeft] = React.useState<number | null>(nextPostInSeconds);

  React.useEffect(() => {
    if (!isRunning || !nextPostTime) {
      setLiveSecondsLeft(nextPostInSeconds);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = nextPostTime - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setLiveSecondsLeft(remainingSec);
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, nextPostTime, nextPostInSeconds]);

  const displaySeconds = isRunning
    ? (liveSecondsLeft !== null ? liveSecondsLeft : nextPostInSeconds)
    : null;

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hours > 0) {
      return `${hours}j ${mins}m ${s}d`;
    }
    return `${mins}m ${s}d`;
  };

  const progressPercent =
    isRunning && displaySeconds !== null && delaySeconds > 0
      ? Math.max(0, Math.min(100, Math.round(((delaySeconds - displaySeconds) / delaySeconds) * 100)))
      : isRunning
      ? 100
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Status Autopost & Countdown */}
      <div className="col-span-2 lg:col-span-1 rounded-xl bg-white/[0.03] border border-white/10 p-4 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${isRunning ? 'text-[#57F287]' : 'text-slate-500'}`} />
            Status Autopost
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isRunning
                ? 'bg-[#57F287]/20 text-[#57F287] border border-[#57F287]/30'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
            }`}
          >
            {isRunning ? 'AKTIF BERJALAN' : 'BERHENTI'}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isRunning ? (
              <span className="flex items-center gap-1 text-[#5865F2]">
                {displaySeconds !== null ? `${displaySeconds}s` : 'Kirim...'}
                <span className="text-xs font-normal text-slate-400 ml-1">berikutnya</span>
              </span>
            ) : (
              <span className="text-slate-400 text-lg">Siap Dimulai</span>
            )}
          </div>
          {isRunning && (
            <span className="text-xs text-slate-400 font-mono">
              Delay: {delaySeconds}s
            </span>
          )}
        </div>

        {/* Real-time countdown progress line */}
        {isRunning && (
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#5865F2] to-[#57F287] h-full transition-all duration-300 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. Total Terkirim */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#5865F2]" />
            Total Diproses
          </span>
          <span className="text-[11px] font-mono text-slate-500">Request</span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {total}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Uptime: {isRunning ? formatUptime(uptimeSeconds) : '-'}</span>
        </div>
      </div>

      {/* 3. Berhasil */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#57F287]" />
            Pesan Berhasil
          </span>
          <span className="text-[11px] font-bold text-[#57F287]">
            {total > 0 ? `${Math.round((success / total) * 100)}%` : '100%'}
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-[#57F287] tracking-tight">
          {success}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Terkirim ke channel / webhook
        </div>
      </div>

      {/* 4. Gagal */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-[#ED4245]" />
            Pesan Gagal
          </span>
          <span className="text-[11px] font-bold text-[#ED4245]">
            {total > 0 ? `${Math.round((failed / total) * 100)}%` : '0%'}
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-[#ED4245] tracking-tight">
          {failed}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Error otorisasi / rate limit
        </div>
      </div>
    </div>
  );
};
