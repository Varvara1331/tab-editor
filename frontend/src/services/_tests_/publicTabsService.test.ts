import { publicTabsService } from '../publicTabsService';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('publicTabsService', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTabs', () => {
    it('should return public tabs', async () => {
      const mockTabs = [{ id: 1, title: 'Public Tab 1' }];
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockTabs },
      });

      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual(mockTabs);
    });

    it('should return empty array on error', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual([]);
    });

    it('should pass search params', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs({ search: 'rock', limit: 20, offset: 0 });
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 20, offset: 0, search: 'rock' },
      });
    });
  });

  describe('addToLibrary', () => {
    it('should add tab to library', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true },
      });

      const result = await publicTabsService.addToLibrary(1);
      expect(result).toBe(true);
      expect(mockApi.post).toHaveBeenCalledWith('/public-tabs/1/library');
    });

    it('should return true if already in library', async () => {
      mockApi.post.mockRejectedValue({
        response: { data: { error: 'Табулатура уже добавлена в библиотеку' } },
      });

      const result = await publicTabsService.addToLibrary(1);
      expect(result).toBe(true);
    });

    it('should return false for invalid id', async () => {
      const result = await publicTabsService.addToLibrary(0);
      expect(result).toBe(false);
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  describe('removeFromLibrary', () => {
    it('should remove tab from library', async () => {
      mockApi.delete.mockResolvedValue({
        data: { success: true },
      });

      const result = await publicTabsService.removeFromLibrary(1);
      expect(result).toBe(true);
    });

    it('should return false for invalid id', async () => {
      const result = await publicTabsService.removeFromLibrary(0);
      expect(result).toBe(false);
    });
  });

  describe('checkInLibrary', () => {
    it('should return true if tab in library', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { exists: true } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(true);
    });

    it('should return false if tab not in library', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { exists: false } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });
  });
describe('publicTabsService - улучшенное покрытие', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicTabs - улучшенное покрытие', () => {
    it('should handle empty search query', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs({ search: '', limit: 10, offset: 0 });
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 10, offset: 0 },
      });
    });

    it('should trim search query', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs({ search: '  rock  ', limit: 10, offset: 0 });
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 10, offset: 0, search: 'rock' },
      });
    });

    it('should use default values when params not provided', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs();
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 50, offset: 0 },
      });
    });

    it('should return empty array when response has no data', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: null },
      });

      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual([]);
    });
  });

  describe('addToLibrary - улучшенное покрытие', () => {
    it('should handle invalid tabId', async () => {
      const result = await publicTabsService.addToLibrary(-1);
      expect(result).toBe(false);
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('should handle string tabId', async () => {
      const result = await publicTabsService.addToLibrary(NaN);
      expect(result).toBe(false);
    });
  });

  describe('removeFromLibrary - улучшенное покрытие', () => {
    it('should handle API error', async () => {
      mockApi.delete.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.removeFromLibrary(1);
      expect(result).toBe(false);
    });

    it('should handle invalid tabId', async () => {
      const result = await publicTabsService.removeFromLibrary(0);
      expect(result).toBe(false);
      expect(mockApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkInLibrary - улучшенное покрытие', () => {
    it('should handle API error', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });

    it('should handle invalid tabId', async () => {
      const result = await publicTabsService.checkInLibrary(-5);
      expect(result).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('should handle response without exists flag', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: {} },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });

    it('should handle response with success false', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: false, data: { exists: true } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });
  });

  describe('downloadTab', () => {
    it('should download tab by id', async () => {
      const mockTab = { id: 1, title: 'Test Tab' };
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockTab },
      });

      const result = await publicTabsService.downloadTab(1);
      expect(result).toEqual(mockTab);
    });

    it('should return null for invalid id', async () => {
      const result = await publicTabsService.downloadTab(0);
      expect(result).toBeNull();
    });
  });

  describe('getById - inherited from BaseService', () => {
    it('should handle invalid id', async () => {
      const result = await publicTabsService.getById(0);
      expect(result).toBeNull();
    });

    it('should handle API error', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      const result = await publicTabsService.getById(999);
      expect(result).toBeNull();
    });
  });
});
});