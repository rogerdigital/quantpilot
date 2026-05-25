// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { trimAndSave } from '../shared.js';

const STRATEGIES_FILE = 'marketplace-strategies.json';
const REVIEWS_FILE = 'marketplace-reviews.json';
const FORKS_FILE = 'marketplace-forks.json';

function createMarketplaceEntry(strategy) {
  return {
    id: strategy.id || `marketplace-${randomUUID()}`,
    strategyId: strategy.strategyId,
    authorId: strategy.authorId || 'unknown',
    authorName: strategy.authorName || 'Anonymous',
    name: strategy.name || 'Untitled Strategy',
    description: strategy.description || '',
    visibility: strategy.visibility || 'public',
    category: strategy.category || 'other',
    tags: strategy.tags || [],
    metrics: strategy.metrics || {},
    rating: strategy.rating || 0,
    ratingCount: strategy.ratingCount || 0,
    forkCount: strategy.forkCount || 0,
    publishedAt: strategy.publishedAt || new Date().toISOString(),
    updatedAt: strategy.updatedAt || new Date().toISOString(),
    metadata: strategy.metadata || {},
  };
}

function createReviewEntry(review) {
  return {
    id: review.id || `review-${randomUUID()}`,
    marketplaceId: review.marketplaceId,
    userId: review.userId,
    userName: review.userName || 'Anonymous',
    rating: Number(review.rating || 0),
    comment: review.comment || '',
    createdAt: review.createdAt || new Date().toISOString(),
    updatedAt: review.updatedAt || review.createdAt || new Date().toISOString(),
  };
}

function createForkEntry(fork) {
  return {
    id: fork.id || `fork-${randomUUID()}`,
    marketplaceId: fork.marketplaceId,
    strategyId: fork.strategyId,
    userId: fork.userId,
    userName: fork.userName || 'Anonymous',
    forkedAt: fork.forkedAt || new Date().toISOString(),
  };
}

export function createStrategyMarketplaceRepository(store) {
  function getAllStrategies() {
    return store.readCollection(STRATEGIES_FILE);
  }

  function getAllReviews() {
    return store.readCollection(REVIEWS_FILE);
  }

  function getAllForks() {
    return store.readCollection(FORKS_FILE);
  }

  return {
    publishStrategy(strategyData) {
      const strategies = getAllStrategies();
      const existing = strategies.find((s) => s.strategyId === strategyData.strategyId);

      if (existing) {
        // Update existing entry
        const updated = {
          ...existing,
          ...strategyData,
          id: existing.id,
          publishedAt: existing.publishedAt,
          updatedAt: new Date().toISOString(),
        };
        const idx = strategies.findIndex((s) => s.id === existing.id);
        strategies[idx] = updated;
        trimAndSave(store, STRATEGIES_FILE, strategies, 500);
        return updated;
      }

      const entry = createMarketplaceEntry(strategyData);
      strategies.unshift(entry);
      trimAndSave(store, STRATEGIES_FILE, strategies, 500);
      return entry;
    },

    unpublishStrategy(strategyId) {
      const strategies = getAllStrategies().filter((s) => s.strategyId !== strategyId);
      store.writeCollection(STRATEGIES_FILE, strategies);
    },

    searchStrategies(query, filters = {}) {
      let results = getAllStrategies().filter((s) => s.visibility === 'public');

      // Text search
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        results = results.filter((s) => s.category === filters.category);
      }

      // Rating filter
      if (filters.minRating) {
        results = results.filter((s) => s.rating >= filters.minRating);
      }

      // Sort
      const sortBy = filters.sortBy || 'popular';
      switch (sortBy) {
        case 'newest':
          results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          break;
        case 'topRated':
          results.sort((a, b) => b.rating - a.rating);
          break;
        case 'bestPerforming':
          results.sort((a, b) => (b.metrics.sharpe || 0) - (a.metrics.sharpe || 0));
          break;
        default:
          results.sort((a, b) => b.forkCount - a.forkCount);
          break;
      }

      return results;
    },

    getStrategy(marketplaceId) {
      return getAllStrategies().find((s) => s.id === marketplaceId) || null;
    },

    forkStrategy(marketplaceId, userId, userName) {
      const strategies = getAllStrategies();
      const strategy = strategies.find((s) => s.id === marketplaceId);
      if (!strategy) return null;

      // Record the fork
      const forks = getAllForks();
      const forkEntry = createForkEntry({
        marketplaceId,
        strategyId: strategy.strategyId,
        userId,
        userName,
      });
      forks.unshift(forkEntry);
      trimAndSave(store, FORKS_FILE, forks, 1000);

      // Increment fork count
      const idx = strategies.findIndex((s) => s.id === marketplaceId);
      strategies[idx] = { ...strategy, forkCount: strategy.forkCount + 1 };
      trimAndSave(store, STRATEGIES_FILE, strategies, 500);

      return { fork: forkEntry, strategy };
    },

    rateStrategy(marketplaceId, userId, rating) {
      const strategies = getAllStrategies();
      const strategy = strategies.find((s) => s.id === marketplaceId);
      if (!strategy) return null;

      const reviews = getAllReviews();
      const existingReview = reviews.find(
        (r) => r.marketplaceId === marketplaceId && r.userId === userId
      );

      if (existingReview) {
        // Update existing rating
        const idx = reviews.findIndex((r) => r.id === existingReview.id);
        reviews[idx] = { ...existingReview, rating, updatedAt: new Date().toISOString() };
      } else {
        // New rating
        const review = createReviewEntry({ marketplaceId, userId, rating });
        reviews.unshift(review);
      }
      trimAndSave(store, REVIEWS_FILE, reviews, 2000);

      // Recalculate average rating
      const allRatings = reviews
        .filter((r) => r.marketplaceId === marketplaceId)
        .map((r) => r.rating);
      const avgRating =
        allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;

      const stratIdx = strategies.findIndex((s) => s.id === marketplaceId);
      strategies[stratIdx] = {
        ...strategy,
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: allRatings.length,
      };
      trimAndSave(store, STRATEGIES_FILE, strategies, 500);

      return strategies[stratIdx];
    },

    reviewStrategy(marketplaceId, userId, userName, comment, rating) {
      const reviews = getAllReviews();
      const existing = reviews.find(
        (r) => r.marketplaceId === marketplaceId && r.userId === userId
      );

      let review;
      if (existing) {
        const idx = reviews.findIndex((r) => r.id === existing.id);
        review = {
          ...existing,
          comment,
          rating: rating || existing.rating,
          updatedAt: new Date().toISOString(),
        };
        reviews[idx] = review;
      } else {
        review = createReviewEntry({ marketplaceId, userId, userName, comment, rating });
        reviews.unshift(review);
      }
      trimAndSave(store, REVIEWS_FILE, reviews, 2000);

      // Update rating if provided
      if (rating) {
        this.rateStrategy(marketplaceId, userId, rating);
      }

      return review;
    },

    getReviews(marketplaceId, limit = 20) {
      return getAllReviews()
        .filter((r) => r.marketplaceId === marketplaceId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    },

    getForkCount(marketplaceId) {
      return getAllForks().filter((f) => f.marketplaceId === marketplaceId).length;
    },
  };
}
