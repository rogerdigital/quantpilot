export type NotificationChannel = 'email' | 'webhook' | 'websocket';
export type NotificationEventType =
  | 'order_filled'
  | 'risk_alert'
  | 'strategy_promoted'
  | 'system_alert'
  | 'approval_required';

export interface NotificationPreference {
  userId: string;
  channels: Record<NotificationChannel, ChannelPreference>;
  eventRouting: Record<NotificationEventType, NotificationChannel[]>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface ChannelPreference {
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface EmailChannelConfig {
  address: string;
  verified: boolean;
}

export interface WebhookChannelConfig {
  url: string;
  secret?: string;
}

export function createDefaultPreference(userId: string): NotificationPreference {
  return {
    userId,
    channels: {
      email: { enabled: false },
      webhook: { enabled: false },
      websocket: { enabled: true },
    },
    eventRouting: {
      order_filled: ['websocket'],
      risk_alert: ['websocket', 'email'],
      strategy_promoted: ['websocket'],
      system_alert: ['websocket', 'email'],
      approval_required: ['websocket'],
    },
    timezone: 'Asia/Shanghai',
  };
}

export function getEnabledChannels(
  preference: NotificationPreference,
  eventType: NotificationEventType
): NotificationChannel[] {
  const routedChannels = preference.eventRouting[eventType] ?? [];
  return routedChannels.filter((channel) => {
    const channelPref = preference.channels[channel];
    return channelPref?.enabled ?? false;
  });
}

export function isQuietHours(preference: NotificationPreference): boolean {
  if (!preference.quietHoursStart || !preference.quietHoursEnd) return false;

  const now = new Date();
  const tz = preference.timezone || 'Asia/Shanghai';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const currentTime = formatter.format(now);

  return currentTime >= preference.quietHoursStart && currentTime <= preference.quietHoursEnd;
}

export function shouldSendNotification(
  preference: NotificationPreference,
  eventType: NotificationEventType,
  channel: NotificationChannel
): boolean {
  if (isQuietHours(preference)) return false;

  const channelPref = preference.channels[channel];
  if (!channelPref?.enabled) return false;

  const routedChannels = preference.eventRouting[eventType] ?? [];
  return routedChannels.includes(channel);
}

export function updateChannelConfig(
  preference: NotificationPreference,
  channel: NotificationChannel,
  config: Record<string, unknown>
): NotificationPreference {
  return {
    ...preference,
    channels: {
      ...preference.channels,
      [channel]: {
        ...preference.channels[channel],
        config,
      },
    },
  };
}

export function setEventRouting(
  preference: NotificationPreference,
  eventType: NotificationEventType,
  channels: NotificationChannel[]
): NotificationPreference {
  return {
    ...preference,
    eventRouting: {
      ...preference.eventRouting,
      [eventType]: channels,
    },
  };
}
