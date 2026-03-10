import { useEffect, useState } from 'react';
import { fetchNotifications } from '../../services/controlPlane.ts';

export type NotificationFeedItem = {
  id: string;
  level: string;
  title: string;
  message: string;
  source: string;
  createdAt: string;
};

export function useNotificationsFeed() {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchNotifications()
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
  }, []);

  return { items, loading };
}
