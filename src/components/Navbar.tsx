import React from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  FileJson,
  UploadCloud,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  isRunning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExportConfig: () => void;
  onImportConfig: () => void;
  onOpenHelp: () => void;
  apiConnected: boolean | null;
  serverLatencyMs?: number | null;
  discordLatencyMs?: number | null;
  discordConnected?: boolean | null;
  onPingNow?: () => void;
  isPinging?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  isRunning,
  soundEnabled,
  onToggleSound,
  onExportConfig,
  onImportConfig,
  onOpenHelp,
  apiConnected,
  serverLatencyMs,
  discordLatencyMs,
  discordConnected,
  onPingNow,
  isPinging,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0f111a]/85 backdrop-blur-md px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25">
            <Radio className="w-5 h-5" />
            <span
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f111a] ${
                isRunning
                  ? 'bg-[#57F287] animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Discord Autopost
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30">
                  LIVE ENGINE
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Otomatisasi pengiriman pesan via Bot Token & Webhook
            </p>
          </div>
        </div>

        {/* Real-time Measured Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] sm:text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                discordConnected === true
                  ? 'bg-[#57F287] shadow-[0_0_8px_#57F287]'
                  : discordConnected === false
                  ? 'bg-[#ED4245]'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-slate-400">Discord API:</span>
            {discordConnected == null || isPinging ? (
              <span className="text-amber-300 font-semibold animate-pulse">Menghubungkan...</span>
            ) : discordConnected ? (
              <span className="text-[#57F287] font-semibold">
                {discordLatencyMs != null ? `${discordLatencyMs}ms` : 'Aktif'}
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[#ED4245] font-semibold">Offline</span>
                {onPingNow && (
                  <button
                    type="button"
                    onClick={onPingNow}
                    disabled={isPinging}
                    title="Klik untuk mencoba menghubungkan kembali ke Discord API"
                    className="ml-0.5 px-1.5 py-0.2 rounded bg-[#ED4245]/20 hover:bg-[#ED4245]/30 text-[#ED4245] text-[10px] font-bold border border-[#ED4245]/40 transition-all cursor-pointer"
                  >
                    {isPinging ? '...' : 'Sambung'}
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="text-white/20 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">Server:</span>
            <span className="text-slate-200">
              {serverLatencyMs !== null && serverLatencyMs !== undefined ? `${serverLatencyMs}ms` : 'OK'}
            </span>
          </div>

          {onPingNow && (
            <button
              type="button"
              id="navbar-ping-now-btn"
              onClick={onPingNow}
              disabled={isPinging}
              title="Ping real-time ke Discord sekarang"
              className="ml-0.5 sm:ml-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/15 text-[10px] text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {isPinging ? '...' : 'Ping'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Matikan Suara Notifikasi' : 'Aktifkan Suara Notifikasi'}
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#57F287]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden lg:inline">{soundEnabled ? 'Suara ON' : 'Suara OFF'}</span>
          </button>

          {/* Export JSON Config */}
          <button
            id="export-config-btn"
            onClick={onExportConfig}
            title="Ekspor Backup Konfigurasi (JSON)"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <FileJson className="w-4 h-4 text-[#5865F2]" />
            <span className="hidden lg:inline">Ekspor</span>
          </button>

          {/* Import JSON Config */}
          <button
            id="import-config-btn"
            onClick={onImportConfig}
            title="Impor Konfigurasi (JSON)"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4 text-[#FEE75C]" />
            <span className="hidden lg:inline">Impor</span>
          </button>

          {/* Help button */}
          <button
            id="help-btn"
            onClick={onOpenHelp}
            title="Petunjuk Penggunaan"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-xs flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Panduan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
