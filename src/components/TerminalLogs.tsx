import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog } from '../types';
import {
  Terminal,
  Download,
  Trash2,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';

interface TerminalLogsProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
  onExportLogs: () => void;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  onClearLogs,
  onExportLogs,
}) => {
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'success' | 'error' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0; // Since we prepend newest or append oldest?
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.channel && log.channel.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0c13] overflow-hidden shadow-2xl flex flex-col h-[420px]">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#13141f] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ED4245]" />
            <span className="w-3 h-3 rounded-full bg-[#FEE75C]" />
            <span className="w-3 h-3 rounded-full bg-[#57F287]" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-xs font-mono text-slate-300 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Terminal Log Aktivitas Real-Time</span>
            <span className="text-[10px] text-slate-500">({logs.length} entri)</span>
          </div>
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Auto Scroll Toggle */}
          <button
            id="toggle-autoscroll-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Auto-scroll aktif (terkunci ke terbaru)' : 'Auto-scroll mati'}
            className={`px-2 py-1 rounded text-xs font-mono flex items-center gap-1 transition-all ${
              autoScroll
                ? 'bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/40'
                : 'bg-white/5 text-slate-400 border border-white/5'
            }`}
          >
            {autoScroll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span className="hidden sm:inline">Auto-Scroll</span>
          </button>

          {/* Export to file */}
          <button
            id="export-logs-btn"
            onClick={onExportLogs}
            title="Download Log (.txt)"
            className="px-2 py-1 rounded text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1 transition-all"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Logs */}
          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            title="Bersihkan Semua Log"
            className="p-1 rounded text-xs font-mono bg-white/5 hover:bg-[#ED4245]/20 hover:text-[#ED4245] text-slate-400 border border-white/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Sub-bar */}
      <div className="px-4 py-2 bg-[#0e0f17] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Level Filters */}
        <div className="flex items-center gap-1">
          <button
            id="filter-all-logs"
            onClick={() => setFilterLevel('all')}
            className={`px-2 py-0.5 rounded text-[11px] transition-all ${
              filterLevel === 'all'
                ? 'bg-white/15 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            id="filter-success-logs"
            onClick={() => setFilterLevel('success')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all ${
              filterLevel === 'success'
                ? 'bg-[#57F287]/20 text-[#57F287] font-bold border border-[#57F287]/30'
                : 'text-slate-400 hover:text-[#57F287]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Sukses
          </button>
          <button
            id="filter-error-logs"
            onClick={() => setFilterLevel('error')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all ${
              filterLevel === 'error'
                ? 'bg-[#ED4245]/20 text-[#ED4245] font-bold border border-[#ED4245]/30'
                : 'text-slate-400 hover:text-[#ED4245]'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Error
          </button>
          <button
            id="filter-info-logs"
            onClick={() => setFilterLevel('info')}
            className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all ${
              filterLevel === 'info'
                ? 'bg-[#5865F2]/20 text-[#5865F2] font-bold border border-[#5865F2]/30'
                : 'text-slate-400 hover:text-[#5865F2]'
            }`}
          >
            <Info className="w-3 h-3" />
            Info
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
          <input
            id="search-logs-input"
            type="text"
            placeholder="Cari dalam log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-6 pr-2 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] w-36 sm:w-48"
          />
        </div>
      </div>

      {/* Terminal Content Body */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            {searchQuery
              ? 'Tidak ada log yang cocok dengan kata kunci pencarian.'
              : 'Belum ada catatan log aktivitas.'}
          </div>
        ) : (
          filteredLogs.map((log) => {
            let badgeBg = 'bg-slate-800 text-slate-300';
            let icon = <Info className="w-3 h-3 inline mr-1 text-[#5865F2]" />;

            if (log.level === 'success') {
              badgeBg = 'bg-[#57F287]/15 text-[#57F287] border border-[#57F287]/20';
              icon = <CheckCircle2 className="w-3 h-3 inline mr-1 text-[#57F287]" />;
            } else if (log.level === 'error') {
              badgeBg = 'bg-[#ED4245]/20 text-[#ED4245] border border-[#ED4245]/30';
              icon = <XCircle className="w-3 h-3 inline mr-1 text-[#ED4245]" />;
            } else if (log.level === 'warning') {
              badgeBg = 'bg-[#FEE75C]/15 text-[#FEE75C] border border-[#FEE75C]/20';
              icon = <AlertTriangle className="w-3 h-3 inline mr-1 text-[#FEE75C]" />;
            }

            return (
              <div
                key={log.id}
                className="leading-relaxed hover:bg-white/[0.02] px-1.5 py-0.5 rounded flex items-start gap-2 group transition-colors"
              >
                {/* Timestamp */}
                <span className="text-slate-500 select-none text-[11px] shrink-0 font-light">
                  [{log.timestamp}]
                </span>

                {/* Level Badge */}
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 flex items-center ${badgeBg}`}
                >
                  {icon}
                  {log.level}
                </span>

                {/* Message & Channel */}
                <span
                  className={`break-all flex-1 ${
                    log.level === 'error'
                      ? 'text-[#ED4245]'
                      : log.level === 'success'
                      ? 'text-slate-100'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                  {log.channel && (
                    <span className="ml-1.5 text-[10px] text-slate-400 bg-white/5 px-1 py-0.2 rounded font-mono">
                      {log.channel.startsWith('#') ? log.channel : `#${log.channel}`}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
