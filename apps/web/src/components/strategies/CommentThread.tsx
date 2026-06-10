import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '../../modules/console/console.i18n.tsx';
import { CloseIcon } from '../common/AppIcons.tsx';

interface Comment {
  id: string;
  strategyId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentThreadProps {
  strategyId: string;
  className?: string;
}

export function CommentThread({ strategyId, className = '' }: CommentThreadProps) {
  const { locale } = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}/comments`);
      const data = await res.json();
      if (data.ok) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [strategyId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/strategies/${strategyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyTo,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      const res = await fetch(`/api/strategies/comments/${commentId}/resolve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Organize comments into threads
  const rootComments = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  const getReplies = (parentId: string) => replies.filter((r) => r.parentId === parentId);

  if (loading) {
    return (
      <div
        className={className}
        style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}
      >
        {locale === 'zh' ? '加载评论...' : 'Loading comments...'}
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: '16px' }}>
      <h3
        style={{ font: '700 14px/1.3 var(--font-ui)', color: 'var(--text)', marginBottom: '16px' }}
      >
        {locale === 'zh' ? '评论' : 'Comments'} ({comments.length})
      </h3>

      {/* New comment input */}
      <div style={{ marginBottom: '20px' }}>
        {replyTo && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              background: 'var(--panel)',
              borderRadius: 'var(--radius)',
              marginBottom: '8px',
              font: '400 12px/1 var(--font-ui)',
              color: 'var(--muted)',
            }}
          >
            <span>
              {locale === 'zh' ? '回复' : 'Replying to'}{' '}
              {comments.find((c) => c.id === replyTo)?.userName}
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              aria-label={locale === 'zh' ? '取消回复' : 'Cancel reply'}
              style={{
                width: '28px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <CloseIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={locale === 'zh' ? '添加评论...' : 'Add a comment...'}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            font: '400 13px/1.5 var(--font-ui)',
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            style={{
              padding: '6px 14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius)',
              color: 'var(--on-accent)',
              font: '600 12px/1 var(--font-ui)',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !newComment.trim() ? 0.6 : 1,
            }}
          >
            {submitting
              ? locale === 'zh'
                ? '提交中...'
                : 'Submitting...'
              : locale === 'zh'
                ? '提交'
                : 'Submit'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rootComments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--muted)',
              font: '400 13px/1.5 var(--font-ui)',
            }}
          >
            {locale === 'zh' ? '暂无评论' : 'No comments yet'}
          </div>
        ) : (
          rootComments.map((comment) => (
            <div key={comment.id}>
              {/* Root comment */}
              <div
                style={{
                  padding: '12px',
                  background: comment.resolved ? 'var(--success-subtle)' : 'var(--panel)',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${comment.resolved ? 'var(--success)' : 'var(--line)'}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ font: '600 13px/1 var(--font-ui)', color: 'var(--text)' }}>
                      {comment.userName}
                    </span>
                    <span style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.resolved && (
                      <span
                        style={{
                          padding: '2px 6px',
                          background: 'var(--success)',
                          borderRadius: 'var(--radius-sm)',
                          font: '600 11px/1 var(--font-data)',
                          color: 'var(--on-buy)',
                        }}
                      >
                        {locale === 'zh' ? '已解决' : 'Resolved'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!comment.resolved && (
                      <button
                        type="button"
                        onClick={() => handleResolve(comment.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--muted)',
                          font: '400 11px/1 var(--font-ui)',
                          cursor: 'pointer',
                        }}
                      >
                        {locale === 'zh' ? '解决' : 'Resolve'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReplyTo(comment.id)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--muted)',
                        font: '400 11px/1 var(--font-ui)',
                        cursor: 'pointer',
                      }}
                    >
                      {locale === 'zh' ? '回复' : 'Reply'}
                    </button>
                  </div>
                </div>
                <p style={{ font: '400 13px/1.5 var(--font-ui)', color: 'var(--text)', margin: 0 }}>
                  {comment.content}
                </p>
              </div>

              {/* Replies */}
              {getReplies(comment.id).length > 0 && (
                <div
                  style={{
                    marginLeft: '24px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {getReplies(comment.id).map((reply) => (
                    <div
                      key={reply.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--panel)',
                        borderRadius: 'var(--radius)',
                        borderLeft: '3px solid var(--accent)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                        }}
                      >
                        <span style={{ font: '600 12px/1 var(--font-ui)', color: 'var(--text)' }}>
                          {reply.userName}
                        </span>
                        <span style={{ font: '400 11px/1 var(--font-ui)', color: 'var(--muted)' }}>
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p
                        style={{
                          font: '400 13px/1.5 var(--font-ui)',
                          color: 'var(--text)',
                          margin: 0,
                        }}
                      >
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
