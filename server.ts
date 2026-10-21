import express, { Request, Response } from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Type definitions for internal state
interface EmbedData {
  title?: string;
  description?: string;
  color?: string;
  footer?: string;
  authorName?: string;
  authorIcon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  timestamp?: boolean;
}

export interface ChannelTargetData {
  id: string;
  name: string;
  channelId: string;
  customWebhookUrl?: string;
  enabled: boolean;
  useCustomMessage?: boolean;
  customMessage?: string;
  useCustomEmbed?: boolean;
  customEmbed?: EmbedData;
}

interface InternalConfig {
  mode: 'token' | 'webhook';
  token?: string;
  isBotToken?: boolean;
  serverId?: string;
  channelId: string; // can be comma-separated list of channels
  webhookUrl?: string;
  webhookUsername?: string;
  webhookAvatarUrl?: string;
  message: string;
  multipleMessages?: string[];
  messageMode?: 'single' | 'random' | 'sequential';
  delaySeconds: number;
  useJitter?: boolean;
  jitterSeconds?: number;
  useEmbed?: boolean;
  embed?: EmbedData;
  useTemplateVars?: boolean;
  autoStopOnErrorCount?: number;
  channels?: ChannelTargetData[];
  channelPostMode?: 'all' | 'round_robin';
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  channel?: string;
  code?: number;
  details?: string;
}

// Real-time Discord Gateway & API Probe
interface DiscordProbeResult {
  connected: boolean;
  latencyMs: number;
  checkedAt: string;
  gatewayUrl?: string;
  statusCode?: number;
  error?: string;
}

let cachedDiscordProbe: DiscordProbeResult = {
  connected: false,
  latencyMs: 0,
  checkedAt: new Date().toISOString(),
  error: 'Menghubungkan ke Discord...',
};
let lastDiscordProbeTime = 0;

