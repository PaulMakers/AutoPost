/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AutopostConfig,
  AutopostStatusResponse,
  ActivityLog,
  DiscordApiHealth,
  TargetHealth,
} from './types';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { LiveDiagnostics } from './components/LiveDiagnostics';
import { ConfigForm } from './components/ConfigForm';
import { MultiChannelManager } from './components/MultiChannelManager';
import { MessageComposer } from './components/MessageComposer';
import { DiscordPreview } from './components/DiscordPreview';
import { TerminalLogs } from './components/TerminalLogs';
import { ToastContainer, ToastMessage } from './components/Toast';
import { StopConfirmModal } from './components/StopConfirmModal';
import { HelpModal } from './components/HelpModal';
import {
  playSuccessSound,
  playErrorSound,
  playStartSound,
} from './utils/sound';

const STORAGE_KEY = 'discord_autopost_saved_config';
const SOUND_KEY = 'discord_autopost_sound_pref';

const DEFAULT_CONFIG: AutopostConfig = {
  mode: 'webhook',
  token: '',
  isBotToken: true,
  serverId: '',
  channelId: '',
  channels: [
    {
      id: 'ch_default_1',
      name: '#channel-1',
      channelId: '',
      enabled: true,
      useCustomMessage: false,
      customMessage: '',
    },
    {
      id: 'ch_default_2',
      name: '#channel-2',
      channelId: '',
      enabled: false,
      useCustomMessage: true,
      customMessage: '📢 Pengumuman spesial di channel kedua! Dikirim pada {time}.',
    },
  ],
  channelPostMode: 'all',
  webhookUrl: '',
  webhookUsername: 'Pengingat Server',
  webhookAvatarUrl: '',
  message: 'Halo semua! Ini adalah pesan otomatis terjadwal dari Discord Autopost Web. {date} {time}',
  multipleMessages: [
    'Halo semua! Semangat beraktivitas ya! {date}',
    'Pengingat harian untuk mengecek update terbaru di server!',
    'Jangan lupa vote dan undang teman ke server kita! #{counter}',
  ],
  messageMode: 'single',
  delaySeconds: 10,
  useJitter: true,
  jitterSeconds: 2,
  useEmbed: false,
  embed: {
    title: 'Pengumuman Otomatis',
    description: 'Pesan ini dibuat dengan Discord Embed Builder. Mendukung teks terstruktur dan warna kustom!',
    color: '#5865F2',
    footer: 'Discord Autopost Web • v1.0',
    timestamp: true,
  },
  useTemplateVars: true,
  autoStopOnErrorCount: 3,
};

