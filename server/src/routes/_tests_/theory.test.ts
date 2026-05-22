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
    it('должен возвращать прогресс пользователя', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('должен возвращать прогресс по умолчанию если у пользователя нет прогресса', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completedArticles).toEqual([]);
      expect(response.body.data.totalPoints).toBe(0);
    });

    it('должен возвращать 401 если пользователь не авторизован', async () => {
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

    it('должен обрабатывать ошибку сервера', async () => {
      (TheoryProgressModel.getProgress as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/progress');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении прогресса');
    });
  });

  describe('PUT /api/theory/progress', () => {
    it('должен обновлять прогресс пользователя', async () => {
      (TheoryProgressModel.upsertProgress as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .put('/api/theory/progress')
        .send({ completedArticles: ['article-1'], quizScores: { 'article-1': 85 }, lastRead: new Date().toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('должен обрабатывать ошибку сервера', async () => {
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
    it('должен отмечать статью как пройденную', async () => {
      (TheoryProgressModel.completeArticle as jest.Mock).mockResolvedValue(mockProgress);

      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ articleId: 'article-1', quizScore: 85 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProgress);
    });

    it('должен возвращать 400 если articleId отсутствует', async () => {
      const response = await request(app)
        .post('/api/theory/progress/complete')
        .send({ quizScore: 85 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ID статьи обязателен');
    });

    it('должен отмечать статью как пройденную без quizScore', async () => {
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

    it('должен обрабатывать ошибку сервера', async () => {
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
    it('должен возвращать статистику прогресса', async () => {
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

    it('должен обрабатывать ошибку сервера', async () => {
      (TheoryProgressModel.getStatistics as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/statistics');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении статистики');
    });
  });

  describe('GET /api/theory/leaderboard', () => {
    it('должен возвращать таблицу лидеров', async () => {
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

    it('должен использовать лимит по умолчанию когда не указан', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/theory/leaderboard');

      expect(response.status).toBe(200);
      expect(TheoryProgressModel.getLeaderboard).toHaveBeenCalledWith(10);
    });

    it('должен использовать пользовательский лимит из запроса', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/theory/leaderboard?limit=5');

      expect(response.status).toBe(200);
      expect(TheoryProgressModel.getLeaderboard).toHaveBeenCalledWith(5);
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TheoryProgressModel.getLeaderboard as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/leaderboard');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при получении таблицы лидеров');
    });
  });

  describe('GET /api/theory/completed/:articleId', () => {
    it('должен возвращать true если статья пройдена', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockResolvedValue(true);
      (TheoryProgressModel.getArticleScore as jest.Mock).mockResolvedValue(85);

      const response = await request(app).get('/api/theory/completed/article-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(true);
      expect(response.body.data.score).toBe(85);
    });

    it('должен возвращать false если статья не пройдена', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockResolvedValue(false);
      (TheoryProgressModel.getArticleScore as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/theory/completed/article-999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(false);
      expect(response.body.data.score).toBeNull();
    });

    it('должен обрабатывать ошибку сервера', async () => {
      (TheoryProgressModel.isArticleCompleted as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/api/theory/completed/article-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Ошибка сервера при проверке статьи');
    });
  });
});