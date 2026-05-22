import { TheoryProgressService } from '../theoryProgressService';
import { db } from '../../database';

jest.mock('../../database');

describe('TheoryProgressService', () => {
  const mockProgressRow = {
    CompletedArticles: '["article-1"]',
    LastRead: '2024-01-01T00:00:00.000Z',
    QuizScores: '{"article-1":85}',
    TotalPoints: 85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProgress', () => {
    it('должен возвращать прогресс если найден', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getProgress(1);

      expect(result).not.toBeNull();
      expect(result?.completedArticles).toContain('article-1');
      expect(result?.totalPoints).toBe(85);
    });

    it('должен возвращать null если прогресс не найден', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.getProgress(999);

      expect(result).toBeNull();
    });
  });

  describe('upsertProgress', () => {
    it('должен обновлять существующий прогресс', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TheoryProgressService.upsertProgress(1, {
        completedArticles: ['article-1', 'article-2'],
      });

      expect(result.completedArticles).toContain('article-2');
    });

    it('должен создавать новый прогресс если его нет', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });

      const result = await TheoryProgressService.upsertProgress(1, {
        completedArticles: ['article-1'],
        quizScores: { 'article-1': 85 },
      });

      expect(result.completedArticles).toContain('article-1');
      expect(result.totalPoints).toBe(85);
    });

    it('должен обновлять баллы викторин и пересчитывать общее количество очков', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TheoryProgressService.upsertProgress(1, {
        quizScores: { 'article-1': 90, 'article-2': 80 },
      });

      expect(result.quizScores['article-1']).toBe(90);
      expect(result.quizScores['article-2']).toBe(80);
      expect(result.totalPoints).toBe(170);
    });

    it('должен обновлять временную метку последнего чтения', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });
      const newLastRead = '2024-02-01T00:00:00.000Z';

      const result = await TheoryProgressService.upsertProgress(1, {
        lastRead: newLastRead,
      });

      expect(result.lastRead).toBe(newLastRead);
    });
  });

  describe('completeArticle', () => {
    it('должен отмечать статью как пройденную с баллом за викторину', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });

      const result = await TheoryProgressService.completeArticle(1, 'article-1', 85);

      expect(result.completedArticles).toContain('article-1');
      expect(result.quizScores['article-1']).toBe(85);
      expect(result.totalPoints).toBe(85);
    });

    it('должен отмечать статью как пройденную без балла за викторину', async () => {
      (db.get as jest.Mock).mockResolvedValue({ ...mockProgressRow, QuizScores: '{}', TotalPoints: 0 });
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TheoryProgressService.completeArticle(1, 'article-1');

      expect(result.completedArticles).toContain('article-1');
      expect(result.quizScores['article-1']).toBeUndefined();
    });

    it('не должен дублировать статью в списке пройденных', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TheoryProgressService.completeArticle(1, 'article-1', 90);

      expect(result.completedArticles).toHaveLength(1);
    });

    it('должен добавлять новый балл викторины к существующим', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TheoryProgressService.completeArticle(1, 'article-2', 75);

      expect(result.quizScores['article-1']).toBe(85);
      expect(result.quizScores['article-2']).toBe(75);
      expect(result.totalPoints).toBe(160);
    });
  });

  describe('getStatistics', () => {
    it('должен возвращать статистику для пользователя с прогрессом', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getStatistics(1);

      expect(result.totalArticlesCompleted).toBe(1);
      expect(result.totalPoints).toBe(85);
      expect(result.averageScore).toBe(85);
      expect(result.lastActive).toBe('2024-01-01T00:00:00.000Z');
    });

    it('должен возвращать нулевую статистику для пользователя без прогресса', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.getStatistics(999);

      expect(result.totalArticlesCompleted).toBe(0);
      expect(result.totalPoints).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.lastActive).toBeNull();
    });

    it('должен корректно вычислять средний балл для нескольких викторин', async () => {
      const multiScoreRow = {
        ...mockProgressRow,
        QuizScores: '{"article-1":85,"article-2":95,"article-3":75}',
        TotalPoints: 255,
      };
      (db.get as jest.Mock).mockResolvedValue(multiScoreRow);

      const result = await TheoryProgressService.getStatistics(1);

      expect(result.averageScore).toBe(85);
    });
  });

  describe('getCompletedArticles', () => {
    it('должен возвращать список пройденных статей', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getCompletedArticles(1);

      expect(result).toEqual(['article-1']);
    });

    it('должен возвращать пустой массив для пользователя без прогресса', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.getCompletedArticles(999);

      expect(result).toEqual([]);
    });
  });

  describe('isArticleCompleted', () => {
    it('должен возвращать true если статья пройдена', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.isArticleCompleted(1, 'article-1');

      expect(result).toBe(true);
    });

    it('должен возвращать false если статья не пройдена', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.isArticleCompleted(1, 'article-999');

      expect(result).toBe(false);
    });

    it('должен возвращать false для пользователя без прогресса', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.isArticleCompleted(999, 'article-1');

      expect(result).toBe(false);
    });
  });

  describe('getTotalPoints', () => {
    it('должен возвращать общее количество очков', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getTotalPoints(1);

      expect(result).toBe(85);
    });

    it('должен возвращать 0 для пользователя без прогресса', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.getTotalPoints(999);

      expect(result).toBe(0);
    });
  });

  describe('getArticleScore', () => {
    it('должен возвращать балл за пройденную статью', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getArticleScore(1, 'article-1');

      expect(result).toBe(85);
    });

    it('должен возвращать null для непройденной статьи', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockProgressRow);

      const result = await TheoryProgressService.getArticleScore(1, 'article-999');

      expect(result).toBeNull();
    });

    it('должен возвращать null для пользователя без прогресса', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TheoryProgressService.getArticleScore(999, 'article-1');

      expect(result).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('должен возвращать таблицу лидеров', async () => {
      const mockLeaderboard = [
        { UserId: 1, Username: 'user1', TotalPoints: 100, ArticlesCount: 5 },
        { UserId: 2, Username: 'user2', TotalPoints: 80, ArticlesCount: 4 },
      ];
      (db.all as jest.Mock).mockResolvedValue(mockLeaderboard);

      const result = await TheoryProgressService.getLeaderboard(10);

      expect(result).toHaveLength(2);
      expect(result[0].totalPoints).toBe(100);
      expect(result[1].username).toBe('user2');
    });

    it('должен использовать лимит по умолчанию 10', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      await TheoryProgressService.getLeaderboard();

      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        [10]
      );
    });

    it('должен возвращать пустой массив при отсутствии данных для таблицы лидеров', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await TheoryProgressService.getLeaderboard(5);

      expect(result).toEqual([]);
    });
  });

  describe('deleteProgress', () => {
    it('должен удалять прогресс пользователя', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      await TheoryProgressService.deleteProgress(1);

      expect(db.run).toHaveBeenCalledWith(
        'DELETE FROM TheoryProgress WHERE UserId = ?',
        [1]
      );
    });
  });
});