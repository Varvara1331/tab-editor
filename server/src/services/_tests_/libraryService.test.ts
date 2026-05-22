import { LibraryService } from '../libraryService';
import { db } from '../../database';

jest.mock('../../database');

describe('LibraryService', () => {
  const mockLibraryRow = {
    Id: 1,
    UserId: 1,
    TabId: 1,
    TabData: '{"title":"Test"}',
    IsPublication: 0,
    OriginalAuthorId: null,
    OriginalAuthorName: null,
    AddedAt: '2024-01-01T00:00:00.000Z',
    LastOpened: null,
  };

  const mockPublicationRow = {
    ...mockLibraryRow,
    IsPublication: 1,
    OriginalAuthorId: 2,
    OriginalAuthorName: 'Author',
  };

  const mockFavoriteTabRow = {
    TabId: 1,
    UserId: 2,
    Title: 'Favorite Song',
    Artist: 'Favorite Artist',
    Tuning: '["E","A","D","G","B","E"]',
    Measures: '[]',
    IsPublic: 1,
    Preview: null,
    Tags: '[]',
    CreatedAt: '2024-01-01T00:00:00.000Z',
    UpdatedAt: '2024-01-01T00:00:00.000Z',
    authorName: 'Author Name',
    AddedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('должен добавлять табулатуру в библиотеку', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockLibraryRow);

      const result = await LibraryService.add(1, { id: 1 } as any, false);

      expect(result.id).toBe(1);
      expect(db.run).toHaveBeenCalled();
    });

    it('должен добавлять табулатуру как публикацию', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockPublicationRow);

      const result = await LibraryService.add(1, { id: 1, userId: 2 } as any, true);

      expect(result.isPublication).toBe(true);
    });
  });

  describe('addFromPublication', () => {
    it('должен добавлять публикацию в библиотеку', async () => {
      (db.run as jest.Mock).mockResolvedValue({ lastID: 1 });
      (db.get as jest.Mock).mockResolvedValue(mockPublicationRow);

      const result = await LibraryService.addFromPublication(1, { id: 1, userId: 2 } as any);

      expect(result.isPublication).toBe(true);
      expect(db.run).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('должен возвращать элемент библиотеки если найден', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockLibraryRow);

      const result = await LibraryService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('должен возвращать null если элемент не найден', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await LibraryService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('должен возвращать элементы библиотеки пользователя', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockLibraryRow]);

      const result = await LibraryService.findByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('должен возвращать пустой массив если у пользователя нет элементов в библиотеке', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await LibraryService.findByUserId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('checkExists', () => {
    it('должен возвращать true если табулатура существует в библиотеке', async () => {
      (db.get as jest.Mock).mockResolvedValue({ Id: 1 });

      const result = await LibraryService.checkExists(1, 1);

      expect(result).toBe(true);
    });

    it('должен возвращать false если табулатура не в библиотеке', async () => {
      (db.get as jest.Mock).mockResolvedValue(null);

      const result = await LibraryService.checkExists(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('removeFromLibrary', () => {
    it('должен успешно удалять табулатуру из библиотеки', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      const result = await LibraryService.removeFromLibrary(1, 1);

      expect(result).toBe(true);
    });

    it('должен возвращать false если табулатура не в библиотеке', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 0 });

      const result = await LibraryService.removeFromLibrary(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('updateLastOpened', () => {
    it('должен обновлять временную метку последнего открытия', async () => {
      (db.run as jest.Mock).mockResolvedValue({ changes: 1 });

      await LibraryService.updateLastOpened(1);

      expect(db.run).toHaveBeenCalledWith(
        'UPDATE Library SET LastOpened = datetime("now") WHERE Id = ?',
        [1]
      );
    });
  });

  describe('getFavoritesByUserId', () => {
    it('должен возвращать избранные табулатуры для пользователя', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockFavoriteTabRow]);

      const result = await LibraryService.getFavoritesByUserId(1);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Favorite Song');
      expect(result[0].authorName).toBe('Author Name');
    });

    it('должен возвращать пустой массив если у пользователя нет избранного', async () => {
      (db.all as jest.Mock).mockResolvedValue([]);

      const result = await LibraryService.getFavoritesByUserId(1);

      expect(result).toHaveLength(0);
    });

    it('должен корректно парсить JSON поля', async () => {
      (db.all as jest.Mock).mockResolvedValue([mockFavoriteTabRow]);

      const result = await LibraryService.getFavoritesByUserId(1);

      expect(result[0].tuning).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
      expect(result[0].measures).toEqual([]);
      expect(result[0].tags).toEqual([]);
    });
  });

  describe('mapToLibraryItem', () => {
    it('должен корректно отображать строку базы данных в ILibraryItem', async () => {
      (db.get as jest.Mock).mockResolvedValue(mockLibraryRow);

      const result = await LibraryService.findById(1);

      expect(result).toMatchObject({
        id: 1,
        userId: 1,
        tabId: 1,
        tabData: '{"title":"Test"}',
        isPublication: false,
        originalAuthorId: null,
        originalAuthorName: null,
      });
      expect(result?.addedAt).toBeInstanceOf(Date);
    });

    it('должен обрабатывать дату последнего открытия', async () => {
      const rowWithLastOpened = {
        ...mockLibraryRow,
        LastOpened: '2024-01-15T00:00:00.000Z',
      };
      (db.get as jest.Mock).mockResolvedValue(rowWithLastOpened);

      const result = await LibraryService.findById(1);

      expect(result?.lastOpened).toBeInstanceOf(Date);
    });
  });
});