export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  from: string;
  enabled: boolean;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailMessage {
  to: string;
  template: EmailTemplate;
  metadata?: Record<string, string>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

const TEMPLATES: Record<string, (data: Record<string, string>) => EmailTemplate> = {
  order_filled: (data) => ({
    subject: `Order Filled: ${data.side} ${data.qty} ${data.symbol} @ ${data.price}`,
    htmlBody: `<h2>Order Filled</h2><p>${data.side} ${data.qty} shares of ${data.symbol} at $${data.price}</p><p>PnL: ${data.pnl || 'N/A'}</p>`,
    textBody: `Order Filled: ${data.side} ${data.qty} ${data.symbol} @ ${data.price}\nPnL: ${data.pnl || 'N/A'}`,
  }),
  risk_alert: (data) => ({
    subject: `Risk Alert: ${data.level} - ${data.title}`,
    htmlBody: `<h2>Risk Alert</h2><p><strong>${data.level}</strong>: ${data.title}</p><p>${data.message}</p>`,
    textBody: `Risk Alert [${data.level}]: ${data.title}\n${data.message}`,
  }),
  strategy_promoted: (data) => ({
    subject: `Strategy Promoted: ${data.strategyName}`,
    htmlBody: `<h2>Strategy Promoted</h2><p>Strategy "${data.strategyName}" has been promoted to ${data.targetStage}.</p>`,
    textBody: `Strategy "${data.strategyName}" promoted to ${data.targetStage}.`,
  }),
  system_alert: (data) => ({
    subject: `System Alert: ${data.title}`,
    htmlBody: `<h2>System Alert</h2><p>${data.message}</p>`,
    textBody: `System Alert: ${data.title}\n${data.message}`,
  }),
};

export function renderEmailTemplate(
  templateId: string,
  data: Record<string, string>
): EmailTemplate {
  const renderer = TEMPLATES[templateId];
  if (!renderer) {
    return {
      subject: data.title || 'Notification',
      htmlBody: `<p>${data.message || JSON.stringify(data)}</p>`,
      textBody: data.message || JSON.stringify(data),
    };
  }
  return renderer(data);
}

export async function sendEmail(
  config: EmailConfig,
  message: EmailMessage
): Promise<EmailDeliveryResult> {
  if (!config.enabled) {
    return {
      success: false,
      error: 'Email channel is disabled',
      timestamp: new Date().toISOString(),
    };
  }

  if (!message.to || !message.template.subject) {
    return {
      success: false,
      error: 'Missing required fields: to, subject',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    switch (config.provider) {
      case 'sendgrid':
        return await sendViaSendGrid(config, message);
      case 'ses':
        return await sendViaSES(config, message);
      default:
        return await sendViaSMTP(config, message);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

async function sendViaSMTP(
  _config: EmailConfig,
  _message: EmailMessage
): Promise<EmailDeliveryResult> {
  // In production, use nodemailer or similar
  // For now, simulate the send
  return {
    success: true,
    messageId: `smtp-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

async function sendViaSendGrid(
  config: EmailConfig,
  _message: EmailMessage
): Promise<EmailDeliveryResult> {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'SendGrid API key not configured',
      timestamp: new Date().toISOString(),
    };
  }

  // In production, use SendGrid SDK
  return {
    success: true,
    messageId: `sg-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

async function sendViaSES(
  config: EmailConfig,
  _message: EmailMessage
): Promise<EmailDeliveryResult> {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'SES credentials not configured',
      timestamp: new Date().toISOString(),
    };
  }

  // In production, use AWS SES SDK
  return {
    success: true,
    messageId: `ses-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}
