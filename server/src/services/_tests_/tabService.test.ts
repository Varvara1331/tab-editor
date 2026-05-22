import { TabService } from '../tabService';
import { db } from '../../database';

jest.mock('../../database');

describe('TabService', () => {
  const mockTabRow = {
    Id: 1,
    UserId: 1,
    Title: 'Test Song',
    Artist: 'Test Artist',
    Tuning: '["E","A","D","G","B","E"]',
    Measures: '[]',
    NotesPerMeasure: 16,
    IsPublic: 0,
    Views: 0,
    Likes: 0,
    Preview: null,
    Tags: '[]',
    CreatedAt: '2024-01-01T00:00:00.000Z',
    UpdatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockPublicTabRow = {
    ...mockTabRow,
    IsPublic: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('должен создавать новую табулатуру', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.create(1, { title: 'Test Song' });

      expect(result.title).toBe('Test Song');
      expect(result.userId).toBe(1);
      expect(db.run).toHaveBeenCalled();
    });

    it('должен создавать табулатуру со значениями по умолчанию при минимальных данных', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.create(1, {});

      expect(result.title).toBe('Test Song');
      expect(db.run).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('должен возвращать табулатуру если найдена', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Song');
      expect(result?.tuning).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });

    it('должен возвращать null если табулатура не найдена', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TabService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('должен возвращать табулатуры пользователя', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockTabRow]);

      const result = await TabService.findByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Song');
    });

    it('должен возвращать пустой массив если у пользователя нет табулатур', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await TabService.findByUserId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findPublicTabs', () => {
    it('должен возвращать публичные табулатуры', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockPublicTabRow]);

      const result = await TabService.findPublicTabs(10, 0);

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });

    it('должен возвращать публичные табулатуры с поиском', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockPublicTabRow]);

      const result = await TabService.findPublicTabs(10, 0, 'test');

      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        ['%test%', '%test%', 10, 0]
      );
      expect(result).toHaveLength(1);
    });

    it('должен возвращать пустой массив если нет публичных табулатур', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await TabService.findPublicTabs(10, 0);

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('должен обновлять заголовок табулатуры', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });
      (db.get as jest.Mock).mockResolvedValueOnce(mockTabRow).mockResolvedValueOnce({
        ...mockTabRow,
        Title: 'Updated Title',
      });

      const result = await TabService.update(1, 1, { title: 'Updated Title' });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Updated Title');
    });

    it('должен обновлять статус публичности', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });
      (db.get as jest.Mock).mockResolvedValueOnce(mockTabRow).mockResolvedValueOnce({
        ...mockTabRow,
        IsPublic: 1,
      });

      const result = await TabService.update(1, 1, { isPublic: true });

      expect(result).not.toBeNull();
      expect(result?.isPublic).toBe(true);
    });

    it('должен возвращать null если табулатура не найдена', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TabService.update(999, 1, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('должен возвращать null если пользователь не владелец', async () => {
      (db.get as jest.Mock).mockResolvedValue({ ...mockTabRow, UserId: 2 });

      const result = await TabService.update(1, 1, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('должен возвращать ту же табулатуру если нет полей для обновления', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.update(1, 1, {});

      expect(result).not.toBeNull();
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('должен успешно удалять табулатуру', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TabService.delete(1, 1);

      expect(result).toBe(true);
      expect(db.run).toHaveBeenCalledWith(
        'DELETE FROM Tabs WHERE Id = ? AND UserId = ?',
        [1, 1]
      );
    });

    it('должен возвращать false если табулатура не найдена', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 0 });

      const result = await TabService.delete(999, 1);

      expect(result).toBe(false);
    });
  });

  describe('incrementViews', () => {
    it('должен увеличивать счетчик просмотров', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      await TabService.incrementViews(1);

      expect(db.run).toHaveBeenCalledWith(
        'UPDATE Tabs SET Views = Views + 1 WHERE Id = ?',
        [1]
      );
    });
  });

  describe('mapTab', () => {
    it('должен корректно отображать строку базы данных в ITab', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.findById(1);

      expect(result).toMatchObject({
        id: 1,
        userId: 1,
        title: 'Test Song',
        artist: 'Test Artist',
        tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
        measures: [],
        notesPerMeasure: 16,
        isPublic: false,
        views: 0,
        likes: 0,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });
});