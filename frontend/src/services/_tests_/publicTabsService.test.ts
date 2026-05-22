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
    it('должен возвращать список публичных табулатур при успешном запросе', async () => {
      const mockTabs = [{ id: 1, title: 'Public Tab 1' }];
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockTabs },
      });

      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual(mockTabs);
    });

    it('должен возвращать пустой массив при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual([]);
    });

    it('должен передавать параметры поиска в запросе', async () => {
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
    it('должен добавлять публичную табулатуру в библиотеку', async () => {
      mockApi.post.mockResolvedValue({
        data: { success: true },
      });

      const result = await publicTabsService.addToLibrary(1);
      expect(result).toBe(true);
      expect(mockApi.post).toHaveBeenCalledWith('/public-tabs/1/library');
    });

    it('должен возвращать true если табулатура уже в библиотеке', async () => {
      mockApi.post.mockRejectedValue({
        response: { data: { error: 'Табулатура уже добавлена в библиотеку' } },
      });

      const result = await publicTabsService.addToLibrary(1);
      expect(result).toBe(true);
    });

    it('должен возвращать false для невалидного ID', async () => {
      const result = await publicTabsService.addToLibrary(0);
      expect(result).toBe(false);
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  describe('removeFromLibrary', () => {
    it('должен удалять публичную табулатуру из библиотеки', async () => {
      mockApi.delete.mockResolvedValue({
        data: { success: true },
      });

      const result = await publicTabsService.removeFromLibrary(1);
      expect(result).toBe(true);
    });

    it('должен возвращать false для невалидного ID', async () => {
      const result = await publicTabsService.removeFromLibrary(0);
      expect(result).toBe(false);
    });
  });

  describe('checkInLibrary', () => {
    it('должен возвращать true если табулатура есть в библиотеке', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { exists: true } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(true);
    });

    it('должен возвращать false если табулатуры нет в библиотеке', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: { exists: false } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });
  });

  describe('getPublicTabs - расширенное покрытие', () => {
    it('должен обрабатывать пустой поисковый запрос', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs({ search: '', limit: 10, offset: 0 });
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 10, offset: 0 },
      });
    });

    it('должен обрезать пробелы в поисковом запросе', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs({ search: '  rock  ', limit: 10, offset: 0 });
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 10, offset: 0, search: 'rock' },
      });
    });

    it('должен использовать значения по умолчанию когда параметры не переданы', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: [] },
      });

      await publicTabsService.getPublicTabs();
      expect(mockApi.get).toHaveBeenCalledWith('/public-tabs', {
        params: { limit: 50, offset: 0 },
      });
    });

    it('должен возвращать пустой массив когда в ответе нет данных', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: null },
      });

      const result = await publicTabsService.getPublicTabs();
      expect(result).toEqual([]);
    });
  });

  describe('addToLibrary - расширенное покрытие', () => {
    it('должен обрабатывать отрицательный ID табулатуры', async () => {
      const result = await publicTabsService.addToLibrary(-1);
      expect(result).toBe(false);
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('должен обрабатывать NaN как ID табулатуры', async () => {
      const result = await publicTabsService.addToLibrary(NaN);
      expect(result).toBe(false);
    });
  });

  describe('removeFromLibrary - расширенное покрытие', () => {
    it('должен обрабатывать ошибку API', async () => {
      mockApi.delete.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.removeFromLibrary(1);
      expect(result).toBe(false);
    });

    it('должен обрабатывать невалидный ID', async () => {
      const result = await publicTabsService.removeFromLibrary(0);
      expect(result).toBe(false);
      expect(mockApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkInLibrary - расширенное покрытие', () => {
    it('должен обрабатывать ошибку API', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });

    it('должен обрабатывать невалидный ID', async () => {
      const result = await publicTabsService.checkInLibrary(-5);
      expect(result).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('должен обрабатывать ответ без флага exists', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: {} },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });

    it('должен обрабатывать ответ с success: false', async () => {
      mockApi.get.mockResolvedValue({
        data: { success: false, data: { exists: true } },
      });

      const result = await publicTabsService.checkInLibrary(1);
      expect(result).toBe(false);
    });
  });

  describe('downloadTab', () => {
    it('должен загружать табулатуру по ID', async () => {
      const mockTab = { id: 1, title: 'Test Tab' };
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockTab },
      });

      const result = await publicTabsService.downloadTab(1);
      expect(result).toEqual(mockTab);
    });

    it('должен возвращать null для невалидного ID', async () => {
      const result = await publicTabsService.downloadTab(0);
      expect(result).toBeNull();
    });
  });

  describe('getById - наследуемый из BaseService', () => {
    it('должен обрабатывать невалидный ID', async () => {
      const result = await publicTabsService.getById(0);
      expect(result).toBeNull();
    });

    it('должен обрабатывать ошибку API', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      const result = await publicTabsService.getById(999);
      expect(result).toBeNull();
    });
  });
});