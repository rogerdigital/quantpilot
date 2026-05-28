import { randomUUID } from 'node:crypto';
import { trimAndSave } from '../shared.js';

const SHARES_FILE = 'strategy-shares.json';
const COMMENTS_FILE = 'strategy-comments.json';
const ACTIVITY_FILE = 'strategy-activity.json';

const PERMISSION_LEVELS = ['view', 'comment', 'edit'];

function createShareEntry(share: any) {
  return {
    id: share.id || `share-${randomUUID()}`,
    strategyId: share.strategyId,
    userId: share.userId,
    userName: share.userName || 'Anonymous',
    permission: share.permission || 'view',
    sharedBy: share.sharedBy || 'unknown',
    sharedAt: share.sharedAt || new Date().toISOString(),
    metadata: share.metadata || {},
  };
}

function createCommentEntry(comment: any) {
  return {
    id: comment.id || `comment-${randomUUID()}`,
    strategyId: comment.strategyId,
    userId: comment.userId,
    userName: comment.userName || 'Anonymous',
    content: comment.content || '',
    parentId: comment.parentId || null,
    resolved: comment.resolved || false,
    createdAt: comment.createdAt || new Date().toISOString(),
    updatedAt: comment.updatedAt || comment.createdAt || new Date().toISOString(),
    metadata: comment.metadata || {},
  };
}

function createActivityEntry(activity: any) {
  return {
    id: activity.id || `activity-${randomUUID()}`,
    strategyId: activity.strategyId,
    userId: activity.userId,
    userName: activity.userName || 'Anonymous',
    action: activity.action || 'unknown',
    details: activity.details || {},
    createdAt: activity.createdAt || new Date().toISOString(),
  };
}

export function createCollaborationRepository(store: any) {
  function getAllShares() {
    return store.readCollection(SHARES_FILE);
  }

  function getAllComments() {
    return store.readCollection(COMMENTS_FILE);
  }

  function getAllActivity() {
    return store.readCollection(ACTIVITY_FILE);
  }

  return {
    // Share management
    shareStrategy(strategyId: any, userId: any, userName: any, permission: any, sharedBy: any) {
      if (!PERMISSION_LEVELS.includes(permission)) {
        throw new Error(`Invalid permission level: ${permission}`);
      }

      const shares = getAllShares();
      const existing = shares.find((s: any) => s.strategyId === strategyId && s.userId === userId);

      if (existing) {
        // Update existing share
        const idx = shares.findIndex((s: any) => s.id === existing.id);
        shares[idx] = { ...existing, permission, sharedAt: new Date().toISOString() };
        trimAndSave(store, SHARES_FILE, shares, 500);
        return shares[idx];
      }

      const share = createShareEntry({ strategyId, userId, userName, permission, sharedBy });
      shares.unshift(share);
      trimAndSave(store, SHARES_FILE, shares, 500);

      // Record activity
      this.recordActivity(strategyId, sharedBy, 'share', { userId, permission });

      return share;
    },

    revokeShare(strategyId: any, userId: any) {
      const shares = getAllShares().filter(
        (s: any) => !(s.strategyId === strategyId && s.userId === userId)
      );
      store.writeCollection(SHARES_FILE, shares);
    },

    getShares(strategyId: any) {
      return getAllShares().filter((s: any) => s.strategyId === strategyId);
    },

    getUserPermission(strategyId: any, userId: any) {
      const share = getAllShares().find(
        (s: any) => s.strategyId === strategyId && s.userId === userId
      );
      return share ? share.permission : null;
    },

    // Comments
    addComment(strategyId: any, userId: any, userName: any, content: any, parentId = null) {
      if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      const comments = getAllComments();
      const comment = createCommentEntry({
        strategyId,
        userId,
        userName,
        content: content.trim(),
        parentId,
      });

      comments.unshift(comment);
      trimAndSave(store, COMMENTS_FILE, comments, 2000);

      // Record activity
      this.recordActivity(strategyId, userId, 'comment', { commentId: comment.id });

      return comment;
    },

    updateComment(commentId: any, userId: any, content: any) {
      const comments = getAllComments();
      const idx = comments.findIndex((c: any) => c.id === commentId);

      if (idx === -1) {
        throw new Error('Comment not found');
      }

      if (comments[idx].userId !== userId) {
        throw new Error('Not authorized to edit this comment');
      }

      comments[idx] = {
        ...comments[idx],
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      };
      trimAndSave(store, COMMENTS_FILE, comments, 2000);

      return comments[idx];
    },

    resolveComment(commentId: any, userId: any) {
      const comments = getAllComments();
      const idx = comments.findIndex((c: any) => c.id === commentId);

      if (idx === -1) {
        throw new Error('Comment not found');
      }

      comments[idx] = {
        ...comments[idx],
        resolved: true,
        updatedAt: new Date().toISOString(),
      };
      trimAndSave(store, COMMENTS_FILE, comments, 2000);

      // Record activity
      this.recordActivity(comments[idx].strategyId, userId, 'resolve_comment', { commentId });

      return comments[idx];
    },

    getComments(strategyId: any, limit = 50) {
      return getAllComments()
        .filter((c: any) => c.strategyId === strategyId)
        .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit);
    },

    getThread(commentId: any) {
      const comments = getAllComments();
      const parent = comments.find((c: any) => c.id === commentId);
      if (!parent) return [];

      const replies = comments
        .filter((c: any) => c.parentId === commentId)
        .sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt));

      return [parent, ...replies];
    },

    // Activity log
    recordActivity(strategyId: any, userId: any, action: any, details: any = {}) {
      const activity = getAllActivity();
      const entry = createActivityEntry({
        strategyId,
        userId,
        userName: details.userName || 'Unknown',
        action,
        details,
      });

      activity.unshift(entry);
      trimAndSave(store, ACTIVITY_FILE, activity, 1000);

      return entry;
    },

    getActivity(strategyId: any, limit = 50, filters: any = {}) {
      let activity = getAllActivity().filter((a: any) => a.strategyId === strategyId);

      // Apply filters
      if (filters.userId) {
        activity = activity.filter((a: any) => a.userId === filters.userId);
      }
      if (filters.action) {
        activity = activity.filter((a: any) => a.action === filters.action);
      }
      if (filters.since) {
        const sinceMs = new Date(filters.since).getTime();
        activity = activity.filter((a: any) => new Date(a.createdAt).getTime() >= sinceMs);
      }

      return activity
        .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, limit);
    },
  };
}
