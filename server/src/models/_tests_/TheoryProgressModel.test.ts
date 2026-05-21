import { TheoryProgressModel } from '../TheoryProgressModel';
import { TheoryProgressService } from '../../services/theoryProgressService';

jest.mock('../../services/theoryProgressService');

describe('TheoryProgressModel', () => {
  const mockProgress = {
    id: 1,
    userId: 1,
    completedArticles: ['article-1', 'article-2'],
    quizScores: { 'article-1': 85 },
    totalPoints: 85,
    lastRead: '2024-01-01',
    lastUpdated: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProgress', () => {
    it('should call TheoryProgressService.getProgress', async () => {
      (TheoryProgressService.getProgress as jest.Mock).mockResolvedValue(mockProgress);

      const result = await TheoryProgressModel.getProgress(1);

      expect(TheoryProgressService.getProgress).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProgress);
    });
  });

  describe('upsertProgress', () => {
    it('should call TheoryProgressService.upsertProgress', async () => {
      (TheoryProgressService.upsertProgress as jest.Mock).mockResolvedValue(mockProgress);

      const result = await TheoryProgressModel.upsertProgress(1, { totalPoints: 100 });

      expect(TheoryProgressService.upsertProgress).toHaveBeenCalledWith(1, { totalPoints: 100 });
      expect(result).toEqual(mockProgress);
    });
  });

  describe('completeArticle', () => {
    it('should call TheoryProgressService.completeArticle', async () => {
      (TheoryProgressService.completeArticle as jest.Mock).mockResolvedValue(mockProgress);

      const result = await TheoryProgressModel.completeArticle(1, 'article-3', 90);

      expect(TheoryProgressService.completeArticle).toHaveBeenCalledWith(1, 'article-3', 90);
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getStatistics', () => {
    it('should call TheoryProgressService.getStatistics', async () => {
      const mockStats = {
        totalArticlesCompleted: 2,
        totalPoints: 85,
        averageScore: 85,
        lastActive: '2024-01-01',
      };
      (TheoryProgressService.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      const result = await TheoryProgressModel.getStatistics(1);

      expect(TheoryProgressService.getStatistics).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getCompletedArticles', () => {
    it('should call TheoryProgressService.getCompletedArticles', async () => {
      (TheoryProgressService.getCompletedArticles as jest.Mock).mockResolvedValue(['article-1', 'article-2']);

      const result = await TheoryProgressModel.getCompletedArticles(1);

      expect(TheoryProgressService.getCompletedArticles).toHaveBeenCalledWith(1);
      expect(result).toEqual(['article-1', 'article-2']);
    });
  });

  describe('isArticleCompleted', () => {
    it('should call TheoryProgressService.isArticleCompleted', async () => {
      (TheoryProgressService.isArticleCompleted as jest.Mock).mockResolvedValue(true);

      const result = await TheoryProgressModel.isArticleCompleted(1, 'article-1');

      expect(TheoryProgressService.isArticleCompleted).toHaveBeenCalledWith(1, 'article-1');
      expect(result).toBe(true);
    });
  });

  describe('getTotalPoints', () => {
    it('should call TheoryProgressService.getTotalPoints', async () => {
      (TheoryProgressService.getTotalPoints as jest.Mock).mockResolvedValue(85);

      const result = await TheoryProgressModel.getTotalPoints(1);

      expect(TheoryProgressService.getTotalPoints).toHaveBeenCalledWith(1);
      expect(result).toBe(85);
    });
  });

  describe('getLeaderboard', () => {
    it('should call TheoryProgressService.getLeaderboard', async () => {
      const mockLeaderboard = [{ userId: 1, username: 'user1', totalPoints: 100, articlesCompleted: 5 }];
      (TheoryProgressService.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

      const result = await TheoryProgressModel.getLeaderboard(10);

      expect(TheoryProgressService.getLeaderboard).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockLeaderboard);
    });
  });

  describe('deleteProgress', () => {
    it('should call TheoryProgressService.deleteProgress', async () => {
      (TheoryProgressService.deleteProgress as jest.Mock).mockResolvedValue(undefined);

      await TheoryProgressModel.deleteProgress(1);

      expect(TheoryProgressService.deleteProgress).toHaveBeenCalledWith(1);
    });
  });
});