async function probeDiscordApi(force = false): Promise<DiscordProbeResult> {
  const now = Date.now();
  if (!force && now - lastDiscordProbeTime < 4000) {
    return cachedDiscordProbe;
  }

  const start = Date.now();
  try {
    const res = await axios.get('https://discord.com/api/v10/gateway', {
      timeout: 6000,
      headers: {
        'User-Agent': 'DiscordAutopost/1.0 (LiveProbe)',
      },
    });
    const latencyMs = Date.now() - start;
    cachedDiscordProbe = {
      connected: true,
      latencyMs,
      checkedAt: new Date().toISOString(),
      gatewayUrl: res.data?.url || 'wss://gateway.discord.gg',
      statusCode: res.status,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    let errMsg = err.message;
    let statusCode: number | undefined;
    if (axios.isAxiosError(err)) {
      statusCode = err.response?.status;
      errMsg = err.response
        ? `HTTP ${err.response.status}`
        : err.code === 'ECONNABORTED'
        ? 'Timeout 6000ms'
        : err.message;
    }
    cachedDiscordProbe = {
      connected: false,
      latencyMs,
      checkedAt: new Date().toISOString(),
      statusCode,
      error: errMsg,
    };
  }
  lastDiscordProbeTime = Date.now();
  return cachedDiscordProbe;
}

// In-memory application state
class AutopostEngine {
  public isRunning: boolean = false;
  public startedAt: Date | null = null;
  public config: InternalConfig | null = null;
  public stats = {
    total: 0,
    success: 0,
    failed: 0,
    consecutiveErrors: 0,
  };
  public logs: LogEntry[] = [];
  public nextPostTime: number | null = null;
  private timer: NodeJS.Timeout | null = null;
  private messageIndex: number = 0;
  private maxLogs: number = 200;

  // Rate limiting tracker (Discord guideline max 30 requests/minute)
  private requestHistory: number[] = [];

  constructor() {
    this.addLog('info', 'Sistem Autopost Discord siap digunakan');
    // Initial live probe
    probeDiscordApi(true);
  }

  public addLog(
    level: 'info' | 'success' | 'warning' | 'error',
    message: string,
    meta?: { channel?: string; code?: number; details?: string }
  ) {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const logItem: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: `${formattedTime}`,
      level,
      message,
      channel: meta?.channel,
      code: meta?.code,
      details: meta?.details,
    };
    this.logs.unshift(logItem);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    console.log(`[${logItem.timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  public getStatus() {
    const uptimeSeconds = this.startedAt
      ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
      : 0;
    const nextIn =
      this.isRunning && this.nextPostTime
        ? Math.max(0, Math.ceil((this.nextPostTime - Date.now()) / 1000))
        : null;

    return {
      isRunning: this.isRunning,
      startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      uptimeSeconds,
      serverTimestamp: Date.now(),
      config: this.config
        ? {
            ...this.config,
            token: this.config.token ? `${this.config.token.substring(0, 6)}...***` : undefined,
          }
        : {},
      stats: this.stats,
      nextPostTime: this.nextPostTime,
      nextPostInSeconds: nextIn,
      logs: this.logs,
      discordApiHealth: cachedDiscordProbe,
      memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    };
  }

  public async start(config: InternalConfig): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return { success: false, message: 'Autopost sudah sedang berjalan' };
    }

    // Minimum delay validation
    if (!config.delaySeconds || config.delaySeconds < 3) {
      config.delaySeconds = 3;
    }

    this.config = { ...config };
    this.isRunning = true;
    this.startedAt = new Date();
    this.stats.consecutiveErrors = 0;
    this.messageIndex = 0;

    const targetDesc =
      config.mode === 'webhook'
        ? 'Webhook Discord'
        : `Channel ID [${config.channelId}] via Token`;

    this.addLog('info', `Autopost dimulai. Target: ${targetDesc}. Delay: ${config.delaySeconds}s`);

    // Execute first post immediately, then schedule next
    this.executePostCycle();

    return { success: true, message: 'Autopost berhasil dijalankan' };
  }

  public stop(reason: string = 'Autopost dihentikan'): { success: boolean; message: string } {
    if (!this.isRunning) {
      return { success: false, message: 'Autopost memang tidak sedang berjalan' };
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.isRunning = false;
    this.nextPostTime = null;
    this.addLog('info', `⏹ ${reason}`);

    return { success: true, message: reason };
  }

  public clearLogs() {
    this.logs = [];
    this.addLog('info', 'Log aktivitas telah dibersihkan');
  }

  // Parse template variables like {date}, {time}, {counter}, {random}
  public parseTemplate(text: string): string {
    if (!text) return '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    return text
      .replace(/\{date\}/gi, dateStr)
      .replace(/\{time\}/gi, timeStr)
      .replace(/\{counter\}/gi, String(this.stats.total + 1))
      .replace(/\{random\}/gi, randomCode)
      .replace(/\{timestamp\}/gi, String(Math.floor(Date.now() / 1000)));
  }

  // Choose message content based on single, random, or sequential mode
  public getNextMessageContent(): string {
    if (!this.config) return '';

    if (
      this.config.multipleMessages &&
      this.config.multipleMessages.length > 0 &&
      (this.config.messageMode === 'random' || this.config.messageMode === 'sequential')
    ) {
      const msgs = this.config.multipleMessages.filter((m) => m.trim().length > 0);
      if (msgs.length > 0) {
        if (this.config.messageMode === 'random') {
          const randomIndex = Math.floor(Math.random() * msgs.length);
          return msgs[randomIndex];
        } else {
          const msg = msgs[this.messageIndex % msgs.length];
          this.messageIndex++;
          return msg;
        }
      }
    }

    return this.config.message;
  }

  // Build Discord payload (content + embed) with optional per-channel embed override
  public buildPayload(rawMessage: string, customEmbed?: EmbedData, useCustomEmbed?: boolean) {
    const content = this.config?.useTemplateVars ? this.parseTemplate(rawMessage) : rawMessage;

    const payload: any = {
      content: content || undefined,
    };

    const shouldIncludeEmbed = useCustomEmbed ? true : this.config?.useEmbed;
    const embedSource = useCustomEmbed && customEmbed ? customEmbed : this.config?.embed;

    if (shouldIncludeEmbed && embedSource) {
      const e = embedSource;
      const embedObj: any = {};

      if (e.title) {
        embedObj.title = this.config?.useTemplateVars ? this.parseTemplate(e.title) : e.title;
      }
      if (e.description) {
        embedObj.description = this.config?.useTemplateVars
          ? this.parseTemplate(e.description)
          : e.description;
      }
      if (e.color) {
        // Convert hex to decimal
        const hex = e.color.replace('#', '');
        embedObj.color = parseInt(hex, 16) || 5793266;
      }
      if (e.footer) {
        embedObj.footer = {
          text: this.config?.useTemplateVars ? this.parseTemplate(e.footer) : e.footer,
        };
      }
      if (e.authorName) {
        embedObj.author = {
          name: this.config?.useTemplateVars ? this.parseTemplate(e.authorName) : e.authorName,
          icon_url: e.authorIcon || undefined,
        };
      }
      if (e.imageUrl) {
        embedObj.image = { url: e.imageUrl };
      }
      if (e.thumbnailUrl) {
        embedObj.thumbnail = { url: e.thumbnailUrl };
      }
      if (e.timestamp) {
        embedObj.timestamp = new Date().toISOString();
      }

      if (Object.keys(embedObj).length > 0) {
        payload.embeds = [embedObj];
      }
    }

    // Webhook overrides
    if (this.config?.mode === 'webhook') {
      if (this.config.webhookUsername) {
        payload.username = this.config.webhookUsername;
      }
      if (this.config.webhookAvatarUrl) {
        payload.avatar_url = this.config.webhookAvatarUrl;
      }
    }

    return payload;
  }

  // Send single message to Discord (either via Webhook or Token/Channel)
  public async sendToDiscord(
    channelId: string,
    payload: any,
    customConfig?: InternalConfig
  ): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
    const cfg = customConfig || this.config;
    if (!cfg) throw new Error('Konfigurasi tidak ditemukan');

    // Enforce 30 messages/minute sliding window
    const now = Date.now();
    this.requestHistory = this.requestHistory.filter((t) => now - t < 60000);
    if (this.requestHistory.length >= 30) {
      throw new Error('Rate limit safety: Maksimal 30 pesan per menit tercapai');
    }
    this.requestHistory.push(now);

    if (cfg.mode === 'webhook') {
      if (!cfg.webhookUrl) {
        throw new Error('URL Webhook belum diisi');
      }
      // Discord Webhook POST
      const res = await axios.post(cfg.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return { success: true, data: res.data, status: res.status };
    } else {
      // Token Bot or User
      if (!cfg.token) {
        throw new Error('Token Discord belum diisi');
      }
      if (!channelId || channelId.trim().length === 0) {
        throw new Error('ID Channel Discord belum diisi');
      }

      const cleanToken = cfg.token.trim();
      let authHeader = cleanToken;
      // If user specified it's a bot token or token does not begin with "Bot "
      if (cfg.isBotToken) {
        authHeader = cleanToken.startsWith('Bot ') ? cleanToken : `Bot ${cleanToken}`;
      }

      const url = `https://discord.com/api/v10/channels/${channelId.trim()}/messages`;
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'DiscordAutopost/1.0 (WebClient)',
        },
        timeout: 10000,
      });
      return { success: true, data: res.data, status: res.status };
    }
  }

  // Execute a posting cycle
  private async executePostCycle() {
    if (!this.isRunning || !this.config) return;

    let rateLimitDelay = 0;

    // Check if rich multi-channel targets are configured
    const configuredChannels = this.config.channels?.filter(
      (c) => c.enabled !== false && (c.channelId?.trim() || c.customWebhookUrl?.trim())
    );

    if (configuredChannels && configuredChannels.length > 0) {
      // MULTI-CHANNEL WITH CUSTOM MESSAGES PER CHANNEL
      for (const target of configuredChannels) {
        if (!this.isRunning) break;

        // Choose message: custom for this channel or global rotation/single
        const rawMessage =
          target.useCustomMessage && target.customMessage && target.customMessage.trim().length > 0
            ? target.customMessage
            : this.getNextMessageContent();

        const payload = this.buildPayload(
          rawMessage,
          target.customEmbed,
          target.useCustomEmbed
        );

        const targetLabel =
          target.name ||
          (this.config.mode === 'webhook' ? 'Webhook' : `#${target.channelId}`);

        try {
          if (
            this.config.mode === 'webhook' ||
            (target.customWebhookUrl && target.customWebhookUrl.startsWith('http'))
          ) {
            const webhookUrl = target.customWebhookUrl?.trim() || this.config.webhookUrl;
            if (!webhookUrl) throw new Error('URL Webhook untuk channel ini belum diisi');
            await axios.post(webhookUrl, payload, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000,
            });
          } else {
            await this.sendToDiscord(target.channelId.trim(), payload);
          }

          this.stats.total++;
          this.stats.success++;
          this.stats.consecutiveErrors = 0;
          this.addLog('success', `✓ Pesan terkirim ke [${targetLabel}]`, {
            channel: targetLabel,
          });
        } catch (err: any) {
          this.handlePostError(err, targetLabel, (delay) => {
            rateLimitDelay = Math.max(rateLimitDelay, delay);
          });
          if (!this.isRunning) return;
        }

        // Delay between channels to avoid rate limit spikes
        if (configuredChannels.length > 1) {
          await new Promise((r) => setTimeout(r, 750));
        }
      }
    } else {
      // FALLBACK: Standard single or comma-separated channel IDs
      const rawMessage = this.getNextMessageContent();
      const payload = this.buildPayload(rawMessage);

      const channels =
        this.config.mode === 'webhook'
          ? ['webhook']
          : (this.config.channelId || '')
              .split(/[\n,]+/)
              .map((c) => c.trim())
              .filter((c) => c.length > 0);

      for (const ch of channels) {
        if (!this.isRunning) break;

        const targetLabel = this.config.mode === 'webhook' ? 'Webhook' : `#${ch}`;

        try {
          await this.sendToDiscord(ch, payload);
          this.stats.total++;
          this.stats.success++;
          this.stats.consecutiveErrors = 0;
          this.addLog('success', `✓ Pesan terkirim ke ${targetLabel}`, { channel: ch });
        } catch (err: any) {
          this.handlePostError(err, targetLabel, (delay) => {
            rateLimitDelay = Math.max(rateLimitDelay, delay);
          });
          if (!this.isRunning) return;
        }

        if (channels.length > 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (!this.isRunning) return;

    // Schedule next execution
    let baseDelayMs = (this.config.delaySeconds || 5) * 1000;

    // Apply jitter variation if requested (avoid strict predictable intervals)
    if (this.config.useJitter) {
      const jitterRange = (this.config.jitterSeconds || 2) * 1000;
      const jitter = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
      baseDelayMs = Math.max(3000, baseDelayMs + jitter);
    }

    // If rate limited, prioritize rate limit delay
    const finalDelayMs = Math.max(baseDelayMs, rateLimitDelay);
    this.nextPostTime = Date.now() + finalDelayMs;

    this.timer = setTimeout(() => {
      this.executePostCycle();
    }, finalDelayMs);
  }

  // Common error handling helper
  private handlePostError(
    err: any,
    channelLabel: string,
    onRateLimit: (delayMs: number) => void
  ) {
    this.stats.total++;
    this.stats.failed++;
    this.stats.consecutiveErrors++;

    let errorMsg = 'Gagal mengirim pesan';
    let statusCode: number | undefined;

    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<any>;
      statusCode = axiosErr.response?.status;
      const resData = axiosErr.response?.data;

      if (statusCode === 400) {
        errorMsg = `[400 Bad Request] Input pesan/embed atau ID channel tidak valid`;
      } else if (statusCode === 401) {
        errorMsg = `[401 Unauthorized] Token salah atau tidak memiliki akses`;
      } else if (statusCode === 403) {
        errorMsg = `[403 Forbidden] Tidak memiliki izin kirim pesan di channel/server ini`;
      } else if (statusCode === 404) {
        errorMsg = `[404 Not Found] Channel atau Webhook tidak ditemukan`;
      } else if (statusCode === 429) {
        const retryAfter = resData?.retry_after || 5;
        errorMsg = `[429 Rate Limit] Discord membatasi request. Menunggu ${retryAfter} detik`;
        onRateLimit(Math.ceil(retryAfter * 1000));
      } else if (statusCode && statusCode >= 500) {
        errorMsg = `[500 Discord Error] Server Discord sedang bermasalah`;
      } else if (axiosErr.code === 'ECONNABORTED') {
        errorMsg = `[Timeout] Request ke Discord melebihi batas waktu 10 detik`;
      } else {
        errorMsg = `[Error ${statusCode || 'Network'}] ${resData?.message || axiosErr.message}`;
      }
    } else {
      errorMsg = err.message || 'Kesalahan sistem tidak terduga';
    }

    this.addLog('error', errorMsg, {
      channel: channelLabel,
      code: statusCode,
      details: JSON.stringify(err.response?.data || {}),
    });

    const maxErrors = this.config?.autoStopOnErrorCount || 3;
    if (this.stats.consecutiveErrors >= maxErrors) {
      this.stop(`Otomatis berhenti: Terjadi ${maxErrors}x error berturut-turut`);
    }
  }
}

