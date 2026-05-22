import { TabModel } from '../Tab';
import { TabService } from '../../services/tabService';

jest.mock('../../services/tabService');

describe('TabModel', () => {
  const mockTab = {
    id: 1,
    userId: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [],
    notesPerMeasure: 16,
    isPublic: false,
    views: 0,
    likes: 0,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен вызывать TabService.create при создании новой табулатуры', async () => {
      (TabService.create as jest.Mock).mockResolvedValue(mockTab);

      const result = await TabModel.create(1, { title: 'Test Song' });

      expect(TabService.create).toHaveBeenCalledWith(1, { title: 'Test Song' });
      expect(result).toEqual(mockTab);
    });
  });

  describe('findById', () => {
    it('должен вызывать TabService.findById при поиске табулатуры по ID', async () => {
      (TabService.findById as jest.Mock).mockResolvedValue(mockTab);

      const result = await TabModel.findById(1);

      expect(TabService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTab);
    });
  });

  describe('findByUserId', () => {
    it('должен вызывать TabService.findByUserId при получении табулатур пользователя', async () => {
      (TabService.findByUserId as jest.Mock).mockResolvedValue([mockTab]);

      const result = await TabModel.findByUserId(1);

      expect(TabService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockTab]);
    });
  });

  describe('findPublicTabs', () => {
    it('должен вызывать TabService.findPublicTabs при получении публичных табулатур', async () => {
      (TabService.findPublicTabs as jest.Mock).mockResolvedValue([mockTab]);

      const result = await TabModel.findPublicTabs(10, 0, 'test');

      expect(TabService.findPublicTabs).toHaveBeenCalledWith(10, 0, 'test');
      expect(result).toEqual([mockTab]);
    });
  });

  describe('update', () => {
    it('должен вызывать TabService.update при обновлении табулатуры', async () => {
      (TabService.update as jest.Mock).mockResolvedValue(mockTab);

      const result = await TabModel.update(1, 1, { title: 'Updated Title' });

      expect(TabService.update).toHaveBeenCalledWith(1, 1, { title: 'Updated Title' });
      expect(result).toEqual(mockTab);
    });
  });

  describe('delete', () => {
    it('должен вызывать TabService.delete при удалении табулатуры', async () => {
      (TabService.delete as jest.Mock).mockResolvedValue(true);

      const result = await TabModel.delete(1, 1);

      expect(TabService.delete).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('incrementViews', () => {
    it('должен вызывать TabService.incrementViews при увеличении счетчика просмотров', async () => {
      (TabService.incrementViews as jest.Mock).mockResolvedValue(undefined);

      await TabModel.incrementViews(1);

      expect(TabService.incrementViews).toHaveBeenCalledWith(1);
    });
  });
});