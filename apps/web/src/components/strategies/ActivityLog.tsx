import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';

interface Activity {
  id: string;
  strategyId: string;
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

interface ActivityLogProps {
  strategyId: string;
  className?: string;
}

const ACTION_LABELS: Record<string, { en: string; zh: string }> = {
  share: { en: 'Shared strategy', zh: '分享了策略' },
  comment: { en: 'Added comment', zh: '添加了评论' },
  resolve_comment: { en: 'Resolved comment', zh: '解决了评论' },
  edit: { en: 'Edited strategy', zh: '编辑了策略' },
  fork: { en: 'Forked strategy', zh: '复制了策略' },
};

const ACTION_ICONS: Record<string, string> = {
  share: '🔗',
  comment: '💬',
  resolve_comment: '✅',
  edit: '✏️',
  fork: '🍴',
};

export function ActivityLog({ strategyId, className = '' }: ActivityLogProps) {
  const { locale } = useLocale();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('action', filter);

      const res = await fetch(`/api/strategies/${strategyId}/activity?${params}`);
      const data = await res.json();

      if (data.ok) {
        setActivity(data.activity);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }, [strategyId, filter]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return locale === 'zh' ? '刚刚' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${locale === 'zh' ? '分钟前' : 'mins ago'}`;
    if (diffHours < 24) return `${diffHours} ${locale === 'zh' ? '小时前' : 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${locale === 'zh' ? '天前' : 'days ago'}`;

    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActionLabel = (action: string) => {
    const labels = ACTION_LABELS[action];
    return labels ? (locale === 'zh' ? labels.zh : labels.en) : action;
  };

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action] || '📋';
  };

  if (loading) {
    return (
      <div className={className} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
        {locale === 'zh' ? '加载活动记录...' : 'Loading activity...'}
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ font: '700 14px/1.3 var(--font-ui)', color: 'var(--text)' }}>
          {locale === 'zh' ? '活动记录' : 'Activity Log'}
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '4px 8px',
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            font: '400 12px/1 var(--font-ui)',
            outline: 'none',
          }}
        >
          <option value="all">{locale === 'zh' ? '全部' : 'All'}</option>
          <option value="share">{locale === 'zh' ? '分享' : 'Shares'}</option>
          <option value="comment">{locale === 'zh' ? '评论' : 'Comments'}</option>
          <option value="edit">{locale === 'zh' ? '编辑' : 'Edits'}</option>
        </select>
      </div>

      {/* Activity list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activity.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--muted)',
              font: '400 13px/1.5 var(--font-ui)',
            }}
          >
            {locale === 'zh' ? '暂无活动记录' : 'No activity yet'}
          </div>
        ) : (
          activity.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 12px',
                background: idx === 0 ? 'var(--accent-subtle)' : 'var(--panel)',
                borderRadius: 'var(--radius)',
                border: idx === 0 ? '1px solid var(--accent)' : '1px solid var(--line)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--panel-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                {getActionIcon(item.action)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '400 13px/1.4 var(--font-ui)', color: 'var(--text)' }}>
                  <span style={{ fontWeight: 600 }}>{item.userName}</span>{' '}
                  {getActionLabel(item.action)}
                </div>
                <div style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)', marginTop: '2px' }}>
                  {formatDate(item.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