const engine = new AutopostEngine();

// API Endpoints
// 1. POST /api/start
app.post('/api/start', async (req: Request, res: Response) => {
  try {
    const config: InternalConfig = req.body;

    const hasRichChannels =
      Array.isArray(config.channels) && config.channels.length > 0;
    const activeTargets = hasRichChannels
      ? config.channels!.filter(
          (c) => c.enabled !== false && (c.channelId?.trim() || c.customWebhookUrl?.trim())
        )
      : [];

    if (hasRichChannels) {
      if (activeTargets.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Setidaknya satu channel tujuan harus aktif dan memiliki ID Channel / Webhook!',
        });
      }
      if (config.mode === 'token' && (!config.token || config.token.trim().length === 0)) {
        return res.status(400).json({ success: false, message: 'Token Discord wajib diisi!' });
      }
      // Check message content
      const hasAnyMessage =
        Boolean(config.message?.trim()) ||
        Boolean(config.useEmbed) ||
        activeTargets.some((t) => t.useCustomMessage && t.customMessage?.trim());
      if (!hasAnyMessage) {
        return res.status(400).json({
          success: false,
          message: 'Pesan utama atau pesan khusus per channel tidak boleh kosong!',
        });
      }
    } else {
      // Legacy single/comma separated channels
      if (config.mode === 'webhook') {
        if (!config.webhookUrl || !config.webhookUrl.startsWith('http')) {
          return res.status(400).json({ success: false, message: 'URL Webhook wajib diisi dan valid!' });
        }
      } else {
        if (!config.token || config.token.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'Token Discord wajib diisi!' });
        }
        if (!config.channelId || config.channelId.trim().length === 0) {
          return res.status(400).json({ success: false, message: 'ID Channel Discord wajib diisi!' });
        }
      }

      if (!config.message && !config.useEmbed) {
        return res
          .status(400)
          .json({ success: false, message: 'Pesan atau embed tidak boleh kosong!' });
      }
    }

    const result = await engine.start(config);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. POST /api/stop
