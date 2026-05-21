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
    it('should call LibraryService.add', async () => {
      (LibraryService.add as jest.Mock).mockResolvedValue(mockLibraryItem);

      const result = await LibraryModel.add(1, { title: 'Test Song' } as any, false);

      expect(LibraryService.add).toHaveBeenCalledWith(1, { title: 'Test Song' }, false);
      expect(result).toEqual(mockLibraryItem);
    });
  });

  describe('findByUserId', () => {
    it('should call LibraryService.findByUserId', async () => {
      (LibraryService.findByUserId as jest.Mock).mockResolvedValue([mockLibraryItem]);

      const result = await LibraryModel.findByUserId(1);

      expect(LibraryService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockLibraryItem]);
    });
  });

  describe('checkExists', () => {
    it('should call LibraryService.checkExists', async () => {
      (LibraryService.checkExists as jest.Mock).mockResolvedValue(true);

      const result = await LibraryModel.checkExists(1, 1);

      expect(LibraryService.checkExists).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('removeFromLibrary', () => {
    it('should call LibraryService.removeFromLibrary', async () => {
      (LibraryService.removeFromLibrary as jest.Mock).mockResolvedValue(true);

      const result = await LibraryModel.removeFromLibrary(1, 1);

      expect(LibraryService.removeFromLibrary).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('getFavoritesByUserId', () => {
    it('should call LibraryService.getFavoritesByUserId', async () => {
      (LibraryService.getFavoritesByUserId as jest.Mock).mockResolvedValue([mockLibraryItem]);

      const result = await LibraryModel.getFavoritesByUserId(1);

      expect(LibraryService.getFavoritesByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockLibraryItem]);
    });
  });
});