export default function App() {
  const [config, setConfig] = useState<AutopostConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.channels || parsed.channels.length === 0) {
          parsed.channels = [
            {
              id: 'ch_default_1',
              name: '#channel-1',
              channelId: parsed.channelId || '',
              enabled: true,
              useCustomMessage: false,
              customMessage: '',
            },
          ];
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    consecutiveErrors: 0,
  });
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [nextPostInSeconds, setNextPostInSeconds] = useState<number | null>(null);
  const [nextPostTime, setNextPostTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Real-time telemetry & live health state
  const [discordApiHealth, setDiscordApiHealth] = useState<DiscordApiHealth | null>(null);
  const [targetHealth, setTargetHealth] = useState<TargetHealth | null>(null);
  const [serverLatencyMs, setServerLatencyMs] = useState<number | null>(null);
  const [serverTimestamp, setServerTimestamp] = useState<number | null>(null);
  const [memoryUsageMb, setMemoryUsageMb] = useState<number>(0);
  const [isPingingDiscord, setIsPingingDiscord] = useState<boolean>(false);
  const [isProbingTarget, setIsProbingTarget] = useState<boolean>(false);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  const [isStopModalOpen, setIsStopModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for tracking sound on stats change
  const prevSuccessRef = useRef<number>(0);
  const prevFailedRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_KEY, String(next));
    addToast('info', next ? 'Suara Diaktifkan' : 'Suara Dimatikan');
  };

  const handleConfigChange = (updated: Partial<AutopostConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // Storage fail ignored
      }
      return next;
    });
  };

  // Poll status and real-time telemetry from server
  const fetchStatus = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await fetch('/api/status');
      const roundTrip = Math.round(performance.now() - start);
      setServerLatencyMs(roundTrip);

      if (!res.ok) throw new Error('API server unreachable');
      const data: AutopostStatusResponse = await res.json();

      setApiConnected(true);
      setIsRunning(data.isRunning);
      setUptimeSeconds(data.uptimeSeconds || 0);
      setNextPostInSeconds(data.nextPostInSeconds);
      setNextPostTime(data.nextPostTime);
      setServerTimestamp(data.serverTimestamp || Date.now());
      setLogs(data.logs || []);
      if (data.discordApiHealth) {
        setDiscordApiHealth(data.discordApiHealth);
      }
      if (data.memoryUsageMb) {
        setMemoryUsageMb(data.memoryUsageMb);
      }

      // Sound notification trigger when new success/fail happens
      if (soundEnabled) {
        if (data.stats.success > prevSuccessRef.current) {
          playSuccessSound();
        } else if (data.stats.failed > prevFailedRef.current) {
          playErrorSound();
        }
      }

      prevSuccessRef.current = data.stats.success;
      prevFailedRef.current = data.stats.failed;
      setStats(data.stats);
    } catch (e) {
      setApiConnected(false);
    }
  }, [soundEnabled]);

  // Real-time explicit ping to Discord
  const handleRefreshDiscordPing = async () => {
    setIsPingingDiscord(true);
    try {
      const res = await fetch('/api/ping-discord');
      const data: DiscordApiHealth = await res.json();
      setDiscordApiHealth(data);
      if (data.connected) {
        addToast(
          'success',
          'Discord API Terhubung',
          `Ping ke discord.com: ${data.latencyMs}ms (${data.gatewayUrl || 'Online'})`
        );
      } else {
        addToast(
          'error',
          'Discord API Terputus',
          data.error || 'Server Discord tidak dapat dijangkau saat ini.'
        );
      }
    } catch (err: any) {
      addToast('error', 'Gagal Menghubungi Server', err.message);
    } finally {
      setIsPingingDiscord(false);
    }
  };

  // Real-time live probe of active target
  const handleProbeTarget = async () => {
    setIsProbingTarget(true);
    try {
      const res = await fetch('/api/probe-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: config.mode,
          token: config.token,
          isBotToken: config.isBotToken,
          webhookUrl: config.webhookUrl,
          channelId: config.channelId,
        }),
      });
      const data: TargetHealth = await res.json();
      setTargetHealth(data);
      if (data.valid) {
        addToast(
          'success',
          'Target Valid (Online)',
          `${data.targetType === 'webhook' ? 'Webhook' : 'Bot'}: ${data.targetName} • Latency: ${data.latencyMs}ms`
        );
      } else {
        addToast('error', 'Target Tidak Valid', data.error || 'Kredensial ditolak oleh Discord');
      }
    } catch (err: any) {
      setTargetHealth({
        checked: true,
        valid: false,
        error: err.message,
        checkedAt: new Date().toISOString(),
      });
      addToast('error', 'Gagal Menguji Target', err.message);
    } finally {
      setIsProbingTarget(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, isRunning ? 1200 : 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, isRunning]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to Start or trigger Stop modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isRunning) {
          setIsStopModalOpen(true);
        } else {
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, config]);

  // Validate inputs before start
  const validateForm = (): boolean => {
    if (config.mode === 'webhook') {
      if (!config.webhookUrl || !config.webhookUrl.trim()) {
        addToast('error', 'URL Webhook Kosong', 'Harap masukkan URL Webhook Discord terlebih dahulu.');
        return false;
      }
      if (!config.webhookUrl.startsWith('http')) {
        addToast('error', 'URL Tidak Valid', 'Format URL Webhook harus diawali dengan https://');
        return false;
      }
    } else {
      if (!config.token || !config.token.trim()) {
        addToast('error', 'Token Kosong', 'Harap masukkan User Token atau Bot Token Discord.');
        return false;
      }
      if (!config.channelId || !config.channelId.trim()) {
        addToast('error', 'Channel ID Kosong', 'Harap tentukan ID Channel tujuan di Discord.');
        return false;
      }
    }

    if (!config.message && !config.useEmbed) {
      addToast('error', 'Pesan Kosong', 'Harap isi teks pesan atau aktifkan kartu embed.');
      return false;
    }

    if (!config.delaySeconds || config.delaySeconds < 3) {
      addToast('warning', 'Delay Terlalu Singkat', 'Delay minimum adalah 3 detik untuk menghindari rate limit.');
      handleConfigChange({ delaySeconds: 3 });
      return false;
    }

    return true;
  };

  // Start Autopost
  const handleStart = async () => {
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();

      if (data.success) {
        setIsRunning(true);
        if (soundEnabled) playStartSound();
        addToast('success', 'Autopost Dimulai', 'Pesan akan dikirim secara berkala ke Discord.');
        fetchStatus();
      } else {
        addToast('error', 'Gagal Memulai', data.message || 'Terjadi kesalahan sistem.');
      }
    } catch (e: any) {
      addToast('error', 'Koneksi Error', e.message);
    }
  };

  // Stop Autopost
  const handleStop = async () => {
    try {
      const res = await fetch('/api/stop', { method: 'POST' });
      const data = await res.json();
      setIsRunning(false);
      setNextPostInSeconds(null);
      addToast('info', 'Autopost Dihentikan', data.message || 'Semua timer dinonaktifkan.');
      fetchStatus();
    } catch (e: any) {
      addToast('error', 'Gagal Menghentikan', e.message);
    }
  };

  // Test Single Post
  const handleTestPost = async () => {
    if (config.mode === 'webhook') {
      if (!config.webhookUrl) {
        addToast('error', 'URL Webhook Kosong', 'Masukkan URL webhook terlebih dahulu.');
        return;
      }
    } else {
      if (!config.token || !config.channelId) {
        addToast('error', 'Input Belum Lengkap', 'Token dan ID Channel diperlukan untuk uji coba.');
        return;
      }
    }

    setIsTesting(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();

      if (data.success) {
        if (soundEnabled) playSuccessSound();
        addToast('success', 'Pesan Uji Coba Berhasil', 'Pesan telah terkirim ke Discord!');
      } else {
        if (soundEnabled) playErrorSound();
        addToast('error', 'Uji Coba Gagal', data.message);
      }
      fetchStatus();
    } catch (e: any) {
      addToast('error', 'Error Jaringan', e.message);
    } finally {
      setIsTesting(false);
    }
  };

  // Test Single Channel
  const handleTestChannel = async (channelTargetId: string) => {
    setTestingChannelId(channelTargetId);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, targetChannelId: channelTargetId }),
      });
      const data = await res.json();

      if (data.success) {
        if (soundEnabled) playSuccessSound();
        addToast('success', 'Uji Coba Channel Berhasil', data.message);
      } else {
        if (soundEnabled) playErrorSound();
        addToast('error', 'Uji Coba Channel Gagal', data.message);
      }
      fetchStatus();
    } catch (e: any) {
      addToast('error', 'Error Jaringan', e.message);
    } finally {
      setTestingChannelId(null);
    }
  };

  // Validate Token / Webhook
  const handleValidateConnection = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: config.mode,
          token: config.token,
          isBotToken: config.isBotToken,
          webhookUrl: config.webhookUrl,
        }),
      });
      const data = await res.json();

      setValidationResult(data);
      if (data.valid) {
        setTargetHealth({
          checked: true,
          valid: true,
          targetType: data.type,
          targetName: data.type === 'webhook' ? data.name : data.username,
          channelId: data.channelId,
          guildId: data.guildId,
          checkedAt: new Date().toISOString(),
        });
        addToast(
          'success',
          'Koneksi Berhasil Diverifikasi',
          data.type === 'webhook'
            ? `Webhook: ${data.name}`
            : `User/Bot Discord: ${data.username}`
        );
      } else {
        setTargetHealth({
          checked: true,
          valid: false,
          error: data.message,
          checkedAt: new Date().toISOString(),
        });
        addToast('error', 'Verifikasi Gagal', data.message);
      }
    } catch (e: any) {
      setValidationResult({ valid: false, message: e.message });
      setTargetHealth({
        checked: true,
        valid: false,
        error: e.message,
        checkedAt: new Date().toISOString(),
      });
      addToast('error', 'Gagal Memverifikasi', e.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      await fetch('/api/clear-logs', { method: 'POST' });
      setLogs([]);
      addToast('info', 'Log Dibersihkan', 'Riwayat aktivitas telah di-reset.');
    } catch (e) {
      // ignore
    }
  };

  // Export Logs as .txt file
  const handleExportLogs = () => {
    window.location.href = '/api/export-logs';
    addToast('success', 'Mengunduh Log', 'File log aktivitas sedang diunduh.');
  };

  // Export Configuration as JSON
  const handleExportConfig = () => {
    const exportData = {
      ...config,
      // Mask token slightly in exported file for user privacy
      exportedAt: new Date().toISOString(),
      appName: 'Discord Autopost Web',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discord-autopost-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Konfigurasi Diekspor', 'File JSON konfigurasi berhasil disimpan.');
  };

  // Import Configuration from JSON
  const handleImportConfig = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setConfig((prev) => ({ ...prev, ...parsed }));
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...config, ...parsed })
        );
        addToast('success', 'Konfigurasi Diimpor', 'Data form berhasil diperbarui dari file JSON.');
      } catch (err) {
        addToast('error', 'File Tidak Valid', 'Pastikan file berformat JSON konfigurasi yang benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#161c2e] to-[#0f111a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Navigation with Real-time Discord Latency & Status */}
      <Navbar
        isRunning={isRunning}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        apiConnected={apiConnected}
        serverLatencyMs={serverLatencyMs}
        discordLatencyMs={discordApiHealth?.latencyMs}
        discordConnected={discordApiHealth?.connected}
        onPingNow={handleRefreshDiscordPing}
        isPinging={isPingingDiscord}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Real-time Live Connection Diagnostics */}
        <LiveDiagnostics
          serverLatencyMs={serverLatencyMs}
          serverTimestamp={serverTimestamp}
          memoryUsageMb={memoryUsageMb}
          discordApiHealth={discordApiHealth}
          targetHealth={targetHealth}
          isPingingDiscord={isPingingDiscord}
          isProbingTarget={isProbingTarget}
          onRefreshDiscordPing={handleRefreshDiscordPing}
          onProbeTarget={handleProbeTarget}
          isRunning={isRunning}
        />

        {/* Real-time Stats Cards */}
        <StatsBar
          isRunning={isRunning}
          total={stats.total}
          success={stats.success}
          failed={stats.failed}
          uptimeSeconds={uptimeSeconds}
          nextPostInSeconds={nextPostInSeconds}
          nextPostTime={nextPostTime}
          delaySeconds={config.delaySeconds}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration & Message Input (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Form Settings */}
            <ConfigForm
              config={config}
              onChange={handleConfigChange}
              isRunning={isRunning}
              onStart={handleStart}
              onStop={() => setIsStopModalOpen(true)}
              onTest={handleTestPost}
              onValidate={handleValidateConnection}
              isTesting={isTesting}
              isValidating={isValidating}
              validationResult={validationResult}
            />

            {/* Target Multi-Channel Manager (Individual messages per channel) */}
            <MultiChannelManager
              config={config}
              onChange={handleConfigChange}
              isRunning={isRunning}
              onTestChannel={handleTestChannel}
              testingChannelId={testingChannelId}
            />

            {/* Message & Embed Composer */}
            <MessageComposer
              config={config}
              onChange={handleConfigChange}
              isRunning={isRunning}
            />
          </div>

          {/* Right Column: Live Discord Chat Mockup & Terminal Logs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Live Discord Message Preview */}
            <DiscordPreview
              mode={config.mode}
              message={config.message}
              useEmbed={config.useEmbed}
              embed={config.embed}
              webhookUsername={config.webhookUsername}
              webhookAvatarUrl={config.webhookAvatarUrl}
              isBotToken={config.isBotToken}
              channels={config.channels}
            />

            {/* Terminal Activity Logs */}
            <TerminalLogs
              logs={logs}
              onClearLogs={handleClearLogs}
              onExportLogs={handleExportLogs}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Discord Autopost Web • Sistem Otomatisasi Pesan Terjadwal
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Pintasan: <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/15">Ctrl + Enter</kbd> Mulai / Hentikan
          </span>
        </div>
      </footer>

      {/* Stop Confirmation Modal */}
      <StopConfirmModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={handleStop}
      />

      {/* Help & Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
