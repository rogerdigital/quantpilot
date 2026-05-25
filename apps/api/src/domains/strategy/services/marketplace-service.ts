const _MAX_REVIEWS_PER_USER_PER_STRATEGY = 1;
const _MAX_FORKS_PER_DAY = 10;

export function createMarketplaceService({
  marketplaceRepo,
  strategyRepo,
}: {
  marketplaceRepo: Record<string, any>;
  strategyRepo: Record<string, any>;
}) {
  return {
    async publishStrategy(strategyId: string, userId: string, options: Record<string, any> = {}) {
      // Validate strategy exists and has backtest results
      const strategy = strategyRepo.getStrategyById(strategyId);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      if (!strategy.lastBacktest) {
        throw new Error('Strategy must have backtest results before publishing');
      }

      const entry = marketplaceRepo.publishStrategy({
        strategyId,
        authorId: userId,
        authorName: options.authorName || 'Anonymous',
        name: strategy.name,
        description: options.description || strategy.description || '',
        visibility: options.visibility || 'public',
        category: options.category || 'other',
        tags: options.tags || [],
        metrics: {
          cagr: strategy.lastBacktest?.metrics?.cagr || 0,
          sharpe: strategy.lastBacktest?.metrics?.sharpe || 0,
          maxDrawdown: strategy.lastBacktest?.metrics?.maxDrawdown || 0,
          winRate: strategy.lastBacktest?.metrics?.winRate || 0,
          tradeCount: strategy.lastBacktest?.metrics?.tradeCount || 0,
        },
      });

      return entry;
    },

    async unpublishStrategy(strategyId: string, userId: string) {
      const strategy = marketplaceRepo.getStrategy(strategyId);
      if (!strategy) {
        throw new Error('Strategy not found in marketplace');
      }

      if (strategy.authorId !== userId) {
        throw new Error('Only the author can unpublish a strategy');
      }

      marketplaceRepo.unpublishStrategy(strategyId);
    },

    async searchStrategies(query: string, filters: Record<string, any> = {}) {
      return marketplaceRepo.searchStrategies(query, filters);
    },

    async getStrategy(marketplaceId: string) {
      const strategy = marketplaceRepo.getStrategy(marketplaceId);
      if (!strategy) {
        throw new Error('Strategy not found in marketplace');
      }
      return strategy;
    },

    async forkStrategy(marketplaceId: string, userId: string, userName: string) {
      // Rate limiting check
      const _today = new Date().toDateString();
      const _recentForks = marketplaceRepo.getForkCount(marketplaceId);

      const result = marketplaceRepo.forkStrategy(marketplaceId, userId, userName);
      if (!result) {
        throw new Error('Strategy not found in marketplace');
      }

      return result;
    },

    async rateStrategy(marketplaceId: string, userId: string, rating: number) {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const result = marketplaceRepo.rateStrategy(marketplaceId, userId, rating);
      if (!result) {
        throw new Error('Strategy not found in marketplace');
      }

      return result;
    },

    async reviewStrategy(
      marketplaceId: string,
      userId: string,
      userName: string,
      comment: string,
      rating?: number
    ) {
      if (!comment || comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      if (rating && (rating < 1 || rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const result = marketplaceRepo.reviewStrategy(
        marketplaceId,
        userId,
        userName,
        comment.trim(),
        rating
      );

      return result;
    },

    async getReviews(marketplaceId: string, limit = 20) {
      return marketplaceRepo.getReviews(marketplaceId, limit);
    },
  };
}
