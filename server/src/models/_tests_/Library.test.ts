import { LibraryModel } from '../Library';
import { LibraryService } from '../../services/libraryService';

jest.mock('../../services/libraryService');

describe('LibraryModel', () => {
  const mockLibraryItem = {
    id: 1,
    userId: 1,
    tabId: 1,
    tabData: { title: 'Test Song' },
    isPublication: 0,
    addedAt: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('add', () => {
    it('должен вызывать LibraryService.add при добавлении табулатуры в библиотеку', async () => {
      (LibraryService.add as jest.Mock).mockResolvedValue(mockLibraryItem);

      const result = await LibraryModel.add(1, { title: 'Test Song' } as any, false);

      expect(LibraryService.add).toHaveBeenCalledWith(1, { title: 'Test Song' }, false);
      expect(result).toEqual(mockLibraryItem);
    });
  });

  describe('findByUserId', () => {
    it('должен вызывать LibraryService.findByUserId при получении библиотеки пользователя', async () => {
      (LibraryService.findByUserId as jest.Mock).mockResolvedValue([mockLibraryItem]);

      const result = await LibraryModel.findByUserId(1);

      expect(LibraryService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockLibraryItem]);
    });
  });

  describe('checkExists', () => {
    it('должен вызывать LibraryService.checkExists при проверке существования табулатуры', async () => {
      (LibraryService.checkExists as jest.Mock).mockResolvedValue(true);

      const result = await LibraryModel.checkExists(1, 1);

      expect(LibraryService.checkExists).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('removeFromLibrary', () => {
    it('должен вызывать LibraryService.removeFromLibrary при удалении табулатуры из библиотеки', async () => {
      (LibraryService.removeFromLibrary as jest.Mock).mockResolvedValue(true);

      const result = await LibraryModel.removeFromLibrary(1, 1);

      expect(LibraryService.removeFromLibrary).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('getFavoritesByUserId', () => {
    it('должен вызывать LibraryService.getFavoritesByUserId при получении избранных табулатур', async () => {
      (LibraryService.getFavoritesByUserId as jest.Mock).mockResolvedValue([mockLibraryItem]);

      const result = await LibraryModel.getFavoritesByUserId(1);

      expect(LibraryService.getFavoritesByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockLibraryItem]);
    });
  });
});