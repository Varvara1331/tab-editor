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
    it('should create a new tab', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.create(1, { title: 'Test Song' });

      expect(result.title).toBe('Test Song');
      expect(result.userId).toBe(1);
      expect(db.run).toHaveBeenCalled();
    });

    it('should create tab with default values when minimal data provided', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.create(1, {});

      expect(result.title).toBe('Test Song');
      expect(db.run).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return tab when found', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Song');
      expect(result?.tuning).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });

    it('should return null when tab not found', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TabService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return user tabs', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockTabRow]);

      const result = await TabService.findByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Song');
    });

    it('should return empty array when user has no tabs', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await TabService.findByUserId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findPublicTabs', () => {
    it('should return public tabs', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockPublicTabRow]);

      const result = await TabService.findPublicTabs(10, 0);

      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
    });

    it('should return public tabs with search', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockPublicTabRow]);

      const result = await TabService.findPublicTabs(10, 0, 'test');

      expect(db.all).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        ['%test%', '%test%', 10, 0]
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no public tabs', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await TabService.findPublicTabs(10, 0);

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update tab title', async () => {
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

    it('should update isPublic status', async () => {
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

    it('should return null when tab not found', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await TabService.update(999, 1, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('should return null when user is not owner', async () => {
      (db.get as jest.Mock).mockResolvedValue({ ...mockTabRow, UserId: 2 });

      const result = await TabService.update(1, 1, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('should return same tab when no fields to update', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockTabRow);

      const result = await TabService.update(1, 1, {});

      expect(result).not.toBeNull();
      expect(db.run).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete tab successfully', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await TabService.delete(1, 1);

      expect(result).toBe(true);
      expect(db.run).toHaveBeenCalledWith(
        'DELETE FROM Tabs WHERE Id = ? AND UserId = ?',
        [1, 1]
      );
    });

    it('should return false when tab not found', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 0 });

      const result = await TabService.delete(999, 1);

      expect(result).toBe(false);
    });
  });

  describe('incrementViews', () => {
    it('should increment views counter', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      await TabService.incrementViews(1);

      expect(db.run).toHaveBeenCalledWith(
        'UPDATE Tabs SET Views = Views + 1 WHERE Id = ?',
        [1]
      );
    });
  });

  describe('mapTab', () => {
    it('should correctly map database row to ITab', async () => {
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