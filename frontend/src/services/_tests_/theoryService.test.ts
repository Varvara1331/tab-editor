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
    it('should return progress from API', async () => {
      const mockProgress = { completedArticles: ['1'], totalPoints: 100 };
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockProgress },
      });

      const result = await getTheoryProgress();
      expect(result).toEqual(mockProgress);
    });

    it('should return default progress on error', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await getTheoryProgress();
      expect(result.completedArticles).toEqual([]);
    });
  });

  describe('completeArticle', () => {
    it('should complete article', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true, data: { completedArticles: ['1'] } },
      });

      const result = await completeArticle('1', 100);
      expect(result.completedArticles).toContain('1');
    });

    it('should throw error on failure', async () => {
      mockApi.post.mockRejectedValue(new Error('API Error'));
      await expect(completeArticle('1')).rejects.toThrow();
    });
  });

  describe('getTheoryStatistics', () => {
    it('should return statistics', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { totalPoints: 100 } },
      });

      const result = await getTheoryStatistics();
      expect(result.totalPoints).toBe(100);
    });
  });

  describe('clearTheoryProgress', () => {
    it('should clear progress', async () => {
      mockApi.put.mockResolvedValue({
        data: { success: true, data: { completedArticles: [] } },
      });

      await clearTheoryProgress();
      expect(localStorage.getItem('guitar_tab_theory_progress')).toBeNull();
    });
  });

describe('theoryService - улучшенное покрытие', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('updateTheoryProgress', () => {
    it('should update progress successfully', async () => {
      const mockProgress = { completedArticles: ['1'], totalPoints: 100 };
      mockApi.put.mockResolvedValue({
        data: { success: true, data: mockProgress },
      });

      const result = await updateTheoryProgress({ completedArticles: ['1'] });
      expect(result).toEqual(mockProgress);
    });

    it('should throw error when API fails', async () => {
      mockApi.put.mockResolvedValue({
        data: { success: false, error: 'Server error' },
      });

      await expect(updateTheoryProgress({})).rejects.toThrow('Server error');
    });

    it('should save to localStorage on API error', async () => {
      const savedProgress = { completedArticles: ['old'], totalPoints: 50 };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(savedProgress));
      
      mockApi.put.mockRejectedValue(new Error('Network error'));

      const result = await updateTheoryProgress({ completedArticles: ['new'] });
      expect(result.completedArticles).toContain('new');
    });
  });

  describe('completeArticle - улучшенное покрытие', () => {
    it('should complete article with quiz score', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true, data: { completedArticles: ['1'], quizScores: { '1': 95 } } },
      });

      const result = await completeArticle('1', 95);
      expect(result.quizScores?.['1']).toBe(95);
    });

    it('should handle API error and save locally', async () => {
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

    it('should not duplicate article completion', async () => {
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

  describe('getTheoryStatistics - улучшенное покрытие', () => {
    it('should calculate statistics from localStorage when API fails', async () => {
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

    it('should return default statistics when no data', async () => {
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
    it('should sync local progress with server', async () => {
      const localProgress = { completedArticles: ['1'], totalPoints: 100 };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(localProgress));
      
      mockApi.put.mockResolvedValue({
        data: { success: true, data: localProgress },
      });

      await syncTheoryProgress();
      expect(mockApi.put).toHaveBeenCalled();
    });

    it('should handle sync error gracefully', async () => {
      const localProgress = { completedArticles: ['1'] };
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify(localProgress));
      
      mockApi.put.mockRejectedValue(new Error('Sync failed'));

      await expect(syncTheoryProgress()).resolves.not.toThrow();
    });

    it('should not sync if no local progress', async () => {
      localStorage.removeItem('guitar_tab_theory_progress');
      await syncTheoryProgress();
      expect(mockApi.put).not.toHaveBeenCalled();
    });
  });

  describe('clearTheoryProgress', () => {
    it('should clear progress even if API fails', async () => {
      localStorage.setItem('guitar_tab_theory_progress', JSON.stringify({ completedArticles: ['1'] }));
      
      mockApi.put.mockRejectedValue(new Error('Network error'));

      await clearTheoryProgress();
      expect(localStorage.getItem('guitar_tab_theory_progress')).toBeNull();
    });
  });
});
});