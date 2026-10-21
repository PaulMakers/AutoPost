import React, { useState } from 'react';
import { AutopostConfig, ChannelTarget, DiscordEmbed } from '../types';
import {
  Hash,
  Plus,
  Trash2,
  Copy,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  FileText,
  Settings2,
  Webhook
} from 'lucide-react';

interface MultiChannelManagerProps {
  config: AutopostConfig;
  onChange: (updated: Partial<AutopostConfig>) => void;
  isRunning: boolean;
  onTestChannel: (channelId: string) => Promise<void>;
  testingChannelId: string | null;
}

export const MultiChannelManager: React.FC<MultiChannelManagerProps> = ({
  config,
  onChange,
  isRunning,
  onTestChannel,
  testingChannelId,
}) => {
  const [expandedChannelId, setExpandedChannelId] = useState<string | null>(null);

  const channels: ChannelTarget[] = config.channels && config.channels.length > 0
    ? config.channels
    : [
        {
          id: 'ch_default_1',
          name: '#channel-utama',
          channelId: config.channelId?.split(',')[0]?.trim() || '',
          enabled: true,
          useCustomMessage: false,
          customMessage: '',
        },
      ];

  const updateChannels = (newChannels: ChannelTarget[]) => {
    // Keep first channel synced with config.channelId for backward compatibility
    const firstActive = newChannels.find((c) => c.enabled && c.channelId?.trim());
    onChange({
      channels: newChannels,
      channelId: firstActive ? firstActive.channelId : config.channelId,
    });
  };

  const handleAddChannel = () => {
    if (isRunning) return;
    const newIndex = channels.length + 1;
    const newChan: ChannelTarget = {
      id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `#channel-${newIndex}`,
      channelId: '',
      enabled: true,
      useCustomMessage: true, // Default to custom message for newly added channels!
      customMessage: `Halo dari channel #${newIndex}! Pesan khusus terkirim pada {time}.`,
    };
    const updated = [...channels, newChan];
    updateChannels(updated);
    setExpandedChannelId(newChan.id);
  };

  const handleRemoveChannel = (id: string) => {
    if (isRunning || channels.length <= 1) return;
    const updated = channels.filter((c) => c.id !== id);
    updateChannels(updated);
  };

  const handleToggleChannel = (id: string, enabled: boolean) => {
    if (isRunning) return;
    const updated = channels.map((c) => (c.id === id ? { ...c, enabled } : c));
    updateChannels(updated);
  };

  const handleUpdateChannelField = (id: string, patch: Partial<ChannelTarget>) => {
    if (isRunning) return;
    const updated = channels.map((c) => (c.id === id ? { ...c, ...patch } : c));
    updateChannels(updated);
  };

  const handleCopyGlobalMessage = (id: string) => {
    if (isRunning) return;
    handleUpdateChannelField(id, {
      useCustomMessage: true,
      customMessage: config.message || '',
    });
  };

  const activeCount = channels.filter((c) => c.enabled).length;

  return (
    <div
      id="multi-channel-manager-container"
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:p-6 backdrop-blur-md shadow-xl flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5865F2]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Target Multi-Channel
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30">
              {activeCount} / {channels.length} Aktif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Kirim ke banyak channel sekaligus dalam satu siklus jadwal. Setiap channel dapat memiliki pesan dan pengaturan berbeda.
          </p>
        </div>

        {/* Add Channel Button */}
        <button
          type="button"
          id="add-new-channel-btn"
          disabled={isRunning}
          onClick={handleAddChannel}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#5865F2]/20 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Channel</span>
        </button>
      </div>

      {/* Channel Cards List */}
      <div className="flex flex-col gap-3">
        {channels.map((chan, idx) => {
          const isExpanded = expandedChannelId === chan.id;
          const isTestingThis = testingChannelId === chan.id;
          const isWebhookMode = config.mode === 'webhook';

          return (
            <div
              key={chan.id}
              id={`channel-target-card-${idx + 1}`}
              className={`rounded-xl border transition-all ${
                chan.enabled
                  ? 'border-white/15 bg-black/25 hover:border-white/25'
                  : 'border-white/5 bg-black/10 opacity-60'
              }`}
            >
              {/* Card Header Bar */}
              <div className="p-3.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  {/* Enabled Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      id={`channel-toggle-${idx + 1}`}
                      disabled={isRunning}
                      checked={chan.enabled}
                      onChange={(e) => handleToggleChannel(chan.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#57F287]"></div>
                  </label>

                  <span className="w-5 h-5 rounded-md bg-white/10 text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Channel Label/Name editable input */}
                  <input
                    type="text"
                    disabled={isRunning || !chan.enabled}
                    value={chan.name}
                    onChange={(e) => handleUpdateChannelField(chan.id, { name: e.target.value })}
                    placeholder="Nama Channel (cth: #promo)"
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#5865F2] w-36 sm:w-44 transition-all"
                  />

                  {/* Target ID / Webhook Input in Header */}
                  <div className="relative flex-1 min-w-[140px]">
                    <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-slate-400">
                      {isWebhookMode ? <Webhook className="w-3 h-3 text-[#5865F2]" /> : <Hash className="w-3 h-3 text-[#5865F2]" />}
                    </div>
                    <input
                      type="text"
                      disabled={isRunning || !chan.enabled}
                      value={isWebhookMode ? (chan.customWebhookUrl || chan.channelId || '') : (chan.channelId || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isWebhookMode) {
                          handleUpdateChannelField(chan.id, {
                            customWebhookUrl: val,
                            channelId: val,
                          });
                        } else {
                          handleUpdateChannelField(chan.id, { channelId: val });
                        }
                      }}
                      placeholder={isWebhookMode ? 'URL Webhook khusus (opsional)' : 'ID Channel Discord'}
                      className="w-full pl-7 pr-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] transition-all"
                    />
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  {/* Badge: Pesan Khusus vs Pesan Global */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium hidden md:inline-flex ${
                      chan.useCustomMessage
                        ? 'bg-[#FEE75C]/15 text-[#FEE75C] border border-[#FEE75C]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {chan.useCustomMessage ? '★ Pesan Khusus' : 'Pesan Global'}
                  </span>

                  {/* Test Send to this channel */}
                  <button
                    type="button"
                    id={`test-channel-btn-${idx + 1}`}
                    disabled={isRunning || !chan.enabled || isTestingThis}
                    onClick={() => onTestChannel(chan.id)}
                    title={`Kirim satu pesan uji coba langsung ke ${chan.name}`}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-slate-200 font-medium flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isTestingThis ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#5865F2]" />
                    ) : (
                      <Send className="w-3 h-3 text-[#5865F2]" />
                    )}
                    <span className="text-[11px] hidden sm:inline">Test</span>
                  </button>

                  {/* Expand / Collapse Details */}
                  <button
                    type="button"
                    id={`toggle-expand-channel-${idx + 1}`}
                    onClick={() => setExpandedChannelId(isExpanded ? null : chan.id)}
                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title={isExpanded ? 'Tutup Pengaturan Pesan' : 'Buka Pengaturan Pesan Khusus'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Delete Channel (only if more than 1) */}
                  {channels.length > 1 && (
                    <button
                      type="button"
                      id={`delete-channel-btn-${idx + 1}`}
                      disabled={isRunning}
                      onClick={() => handleRemoveChannel(chan.id)}
                      className="p-1 rounded text-slate-500 hover:text-[#ED4245] hover:bg-[#ED4245]/10 transition-all cursor-pointer disabled:opacity-40"
                      title="Hapus Channel ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Section: Custom Message & Options for This Channel */}
              {isExpanded && (
                <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col gap-3.5 animate-in fade-in duration-150">
                  {/* Mode Selector for this Channel */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#5865F2]" />
                      Pilihan Konten Pesan untuk {chan.name}:
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`mode-global-btn-${idx + 1}`}
                        disabled={isRunning}
                        onClick={() => handleUpdateChannelField(chan.id, { useCustomMessage: false })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          !chan.useCustomMessage
                            ? 'bg-white/15 text-white border border-white/20 font-semibold'
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        Gunakan Pesan Utama
                      </button>

                      <button
                        type="button"
                        id={`mode-custom-btn-${idx + 1}`}
                        disabled={isRunning}
                        onClick={() => handleUpdateChannelField(chan.id, { useCustomMessage: true })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          chan.useCustomMessage
                            ? 'bg-[#FEE75C]/20 text-[#FEE75C] border border-[#FEE75C]/30 font-semibold'
                            : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        ★ Buat Pesan Khusus
                      </button>
                    </div>
                  </div>

                  {chan.useCustomMessage ? (
                    <div className="flex flex-col gap-2">
                      {/* Textarea for this channel */}
                      <div className="relative">
                        <textarea
                          id={`custom-message-input-${idx + 1}`}
                          rows={4}
                          disabled={isRunning}
                          value={chan.customMessage || ''}
                          onChange={(e) =>
                            handleUpdateChannelField(chan.id, { customMessage: e.target.value })
                          }
                          placeholder={`Tulis pesan unik untuk ${chan.name}...`}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FEE75C] transition-all resize-y leading-relaxed font-sans"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-500">Sisipkan Variabel:</span>
                            {['{date}', '{time}', '{counter}', '{random}'].map((v) => (
                              <button
                                key={v}
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  const cur = chan.customMessage || '';
                                  handleUpdateChannelField(chan.id, {
                                    customMessage: cur + ` ${v} `,
                                  });
                                }}
                                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10 transition-colors"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{(chan.customMessage || '').length} / 2000 karakter</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => handleCopyGlobalMessage(chan.id)}
                              className="text-[10px] text-[#5865F2] hover:underline flex items-center gap-1"
                              title="Salin isi pesan dari composer utama ke sini"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Salin dari Pesan Utama</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400 flex items-center justify-between">
                      <span>
                        Channel ini akan mengirimkan pesan yang sama dengan pengaturan di panel <strong>Konten Pesan Utama</strong>.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateChannelField(chan.id, { useCustomMessage: true })}
                        className="text-xs text-[#FEE75C] hover:underline shrink-0 ml-2"
                      >
                        Ubah Jadi Pesan Khusus &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Tip */}
      <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#5865F2] shrink-0" />
          <span>
            <strong>Tips:</strong> Sistem otomatis memberi jeda 750ms antar channel saat pengiriman untuk melindungi akun/bot dari rate limit Discord.
          </span>
        </div>
      </div>
    </div>
  );
};
