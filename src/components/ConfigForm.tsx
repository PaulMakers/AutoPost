import React, { useState } from 'react';
import { AutopostConfig } from '../types';
import {
  Webhook,
  KeyRound,
  Hash,
  Server,
  Play,
  Square,
  Send,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ConfigFormProps {
  config: AutopostConfig;
  onChange: (updated: Partial<AutopostConfig>) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onTest: () => void;
  onValidate: () => void;
  isTesting: boolean;
  isValidating: boolean;
  validationResult: {
    valid: boolean;
    type?: string;
    username?: string;
    name?: string;
    message?: string;
  } | null;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onChange,
  isRunning,
  onStart,
  onStop,
  onTest,
  onValidate,
  isTesting,
  isValidating,
  validationResult,
}) => {
  const [showToken, setShowToken] = useState<boolean>(false);

  // Validate webhook url format
  const isWebhookMode = config.mode === 'webhook';
  const isWebhookValid =
    Boolean(config.webhookUrl) &&
    /https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/i.test(
      config.webhookUrl || ''
    );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
      {/* 1. Mode Selector Toggle Switch */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#5865F2]" />
            Metode Pengiriman Pesan
          </label>
          <span className="text-xs text-slate-400 font-mono">
            {isWebhookMode ? 'Mode Webhook' : 'Mode Token Akun/Bot'}
          </span>
        </div>

        {/* Toggle Switch Component */}
        <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/10 relative">
          <button
            type="button"
            id="mode-token-tab"
            disabled={isRunning}
            onClick={() => onChange({ mode: 'token' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              !isWebhookMode
                ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/25'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Discord Token</span>
          </button>

          <button
            type="button"
            id="mode-webhook-tab"
            disabled={isRunning}
            onClick={() => onChange({ mode: 'webhook' })}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              isWebhookMode
                ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/25'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-50'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhook URL</span>
          </button>
        </div>
      </div>

      {/* 2. Webhook Configuration Inputs */}
      {isWebhookMode ? (
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5 text-[#5865F2]" />
                URL Webhook Discord <span className="text-[#ED4245]">*</span>
              </label>
              {config.webhookUrl && (
                <span
                  className={`text-[11px] font-medium flex items-center gap-1 ${
                    isWebhookValid ? 'text-[#57F287]' : 'text-[#ED4245]'
                  }`}
                >
                  {isWebhookValid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Format Valid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Format URL tidak valid
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="webhook-url-input"
                type="text"
                disabled={isRunning}
                value={config.webhookUrl || ''}
                onChange={(e) => onChange({ webhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/123456789/abcdef..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-all disabled:opacity-60 font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dapatkan di: Server Settings &gt; Integrations &gt; Webhooks &gt; New Webhook &gt; Copy URL
            </p>
          </div>

          {/* Webhook Custom Name & Avatar (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Nama Pengirim Webhook (Opsional)
              </label>
              <input
                id="webhook-username-input"
                type="text"
                disabled={isRunning}
                value={config.webhookUsername || ''}
                onChange={(e) => onChange({ webhookUsername: e.target.value })}
                placeholder="cth: Pengingat Server"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] transition-all disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                URL Avatar Webhook (Opsional)
              </label>
              <input
                id="webhook-avatar-input"
                type="text"
                disabled={isRunning}
                value={config.webhookAvatarUrl || ''}
                onChange={(e) => onChange({ webhookAvatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] transition-all disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      ) : (
        /* 3. Token Configuration Inputs */
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in duration-200">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#5865F2]" />
                User Token / Bot Token Discord <span className="text-[#ED4245]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="is-bot-token-checkbox"
                    disabled={isRunning}
                    checked={config.isBotToken ?? true}
                    onChange={(e) => onChange({ isBotToken: e.target.checked })}
                    className="rounded border-white/20 text-[#5865F2] focus:ring-[#5865F2] bg-white/5"
                  />
                  <span>Bot Token</span>
                </label>
              </div>
            </div>

            <div className="relative flex items-center">
              <input
                id="discord-token-input"
                type={showToken ? 'text' : 'password'}
                disabled={isRunning}
                value={config.token || ''}
                onChange={(e) => onChange({ token: e.target.value })}
                placeholder={config.isBotToken ? 'MTE4NzY1NDMyMTA5ODc2NTQz...' : 'OTAxMjM0NTY3ODkwMTIzNA...'}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition-all disabled:opacity-60 font-mono text-xs"
              />
              <button
                type="button"
                id="toggle-show-token"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 px-2 py-1 text-slate-400 hover:text-white transition-colors"
                title={showToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Token tersimpan secara aman di backend lokal Anda dan tidak dikirimkan ke pihak ketiga.
            </p>
          </div>

          {/* Server ID & Channel ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                ID Server (Guild ID)
              </label>
              <input
                id="server-id-input"
                type="text"
                disabled={isRunning}
                value={config.serverId || ''}
                onChange={(e) => onChange({ serverId: e.target.value })}
                placeholder="109876543210987654"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] transition-all font-mono disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Hash className="w-3.5 h-3.5 text-[#5865F2]" />
                ID Channel Tujuan <span className="text-[#ED4245]">*</span>
              </label>
              <input
                id="channel-id-input"
                type="text"
                disabled={isRunning}
                value={config.channelId || ''}
                onChange={(e) => onChange({ channelId: e.target.value })}
                placeholder="112233445566, 778899001122"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] transition-all font-mono disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Mendukung multi-channel (pisahkan dengan tanda koma).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Result Box */}
      {validationResult && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            validationResult.valid
              ? 'bg-[#57F287]/10 border-[#57F287]/30 text-[#57F287]'
              : 'bg-[#ED4245]/10 border-[#ED4245]/30 text-[#ED4245]'
          }`}
        >
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <div>
              {validationResult.valid ? (
                <span>
                  <strong>Terhubung!</strong> Akun/Webhook:{' '}
                  <span className="underline">
                    {validationResult.username || validationResult.name}
                  </span>{' '}
                  ({validationResult.type?.toUpperCase()})
                </span>
              ) : (
                <span>{validationResult.message || 'Verifikasi gagal.'}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Delay & Jitter Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Delay in Seconds */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Delay Antar Pesan (Detik) <span className="text-[#ED4245]">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Min. 3 detik
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              id="delay-seconds-input"
              type="number"
              min={3}
              max={86400}
              disabled={isRunning}
              value={config.delaySeconds}
              onChange={(e) =>
                onChange({
                  delaySeconds: Math.max(3, parseInt(e.target.value) || 3),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] font-mono disabled:opacity-60"
            />
            <span className="absolute right-3.5 text-xs text-slate-400 pointer-events-none">
              detik
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Delay disarankan minimal 5–10 detik untuk menghindari limit Discord.
          </p>
        </div>

        {/* Jitter (Random delay variation) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FEE75C]" />
              Variasi Delay Acak (Jitter)
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="use-jitter-toggle"
                type="checkbox"
                disabled={isRunning}
                checked={config.useJitter ?? true}
                onChange={(e) => onChange({ useJitter: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865F2]"></div>
            </label>
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-white/5 text-[11px] text-slate-400">
            {config.useJitter ? (
              <span>
                Variasi acak &plusmn;{(config.jitterSeconds || 2)}s ditambahkan pada setiap jeda untuk mencegah deteksi otomatisasi.
              </span>
            ) : (
              <span>Delay konstan dan tepat setiap {config.delaySeconds} detik.</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Action Buttons (Start, Stop, Test, Validate) */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Main Start / Stop Button */}
        {!isRunning ? (
          <button
            type="button"
            id="start-autopost-btn"
            onClick={onStart}
            className="flex-1 py-3 px-5 rounded-xl bg-[#57F287] hover:bg-[#46d674] active:scale-[0.98] text-[#0f111a] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#57F287]/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Autopost</span>
          </button>
        ) : (
          <button
            type="button"
            id="stop-autopost-btn"
            onClick={onStop}
            className="flex-1 py-3 px-5 rounded-xl bg-[#ED4245] hover:bg-[#d83a3d] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ED4245]/25 cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Hentikan Autopost</span>
          </button>
        )}

        {/* Test Single Message Button */}
        <button
          type="button"
          id="test-post-btn"
          onClick={onTest}
          disabled={isTesting || isRunning}
          title="Kirim satu pesan uji coba langsung ke Discord"
          className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
          ) : (
            <Send className="w-4 h-4 text-[#5865F2]" />
          )}
          <span>Test Sekali</span>
        </button>

        {/* Validate Connection */}
        <button
          type="button"
          id="validate-conn-btn"
          onClick={onValidate}
          disabled={isValidating || isRunning}
          title="Verifikasi koneksi token atau webhook ke Discord"
          className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#FEE75C]" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#FEE75C]" />
          )}
          <span>Cek Koneksi</span>
        </button>
      </div>
    </div>
  );
};