app.post('/api/stop', (req: Request, res: Response) => {
  const result = engine.stop('Autopost dihentikan oleh pengguna');
  return res.json(result);
});

// 3. GET /api/status (Real-time probe of Discord API and process status)
app.get('/api/status', async (req: Request, res: Response) => {
  const force = req.query.force === 'true';
  await probeDiscordApi(force);
  return res.json(engine.getStatus());
});

// 3b. GET /api/ping-discord (Dedicated real-time ping to Discord official API gateway)
app.get('/api/ping-discord', async (req: Request, res: Response) => {
  const result = await probeDiscordApi(true);
  return res.json(result);
});

// 3c. POST /api/probe-target (Actively test the user's specific Discord bot token or webhook destination)
app.post('/api/probe-target', async (req: Request, res: Response) => {
  const { mode, token, isBotToken, webhookUrl } = req.body;
  const start = Date.now();

  if (mode === 'webhook') {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return res.status(400).json({
        checked: true,
        valid: false,
        error: 'URL Webhook belum diisi atau tidak valid (harus dimulai dengan https://)',
        checkedAt: new Date().toISOString(),
      });
    }
    try {
      const resDiscord = await axios.get(webhookUrl, { timeout: 7000 });
      const latencyMs = Date.now() - start;
      return res.json({
        checked: true,
        valid: true,
        latencyMs,
        targetType: 'webhook',
        targetName: resDiscord.data?.name || 'Discord Webhook',
        channelId: resDiscord.data?.channel_id,
        guildId: resDiscord.data?.guild_id,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      let errMsg = 'Webhook tidak dapat dihubungi';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errMsg = 'Webhook 404 Not Found: URL Webhook tidak ada atau sudah dihapus di Discord';
        } else if (err.response?.status === 401) {
          errMsg = 'Webhook 401 Unauthorized: Kredensial Webhook tidak sah';
        } else {
          errMsg = err.response?.data?.message || err.message;
        }
      }
      return res.status(400).json({
        checked: true,
        valid: false,
        latencyMs,
        error: errMsg,
        checkedAt: new Date().toISOString(),
      });
    }
  } else {
    if (!token || !token.trim()) {
      return res.status(400).json({
        checked: true,
        valid: false,
        error: 'Token Discord belum diisi',
        checkedAt: new Date().toISOString(),
      });
    }

    const cleanToken = token.trim();
    const authHeader = isBotToken
      ? cleanToken.startsWith('Bot ')
        ? cleanToken
        : `Bot ${cleanToken}`
      : cleanToken;

    try {
      const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: authHeader,
          'User-Agent': 'DiscordAutopost/1.0 (TargetProbe)',
        },
        timeout: 7000,
      });
      const latencyMs = Date.now() - start;
      return res.json({
        checked: true,
        valid: true,
        latencyMs,
        targetType: userRes.data?.bot ? 'bot' : 'user',
        targetName: userRes.data?.username,
        channelId: req.body.channelId,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      let errMsg = 'Gagal verifikasi token';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          errMsg = '401 Unauthorized: Token tidak valid atau sudah kadaluarsa';
        } else if (err.response?.status === 403) {
          errMsg = '403 Forbidden: Token tidak diizinkan mengakses Discord API';
        } else {
          errMsg = err.response?.data?.message || err.message;
        }
      }
      return res.status(400).json({
        checked: true,
        valid: false,
        latencyMs,
        error: errMsg,
        checkedAt: new Date().toISOString(),
      });
    }
  }
});

