import { useCallback, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';

interface ShareDialogProps {
  strategyId: string;
  onClose: () => void;
  onShare?: () => void;
}

export function ShareDialog({ strategyId, onClose, onShare }: ShareDialogProps) {
  const { locale } = useLocale();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleShare = useCallback(async () => {
    if (!userId.trim()) {
      setError(locale === 'zh' ? '请输入用户 ID' : 'Please enter user ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/strategies/${strategyId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          userName: userName.trim() || 'User',
          permission,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        onShare?.();
        onClose();
      } else {
        setError(data.message || 'Failed to share strategy');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [strategyId, userId, userName, permission, locale, onShare, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3, 4, 18, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '90%',
          maxWidth: '400px',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3 style={{ font: '700 16px/1.3 var(--font-ui)', color: 'var(--text)', marginBottom: '16px' }}>
          {locale === 'zh' ? '分享策略' : 'Share Strategy'}
        </h3>

        {/* User ID */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', font: '500 12px/1 var(--font-ui)', color: 'var(--muted)', marginBottom: '6px' }}>
            {locale === 'zh' ? '用户 ID' : 'User ID'}
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={locale === 'zh' ? '输入用户 ID' : 'Enter user ID'}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              font: '400 13px/1 var(--font-ui)',
              outline: 'none',
            }}
          />
        </div>

        {/* User Name */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', font: '500 12px/1 var(--font-ui)', color: 'var(--muted)', marginBottom: '6px' }}>
            {locale === 'zh' ? '用户名' : 'Username'}
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={locale === 'zh' ? '输入用户名（可选）' : 'Enter username (optional)'}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              font: '400 13px/1 var(--font-ui)',
              outline: 'none',
            }}
          />
        </div>

        {/* Permission */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', font: '500 12px/1 var(--font-ui)', color: 'var(--muted)', marginBottom: '6px' }}>
            {locale === 'zh' ? '权限级别' : 'Permission Level'}
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as 'view' | 'comment' | 'edit')}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              font: '400 13px/1 var(--font-ui)',
              outline: 'none',
            }}
          >
            <option value="view">{locale === 'zh' ? '仅查看' : 'View only'}</option>
            <option value="comment">{locale === 'zh' ? '可评论' : 'Can comment'}</option>
            <option value="edit">{locale === 'zh' ? '可编辑' : 'Can edit'}</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '12px', padding: '8px', background: 'var(--danger-subtle)', borderRadius: 'var(--radius)', color: 'var(--danger)', font: '400 12px/1.4 var(--font-ui)' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              color: 'var(--muted)',
              font: '600 13px/1 var(--font-ui)',
              cursor: 'pointer',
            }}
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: '#fff',
              font: '600 13px/1 var(--font-ui)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? locale === 'zh'
                ? '分享中...'
                : 'Sharing...'
              : locale === 'zh'
                ? '分享'
                : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
