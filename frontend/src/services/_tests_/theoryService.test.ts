import { 
  getTheoryProgress, 
  updateTheoryProgress, 
  completeArticle, 
  getTheoryStatistics,
  syncTheoryProgress,
  clearTheoryProgress
} from '../theoryService';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

describe('theoryService', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getTheoryProgress', () => {
    it('должен возвращать прогресс из API при успешном запросе', async () => {
      const mockProgress = { completedArticles: ['1'], totalPoints: 100 };
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockProgress },
      });

      const result = await getTheoryProgress();
      expect(result).toEqual(mockProgress);
    });

    it('должен возвращать прогресс по умолчанию при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await getTheoryProgress();
      expect(result.completedArticles).toEqual([]);
    });
  });

  describe('completeArticle', () => {
    it('должен отмечать статью как пройденную', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true, data: { completedArticles: ['1'] } },
      });

      const result = await completeArticle('1', 100);
      expect(result.completedArticles).toContain('1');
    });

    it('должен выбрасывать ошибку при неудачном завершении статьи', async () => {
      mockApi.post.mockRejectedValue(new Error('API Error'));
      await expect(completeArticle('1')).rejects.toThrow();
    });
  });

  describe('getTheoryStatistics', () => {
    it('должен возвращать статистику по теории', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { totalPoints: 100 } },
      });

      const result = await getTheoryStatistics();
      expect(result.totalPoints).toBe(100);
    });
  });

  describe('clearTheoryProgress', () => {
    it('должен очищать прогресс теории', async () => {
      mockApi.put.mockResolvedValue({
        data: { success: true, data: { completedArticles: [] } },
      });

      await clearTheoryProgress();
      expect(localStorage.getItem('guitar_tab_theory_progress')).toBeNull();
    });
  });

  describe('updateTheoryProgress', () => {
    it('должен успешно обновлять прогресс теории', async () => {
      const mockProgress = { completedArticles: ['1'], totalPoints: 100 };
      mockApi.put.mockResolvedValue({
        data: { success: true, data: mockProgress },
      });

      const result = await updateTheoryProgress({ completedArticles: ['1'] });
      expect(result).toEqual(mockProgress);
    });

    it('должен выбрасывать ошибку при неудачном обновлении прогресса', async () => {
      mockApi.put.mockResolvedValue({
        data: { success: false, error: 'Server error' },
      });

      await expect(updateTheoryProgress({})).rejects.toThrow('Server error');
    });

    it('должен сохранять прогресс в localStorage при ошибке API', async () => {
      const savedProgress = { completedArticles: ['old'], totalPoints: 50 };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(savedProgress));
      
      mockApi.put.mockRejectedValue(new Error('Network error'));

      const result = await updateTheoryProgress({ completedArticles: ['new'] });
      expect(result.completedArticles).toContain('new');
    });
  });

  describe('completeArticle - расширенное покрытие', () => {
    it('должен отмечать статью с результатом викторины', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true, data: { completedArticles: ['1'], quizScores: { '1': 95 } } },
      });

      const result = await completeArticle('1', 95);
      expect(result.quizScores?.['1']).toBe(95);
    });

    it('должен обрабатывать ошибку API и сохранять локально', async () => {
      const savedProgress = { 
        completedArticles: [], 
        quizScores: {}, 
        totalPoints: 0 
      };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(savedProgress));
      
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const result = await completeArticle('1', 80);
      expect(result.completedArticles).toContain('1');
      expect(result.totalPoints).toBe(80);
    });

    it('не должен дублировать пройденную статью', async () => {
      const savedProgress = { 
        completedArticles: ['1'], 
        quizScores: { '1': 90 }, 
        totalPoints: 90 
      };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(savedProgress));
      
      mockApi.post.mockRejectedValue(new Error('Network error'));

      const result = await completeArticle('1', 95);
      expect(result.completedArticles).toHaveLength(1);
      expect(result.quizScores['1']).toBe(90);
    });
  });

  describe('getTheoryStatistics - расширенное покрытие', () => {
    it('должен вычислять статистику из localStorage при ошибке API', async () => {
      const savedProgress = { 
        completedArticles: ['1', '2'], 
        quizScores: { '1': 90, '2': 80 }, 
        totalPoints: 170,
        lastRead: '2024-01-01'
      };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(savedProgress));
      
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const result = await getTheoryStatistics();
      expect(result.totalArticlesCompleted).toBe(2);
      expect(result.totalPoints).toBe(170);
      expect(result.averageScore).toBe(85);
      expect(result.lastActive).toBe('2024-01-01');
    });

    it('должен возвращать статистику по умолчанию при отсутствии данных', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      localStorage.removeItem('guitar_tab_theory_progress');

      const result = await getTheoryStatistics();
      expect(result.totalArticlesCompleted).toBe(0);
      expect(result.totalPoints).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.lastActive).toBeNull();
    });
  });

  describe('syncTheoryProgress', () => {
    it('должен синхронизировать локальный прогресс с сервером', async () => {
      const localProgress = { completedArticles: ['1'], totalPoints: 100 };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(localProgress));
      
      mockApi.put.mockResolvedValue({
        data: { success: true, data: localProgress },
      });

      await syncTheoryProgress();
      expect(mockApi.put).toHaveBeenCalled();
    });

    it('должен корректно обрабатывать ошибку синхронизации', async () => {
      const localProgress = { completedArticles: ['1'] };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(localProgress));
      
      mockApi.put.mockRejectedValue(new Error('Sync failed'));

      await expect(syncTheoryProgress()).resolves.not.toThrow();
    });

    it('не должен синхронизировать при отсутствии локального прогресса', async () => {
      localStorage.removeItem('guitar_tab_theory_progress');
      await syncTheoryProgress();
      expect(mockApi.put).not.toHaveBeenCalled();
    });
  });

  describe('clearTheoryProgress - расширенное покрытие', () => {
    it('должен очищать прогресс даже при ошибке API', async () => {
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify({ completedArticles: ['1'] }));
      
      mockApi.put.mockRejectedValue(new Error('Network error'));

      await clearTheoryProgress();
      expect(localStorage.getItem('guitar_tab_theory_progress')).toBeNull();
    });
  });
});