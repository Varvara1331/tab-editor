import { BaseService, Identifiable } from '../baseService';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

interface TestEntity extends Identifiable {
  name: string;
}

describe('BaseService', () => {
  let service: BaseService<TestEntity>;
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BaseService<TestEntity>('/test');
  });

  describe('getAll', () => {
    it('должен возвращать все сущности при успешном запросе', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await service.getAll();
      expect(result).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith('/test');
    });

    it('должен возвращать пустой массив при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const result = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('должен возвращать сущность по ID при успешном запросе', async () => {
      const mockData = { id: 1, name: 'Item 1' };
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockData },
      });

      const result = await service.getById(1);
      expect(result).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith('/test/1');
    });

    it('должен возвращать null при невалидном ID', async () => {
      const result = await service.getById(0);
      expect(result).toBeNull();
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('должен возвращать null при ошибке запроса', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      const result = await service.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('должен успешно создавать новую сущность', async () => {
      const newData = { name: 'New Item' };
      const created = { id: 1, ...newData };
      mockApi.post.mockResolvedValue({
        data: { success: true, data: created },
      });

      const result = await service.create(newData);
      expect(result).toEqual(created);
      expect(mockApi.post).toHaveBeenCalledWith('/test', newData);
    });

    it('должен возвращать null при ошибке создания', async () => {
      mockApi.post.mockRejectedValue(new Error('Create failed'));
      const result = await service.create({ name: 'Fail' });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('должен успешно обновлять существующую сущность', async () => {
      const updateData = { name: 'Updated' };
      const updated = { id: 1, name: 'Updated' };
      mockApi.put.mockResolvedValue({
        data: { success: true, data: updated },
      });

      const result = await service.update(1, updateData);
      expect(result).toEqual(updated);
      expect(mockApi.put).toHaveBeenCalledWith('/test/1', updateData);
    });

    it('должен возвращать null при невалидном ID', async () => {
      const result = await service.update(0, { name: 'Invalid' });
      expect(result).toBeNull();
      expect(mockApi.put).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('должен успешно удалять сущность', async () => {
      mockApi.delete.mockResolvedValue({
        data: { success: true },
      });

      const result = await service.delete(1);
      expect(result).toBe(true);
      expect(mockApi.delete).toHaveBeenCalledWith('/test/1');
    });

    it('должен возвращать false при невалидном ID', async () => {
      const result = await service.delete(0);
      expect(result).toBe(false);
      expect(mockApi.delete).not.toHaveBeenCalled();
    });

    it('должен возвращать false при ошибке удаления', async () => {
      mockApi.delete.mockRejectedValue(new Error('Delete failed'));
      const result = await service.delete(1);
      expect(result).toBe(false);
    });
  });
});