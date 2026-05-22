import { tabService } from '../tabService';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('tabService', () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTabs', () => {
    it('должен возвращать список табулатур пользователя при успешном запросе', async () => {
      const mockTabs = [{ id: 1, title: 'Tab 1' }];
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockTabs },
      });

      const result = await tabService.getUserTabs();
      expect(result).toEqual(mockTabs);
      expect(mockApi.get).toHaveBeenCalledWith('/tabs');
    });

    it('должен возвращать пустой массив при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await tabService.getUserTabs();
      expect(result).toEqual([]);
    });
  });

  describe('getFavorites', () => {
    it('должен возвращать список избранных табулатур при успешном запросе', async () => {
      const mockFavorites = [{ id: 1, title: 'Favorite 1', addedAt: '2024-01-01' }];
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockFavorites },
      });

      const result = await tabService.getFavorites();
      expect(result).toEqual(mockFavorites);
      expect(mockApi.get).toHaveBeenCalledWith('/tabs/favorites');
    });

    it('должен возвращать пустой массив при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Error'));
      const result = await tabService.getFavorites();
      expect(result).toEqual([]);
    });
  });

  describe('saveTab', () => {
    const mockTabData = {
      id: undefined,
      title: 'New Tab',
      artist: 'Artist',
      tuning: ['E4', 'B3'],
      measures: [],
      isPublic: false,
    };

    it('должен создавать новую табулатуру при отсутствии id', async () => {
      const createdTab = { id: 1, title: 'New Tab' };
      mockApi.post.mockResolvedValue({
        data: { success: true, data: createdTab },
      });

      const result = await tabService.saveTab(mockTabData);
      expect(result).toEqual(createdTab);
      expect(mockApi.post).toHaveBeenCalled();
    });

    it('должен обновлять существующую табулатуру при наличии id', async () => {
      const existingTab = { ...mockTabData, id: 1 };
      const updatedTab = { id: 1, title: 'Updated Tab' };
      mockApi.put.mockResolvedValue({
        data: { success: true, data: updatedTab },
      });

      const result = await tabService.saveTab(existingTab);
      expect(result).toEqual(updatedTab);
      expect(mockApi.put).toHaveBeenCalled();
    });

    it('должен возвращать null при невалидных данных табулатуры', async () => {
      const result = await tabService.saveTab({} as any);
      expect(result).toBeNull();
    });
  });
});