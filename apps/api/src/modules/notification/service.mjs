const notificationEvents = [];

export function listNotifications(limit = 50) {
  return notificationEvents.slice(0, limit);
}

export function appendNotification(event) {
  const entry = {
    id: `notification-${Date.now()}-${notificationEvents.length + 1}`,
    level: event.level || 'info',
    title: event.title || 'Notification',
    message: event.message || '',
    source: event.source || 'system',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
  notificationEvents.unshift(entry);
  notificationEvents.splice(100);
  return entry;
}
