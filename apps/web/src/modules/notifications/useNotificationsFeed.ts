import { useEffect, useState } from 'react';
import { fetchNotifications } from '../../app/api/controlPlane.ts';

export type NotificationFeedItem = {
  id: string;
  level: string;
  title: string;
  message: string;
  source: string;
  createdAt: string;
};

type NotificationsFeedOptions = {
  hours?: number | null;
  level?: string;
  limit?: number;
  source?: string;
};

export function useNotificationsFeed(options: NotificationsFeedOptions = {}) {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours = null, level = '', limit = 50, source = '' } = options;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNotifications({
      hours,
      level,
      limit,
      source,
    })
      .then((payload) => {
        if (mounted) {
          setItems(Array.isArray(payload?.events) ? payload.events : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [hours, level, limit, source]);

  return { items, loading };
}