// 4. POST /api/test (Send one test message immediately to specific channel or global)
app.post('/api/test', async (req: Request, res: Response) => {
  try {
    const { targetChannelId, ...config }: InternalConfig & { targetChannelId?: string } = req.body;

    // Check if testing a specific target channel from config.channels
    let selectedTarget: ChannelTargetData | undefined;
    if (targetChannelId && Array.isArray(config.channels)) {
      selectedTarget = config.channels.find((c) => c.id === targetChannelId || c.channelId === targetChannelId);
    } else if (Array.isArray(config.channels) && config.channels.length > 0) {
      selectedTarget = config.channels.find((c) => c.enabled !== false && (c.channelId?.trim() || c.customWebhookUrl?.trim()));
    }

    let targetChannel = config.channelId ? config.channelId.split(/[\n,]+/)[0].trim() : '';
    let targetLabel = 'Discord';
    let rawMessage = config.message || '🔔 Test autopost dari Discord Autopost Web';
    let customEmbed = config.embed;
    let useCustomEmbed = config.useEmbed;
    let specificWebhookUrl = config.webhookUrl;

    if (selectedTarget) {
      targetChannel = selectedTarget.channelId?.trim() || '';
      targetLabel = selectedTarget.name || `#${targetChannel}`;
      if (selectedTarget.useCustomMessage && selectedTarget.customMessage && selectedTarget.customMessage.trim().length > 0) {
        rawMessage = selectedTarget.customMessage;
      }
      if (selectedTarget.useCustomEmbed && selectedTarget.customEmbed) {
        customEmbed = selectedTarget.customEmbed;
        useCustomEmbed = true;
      }
      if (selectedTarget.customWebhookUrl) {
        specificWebhookUrl = selectedTarget.customWebhookUrl;
      }
    }

    if (config.mode === 'webhook') {
      if (!specificWebhookUrl) {
        return res.status(400).json({ success: false, message: 'URL Webhook wajib diisi' });
      }
    } else {
      if (!config.token) {
        return res.status(400).json({ success: false, message: 'Token Discord wajib diisi' });
      }
      if (!targetChannel) {
        return res.status(400).json({ success: false, message: 'ID Channel tujuan wajib diisi' });
      }
    }

    const payload = engine.buildPayload(rawMessage, customEmbed, useCustomEmbed);

    let sendRes: any;
    if (config.mode === 'webhook' || (specificWebhookUrl && specificWebhookUrl.startsWith('http'))) {
      sendRes = await axios.post(specificWebhookUrl!, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      targetLabel = selectedTarget?.name || 'Webhook';
    } else {
      sendRes = await engine.sendToDiscord(targetChannel, payload, config);
    }

    engine.addLog('success', `[Test Post] Pesan uji coba berhasil dikirim ke [${targetLabel}]!`, {
      channel: targetLabel,
    });

    return res.json({
      success: true,
      message: `Pesan uji coba berhasil terkirim ke [${targetLabel}]!`,
      data: sendRes.data,
    });
  } catch (err: any) {
    let msg = err.message;
    if (axios.isAxiosError(err)) {
      msg = `[HTTP ${err.response?.status}] ${err.response?.data?.message || err.message}`;
    }
    engine.addLog('error', `[Test Post Gagal] ${msg}`);
    return res.status(400).json({ success: false, message: msg });
  }
});

// 5. POST /api/validate (Validate token connection or webhook URL)
app.post('/api/validate', async (req: Request, res: Response) => {
  try {
    const { mode, token, isBotToken, webhookUrl } = req.body;

    if (mode === 'webhook') {
      if (!webhookUrl) {
        return res.status(400).json({ valid: false, message: 'URL Webhook kosong' });
      }
      // Discord Webhook GET retrieves webhook info
      const check = await axios.get(webhookUrl, { timeout: 8000 });
      return res.json({
        valid: true,
        type: 'webhook',
        name: check.data.name || 'Webhook Discord',
        channelId: check.data.channel_id,
        guildId: check.data.guild_id,
      });
    } else {
      if (!token) {
        return res.status(400).json({ valid: false, message: 'Token Discord kosong' });
      }
      const cleanToken = token.trim();
      const authHeader = isBotToken
        ? cleanToken.startsWith('Bot ')
          ? cleanToken
          : `Bot ${cleanToken}`
        : cleanToken;

      const userRes = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: authHeader,
          'User-Agent': 'DiscordAutopost/1.0',
        },
        timeout: 8000,
      });

      return res.json({
        valid: true,
        type: userRes.data.bot ? 'bot' : 'user',
        id: userRes.data.id,
        username: userRes.data.username,
        discriminator: userRes.data.discriminator,
        avatar: userRes.data.avatar,
      });
    }
  } catch (err: any) {
    let msg = 'Koneksi gagal diverifikasi';
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        msg = 'Token tidak valid atau tidak memiliki izin akses';
      } else if (err.response?.status === 404) {
        msg = 'Webhook tidak ditemukan';
      } else {
        msg = err.response?.data?.message || err.message;
      }
    }
    return res.status(400).json({ valid: false, message: msg });
  }
});

// 6. POST /api/clear-logs
app.post('/api/clear-logs', (req: Request, res: Response) => {
  engine.clearLogs();
  return res.json({ success: true });
});

// 7. GET /api/export-logs
app.get('/api/export-logs', (req: Request, res: Response) => {
  const status = engine.getStatus();
  const textContent = status.logs
    .slice()
    .reverse()
    .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="discord-autopost-activity.log"');
  return res.send(textContent || 'Belum ada log aktivitas.');
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vite middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Discord Autopost] Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
