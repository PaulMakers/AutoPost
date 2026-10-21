export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: string; // hex string e.g. #5865F2
  footer?: string;
  authorName?: string;
  authorIcon?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  timestamp?: boolean;
}

export type AutopostMode = 'token' | 'webhook';
export type MessageMode = 'single' | 'random' | 'sequential';

export interface ChannelTarget {
  id: string;
  name: string;
  channelId: string;
  customWebhookUrl?: string;
  enabled: boolean;
  useCustomMessage: boolean;
  customMessage?: string;
  useCustomEmbed?: boolean;
  customEmbed?: DiscordEmbed;
}

export interface AutopostConfig {
  mode: AutopostMode;
  token?: string;
  isBotToken?: boolean;
  serverId?: string;
  channelId: string; // single or comma-separated for multi-channel fallback
  webhookUrl?: string;
  webhookUsername?: string;
  webhookAvatarUrl?: string;
  message: string;
  multipleMessages?: string[];
  messageMode?: MessageMode;
  delaySeconds: number;
  useJitter?: boolean;
  jitterSeconds?: number;
  useEmbed?: boolean;
  embed?: DiscordEmbed;
  useTemplateVars?: boolean;
  autoStopOnErrorCount?: number;
  channels?: ChannelTarget[];
  channelPostMode?: 'all' | 'round_robin';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  channel?: string;
  code?: number;
  details?: string;
}

export interface DiscordApiHealth {
  connected: boolean;
  latencyMs: number;
  checkedAt: string;
  gatewayUrl?: string;
  statusCode?: number;
  error?: string;
}

export interface TargetHealth {
  checked: boolean;
  valid: boolean;
  latencyMs?: number;
  targetType?: 'webhook' | 'bot' | 'user';
  targetName?: string;
  channelId?: string;
  guildId?: string;
  error?: string;
  checkedAt?: string;
}

export interface AutopostStatusResponse {
  isRunning: boolean;
  startedAt: string | null;
  uptimeSeconds: number;
  serverTimestamp: number;
  config: Partial<AutopostConfig> & { tokenPreview?: string };
  stats: {
    total: number;
    success: number;
    failed: number;
    consecutiveErrors: number;
  };
  nextPostTime: number | null;
  nextPostInSeconds: number | null;
  logs: ActivityLog[];
  rateLimitRemaining?: number;
  discordApiHealth: DiscordApiHealth;
  memoryUsageMb: number;
}

