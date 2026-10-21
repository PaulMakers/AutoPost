import React, { useState } from 'react';
import { AutopostConfig, DiscordEmbed, MessageMode } from '../types';
import {
  MessageSquareText,
  Palette,
  Layers,
  Plus,
  Trash2,
  Smile,
  Shuffle,
  Clock,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

interface MessageComposerProps {
  config: AutopostConfig;
  onChange: (updated: Partial<AutopostConfig>) => void;
  isRunning: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  config,
  onChange,
  isRunning,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');
  const [newMessageText, setNewMessageText] = useState<string>('');

  const templateVars = [
    { key: '{date}', label: 'Tanggal Hari Ini' },
    { key: '{time}', label: 'Waktu Sekarang' },
    { key: '{counter}', label: 'Nomor Urut' },
    { key: '{random}', label: 'Kode Acak' },
  ];

  const colorPresets = [
    { name: 'Discord Blurple', hex: '#5865F2' },
    { name: 'Green', hex: '#57F287' },
    { name: 'Yellow', hex: '#FEE75C' },
    { name: 'Red', hex: '#ED4245' },
    { name: 'Cyan', hex: '#00A8FC' },
    { name: 'Fuchsia', hex: '#EB459E' },
  ];

  const handleInsertVar = (v: string) => {
    if (isRunning) return;
    onChange({
      message: (config.message || '') + ` ${v} `,
      useTemplateVars: true,
    });
  };

  const handleEmbedChange = (updated: Partial<DiscordEmbed>) => {
    onChange({
      embed: {
        ...(config.embed || {}),
        ...updated,
      },
    });
  };

  const handleAddMultipleMessage = () => {
    if (!newMessageText.trim() || isRunning) return;
    const current = config.multipleMessages || [];
    onChange({
      multipleMessages: [...current, newMessageText.trim()],
    });
    setNewMessageText('');
  };

  const handleRemoveMultipleMessage = (index: number) => {
    if (isRunning) return;
    const current = config.multipleMessages || [];
    onChange({
      multipleMessages: current.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-[#5865F2]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Konten Pesan & Format
          </h3>
        </div>

        {/* Tab Single vs Multiple */}
        <div className="flex p-0.5 bg-black/40 rounded-lg border border-white/10 text-xs">
          <button
            type="button"
            id="tab-single-message"
            onClick={() => {
              setActiveTab('single');
              onChange({ messageMode: 'single' });
            }}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'single'
                ? 'bg-[#5865F2] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pesan Tunggal
          </button>
          <button
            type="button"
            id="tab-multiple-messages"
            onClick={() => {
              setActiveTab('multiple');
              onChange({ messageMode: config.messageMode === 'single' ? 'random' : config.messageMode });
            }}
            className={`px-3 py-1 rounded-md transition-all font-semibold flex items-center gap-1 ${
              activeTab === 'multiple'
                ? 'bg-[#5865F2] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Rotasi Pesan ({config.multipleMessages?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab: Single Message */}
      {activeTab === 'single' ? (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              Isi Pesan Discord <span className="text-[#ED4245]">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {(config.message || '').length} / 2000 karakter
            </span>
          </div>

          <textarea
            id="message-textarea"
            rows={4}
            disabled={isRunning}
            value={config.message || ''}
            onChange={(e) => onChange({ message: e.target.value })}
            placeholder="Ketik pesan Anda disini... Mendukung Markdown seperti **tebal**, *miring*, `kode`, dan emoji Discord :smile:!"
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] resize-y disabled:opacity-60 transition-all font-sans"
          />

          {/* Template Variables Helper */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FEE75C]" />
              Sisipkan Variabel:
            </span>
            {templateVars.map((tv) => (
              <button
                key={tv.key}
                type="button"
                id={`insert-var-${tv.key.replace(/[{}]/g, '')}`}
                disabled={isRunning}
                onClick={() => handleInsertVar(tv.key)}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-[#5865F2]/20 hover:text-[#5865F2] border border-white/10 text-[11px] font-mono text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                title={`Sisipkan ${tv.label}`}
              >
                {tv.key}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Tab: Multiple Messages / Rotation */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Daftar Pesan Bergilir (List Pesan)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Mode:</span>
              <select
                id="message-rotation-mode"
                disabled={isRunning}
                value={config.messageMode || 'random'}
                onChange={(e) => onChange({ messageMode: e.target.value as MessageMode })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none"
              >
                <option value="random" className="bg-[#1a1a2e]">Acak (Random)</option>
                <option value="sequential" className="bg-[#1a1a2e]">Berurutan (Sequential)</option>
              </select>
            </div>
          </div>

          {/* Add Message Box */}
          <div className="flex gap-2">
            <input
              id="new-multiple-message-input"
              type="text"
              disabled={isRunning}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMultipleMessage();
                }
              }}
              placeholder="Tambahkan variasi pesan baru lalu tekan enter..."
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
            />
            <button
              type="button"
              id="add-multiple-message-btn"
              disabled={isRunning || !newMessageText.trim()}
              onClick={handleAddMultipleMessage}
              className="px-3 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* List of Messages */}
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {(config.multipleMessages || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic bg-black/20 rounded-lg border border-white/5">
                Belum ada daftar pesan tambahan. Tambahkan minimal 2 pesan untuk rotasi otomatis.
              </div>
            ) : (
              config.multipleMessages?.map((msg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-200 group"
                >
                  <span className="font-mono text-slate-500 text-[11px] mr-2">
                    #{idx + 1}
                  </span>
                  <span className="flex-1 truncate">{msg}</span>
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => handleRemoveMultipleMessage(idx)}
                    className="text-slate-500 hover:text-[#ED4245] p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Embed Message Builder Section */}
      <div className="pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#5865F2]" />
            Discord Embed Builder (Kartu Cantik)
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="use-embed-toggle"
              type="checkbox"
              disabled={isRunning}
              checked={config.useEmbed ?? false}
              onChange={(e) => onChange({ useEmbed: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865F2]"></div>
          </label>
        </div>

        {config.useEmbed && (
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3 animate-in fade-in duration-200">
            {/* Embed Title & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Judul Embed (Title)
                </label>
                <input
                  id="embed-title-input"
                  type="text"
                  disabled={isRunning}
                  value={config.embed?.title || ''}
                  onChange={(e) => handleEmbedChange({ title: e.target.value })}
                  placeholder="cth: Pengumuman Server Harian"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Warna Garis Sisi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="embed-color-picker"
                    type="color"
                    disabled={isRunning}
                    value={config.embed?.color || '#5865F2'}
                    onChange={(e) => handleEmbedChange({ color: e.target.value })}
                    className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    id="embed-color-hex"
                    type="text"
                    disabled={isRunning}
                    value={config.embed?.color || '#5865F2'}
                    onChange={(e) => handleEmbedChange({ color: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-slate-200 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Preset:</span>
              {colorPresets.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  id={`color-preset-${preset.hex.replace('#', '')}`}
                  disabled={isRunning}
                  onClick={() => handleEmbedChange({ color: preset.hex })}
                  className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
            </div>

            {/* Embed Description */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Deskripsi Embed (Description)
              </label>
              <textarea
                id="embed-description-input"
                rows={2}
                disabled={isRunning}
                value={config.embed?.description || ''}
                onChange={(e) => handleEmbedChange({ description: e.target.value })}
                placeholder="Rincian teks pesan yang masuk ke dalam kartu embed..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2] resize-y"
              />
            </div>

            {/* Embed Footer & Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Footer (Teks Kaki)
                </label>
                <input
                  id="embed-footer-input"
                  type="text"
                  disabled={isRunning}
                  value={config.embed?.footer || ''}
                  onChange={(e) => handleEmbedChange({ footer: e.target.value })}
                  placeholder="Discord Autopost • Bot Official"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  URL Gambar Embed (Image URL)
                </label>
                <input
                  id="embed-image-input"
                  type="text"
                  disabled={isRunning}
                  value={config.embed?.imageUrl || ''}
                  onChange={(e) => handleEmbedChange({ imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.png"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                />
              </div>
            </div>

            {/* Embed Timestamp Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  id="embed-timestamp-checkbox"
                  type="checkbox"
                  disabled={isRunning}
                  checked={config.embed?.timestamp ?? true}
                  onChange={(e) => handleEmbedChange({ timestamp: e.target.checked })}
                  className="rounded border-white/20 text-[#5865F2] focus:ring-[#5865F2] bg-white/5"
                />
                <span>Sertakan Waktu Pengiriman Otomatis (Timestamp)</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
