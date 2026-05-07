export {
  type EmailConfig,
  type EmailDeliveryResult,
  type EmailMessage,
  type EmailTemplate,
  renderEmailTemplate,
  sendEmail,
} from './channels/email.js';
export {
  buildWebhookPayload,
  sendWebhook,
  signPayload,
  verifySignature,
  type WebhookConfig,
  type WebhookDeliveryResult,
  type WebhookPayload,
} from './channels/webhook.js';
export {
  createWebSocketMessage,
  WebSocketChannelManager,
  type WebSocketClient,
  type WebSocketConfig,
  type WebSocketDeliveryResult,
  type WebSocketMessage,
} from './channels/websocket.js';
export {
  type ChannelPreference,
  createDefaultPreference,
  type EmailChannelConfig,
  getEnabledChannels,
  isQuietHours,
  type NotificationChannel,
  type NotificationEventType,
  type NotificationPreference,
  setEventRouting,
  shouldSendNotification,
  updateChannelConfig,
  type WebhookChannelConfig,
} from './preferences.js';
