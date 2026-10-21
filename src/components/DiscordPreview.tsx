import React, { useState } from 'react';
import { DiscordEmbed, AutopostMode, ChannelTarget } from '../types';
import { Bot, MessageSquare, Hash } from 'lucide-react';

interface DiscordPreviewProps {
  mode: AutopostMode;
  message: string;
  useEmbed?: boolean;
  embed?: DiscordEmbed;
  webhookUsername?: string;
  webhookAvatarUrl?: string;
  isBotToken?: boolean;
  channels?: ChannelTarget[];
}

export const DiscordPreview: React.FC<DiscordPreviewProps> = ({
  mode,
  message,
  useEmbed,
  embed,
  webhookUsername,
  webhookAvatarUrl,
  channels = [],
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('main');

  const selectedChan = channels.find((c) => c.id === selectedChannelId);

  // Active message to display: either channel's custom message or main message
  const activeMessage =
    selectedChan && selectedChan.useCustomMessage && selectedChan.customMessage
      ? selectedChan.customMessage
      : message;

  const activeChannelName =
    selectedChan ? selectedChan.name : '#general-chat';

  const username =
    mode === 'webhook'
      ? webhookUsername || 'Discord Webhook'
      : 'Autopost Bot';

  const avatarUrl =
    mode === 'webhook' && webhookAvatarUrl
      ? webhookAvatarUrl
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-white/10 bg-[#313338] p-4 text-slate-200 overflow-hidden shadow-xl">
      {/* Discord Header Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 mb-3 gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Pratinjau Tampilan Discord</span>
        </div>

        {/* Channel Selector Pills (if multi-channel) */}
        {channels.length > 0 ? (
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedChannelId('main')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedChannelId === 'main'
                  ? 'bg-[#5865F2] text-white font-semibold'
                  : 'bg-black/30 text-slate-400 hover:text-slate-200'
              }`}
            >
              Pesan Utama
            </button>
            {channels.map((ch, idx) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannelId(ch.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  selectedChannelId === ch.id
                    ? 'bg-[#5865F2] text-white font-semibold'
                    : 'bg-black/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{ch.name || `#${idx + 1}`}</span>
                {ch.useCustomMessage && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FEE75C]"></span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 bg-black/30 px-2 py-0.5 rounded font-mono">
            {activeChannelName}
          </span>
        )}
      </div>

      {/* Showing which channel is being previewed banner */}
      {selectedChan && (
        <div className="mb-3 px-2.5 py-1 rounded bg-black/30 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono">
            <Hash className="w-3 h-3 text-[#5865F2]" />
            Pratinjau: <strong>{selectedChan.name}</strong>
          </span>
          <span className="text-[10px] text-[#FEE75C]">
            {selectedChan.useCustomMessage ? '★ Menggunakan Pesan Khusus' : 'Menggunakan Pesan Utama'}
          </span>
        </div>
      )}

      {/* Discord Message Row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-700 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Bot className="w-5 h-5 text-slate-300" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
              {username}
            </span>
            <span className="bg-[#5865F2] text-[10px] uppercase font-bold text-white px-1.5 py-0.5 rounded flex items-center leading-none">
              BOT
            </span>
            <span className="text-[11px] text-slate-400">
              Hari ini jam {currentTime}
            </span>
          </div>

          {/* Text Message */}
          {message ? (
            <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed mb-2 font-normal">
              {message}
            </div>
          ) : !useEmbed ? (
            <div className="text-xs italic text-slate-500 mb-2">
              (Belum ada teks pesan yang dimasukkan)
            </div>
          ) : null}

          {/* Embed Box */}
          {useEmbed && embed && (
            <div
              className="rounded bg-[#2b2d31] p-3 border-l-4 text-xs max-w-lg mt-2 shadow-sm"
              style={{
                borderLeftColor: embed.color || '#5865F2',
              }}
            >
              {embed.authorName && (
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1.5">
                  {embed.authorIcon && (
                    <img
                      src={embed.authorIcon}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span>{embed.authorName}</span>
                </div>
              )}

              {embed.title && (
                <h4 className="font-bold text-sm text-white mb-1 hover:underline cursor-pointer">
                  {embed.title}
                </h4>
              )}

              {embed.description && (
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed mb-2">
                  {embed.description}
                </p>
              )}

              {embed.imageUrl && (
                <div className="rounded overflow-hidden my-2 max-h-48">
                  <img
                    src={embed.imageUrl}
                    alt="Embed content"
                    className="w-full object-cover rounded"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-white/5">
                <span>{embed.footer || 'Discord Autopost Bot'}</span>
                {embed.timestamp && <span>Hari ini jam {currentTime}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
