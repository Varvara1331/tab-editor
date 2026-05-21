import request from 'supertest';
import express from 'express';
import theoryRoutes from '../theory';
import { TheoryProgressModel } from '../../models/TheoryProgressModel';

jest.mock('../../models/TheoryProgressModel');
jest.mock('../../middleware/auth', () => ({
  protect: (req: any, _res: any, next: any) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/theory', theoryRoutes);

describe('Theory Routes', () => {
  const mockProgress = {
    userId: 1,
    completedArticles: ['article-1'],
    quizScores: { 'article-1': 85 },
    totalPoints: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/theory/progress', () => {
    it('should return user progress', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('should return default progress when user has no progress', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completedArticles).toEqual([]);
      expect(response.body.data.totalPoints).toBe(0);
    });

    it('should return 401 when user not authenticated', async () => {
      jest.resetModules();
      jest.doMock('../../middleware/auth', () => ({
        protect: (req: any, _res: any, next: any) => {
          req.user = undefined;
          next();
        },
      }));

      const { default: theoryRoutesReloaded } = await import('../theory');
      const newApp = express();
      newApp.use(express.json());
      newApp.use('/api/theory', theoryRoutesReloaded);

      const response = await request(newApp).get('/api/theory/progress');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении прогресса');
    });
  });

  describe('PUT /api/theory/progress', () => {
    it('should update user progress', async () => {
      (TheoryProgressModel.upsertProgress as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .put('/api/theory/progress')
        .send({ completedArticles: ['article-1'], quizScores: { 'article-1': 85 }, lastRead: new Date().toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.upsertProgress as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .put('/api/theory/progress')
        .send({ completedArticles: ['article-1'] });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при обновлении прогресса');
    });
  });

  describe('POST /api/theory/progress/complete', () => {
    it('should complete article', async () => {
      (TheoryProgressModel.completeArticle as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ articleId: 'article-1', quizScore: 85 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('should return 400 when articleId is missing', async () => {
      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ quizScore: 85 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ID статьи обязателен');
    });

    it('should complete article without quizScore', async () => {
      (TheoryProgressModel.completeArticle as jest.Mock).mockResolvedValue({
        ...mockProgress,
        quizScores: {},
      });

      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ articleId: 'article-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.completeArticle as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ articleId: 'article-1', quizScore: 85 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при завершении статьи');
    });
  });

  describe('GET /api/theory/statistics', () => {
    it('should return statistics', async () => {
      const mockStatistics = {
        totalArticlesCompleted: 1,
        totalPoints: 85,
        averageScore: 85,
        lastActive: null,
      };
      (TheoryProgressModel.getStatistics as jest.Mock).mockResolvedValue(mockStatistics);

      const response = await request(app).get('/api/theory/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStatistics);
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.getStatistics as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/statistics');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении статистики');
    });
  });

  describe('GET /api/theory/leaderboard', () => {
    it('should return leaderboard', async () => {
      const mockLeaderboard = [
        { userId: 1, username: 'user1', totalPoints: 100, articlesCompleted: 5 },
        { userId: 2, username: 'user2', totalPoints: 80, articlesCompleted: 4 },
      ];
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);

      const response = await request(app).get('/api/theory/leaderboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLeaderboard);
    });

    it('should use default limit when not provided', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/theory/leaderboard');

      expect(response.status).toBe(200);
      expect(TheoryProgressModel.getLeaderboard).toHaveBeenCalledWith(10);
    });

    it('should use custom limit from query', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/theory/leaderboard?limit=5');

      expect(response.status).toBe(200);
      expect(TheoryProgressModel.getLeaderboard).toHaveBeenCalledWith(5);
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/leaderboard');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении таблицы лидеров');
    });
  });

  describe('GET /api/theory/completed/:articleId', () => {
    it('should return true if article completed', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockResolvedValue(true);
      (TheoryProgressModel.getArticleScore as jest.Mock).mockResolvedValue(85);

      const response = await request(app).get('/api/theory/completed/article-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(true);
      expect(response.body.data.score).toBe(85);
    });

    it('should return false if article not completed', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockResolvedValue(false);
      (TheoryProgressModel.getArticleScore as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/theory/completed/article-999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(false);
      expect(response.body.data.score).toBeNull();
    });

    it('should handle server error', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/completed/article-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при проверке статьи');
    });
  });
});