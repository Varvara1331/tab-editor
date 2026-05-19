import { 
  saveToLibrary, 
  getLibrary, 
  getFavorites, 
  addToFavorites, 
  removeFromFavorites,
  checkInFavorites,
  removeFromLibrary,
  updateInLibrary
} from '../libraryService';
import { tabService } from '../tabService';
import { publicTabsService } from '../publicTabsService';

jest.mock('../tabService');
jest.mock('../publicTabsService');

describe('libraryService', () => {
  const mockTabService = tabService as jest.Mocked<typeof tabService>;
  const mockPublicTabsService = publicTabsService as jest.Mocked<typeof publicTabsService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveToLibrary', () => {
    it('should return true on success', async () => {
      mockTabService.saveTab.mockResolvedValue({ id: 1 } as any);
      const result = await saveToLibrary({} as any);
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockTabService.saveTab.mockResolvedValue(null);
      const result = await saveToLibrary({} as any);
      expect(result).toBe(false);
    });
  });

  describe('getLibrary', () => {
    it('should return library items', async () => {
      mockTabService.getUserTabs.mockResolvedValue([{ id: 1, title: 'Tab 1', authorName: 'Author' }] as any);
      const result = await getLibrary();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('getFavorites', () => {
    it('should return favorites', async () => {
      mockTabService.getFavorites.mockResolvedValue([{ id: 1, title: 'Favorite 1', authorName: 'Author' }] as any);
      const result = await getFavorites();
      expect(result).toHaveLength(1);
      expect(result[0].isPublication).toBe(true);
    });
  });

  describe('addToFavorites', () => {
    it('should call publicTabsService.addToLibrary', async () => {
      mockPublicTabsService.addToLibrary.mockResolvedValue(true);
      const result = await addToFavorites(1);
      expect(result).toBe(true);
      expect(mockPublicTabsService.addToLibrary).toHaveBeenCalledWith(1);
    });
  });

  describe('removeFromFavorites', () => {
    it('should call publicTabsService.removeFromLibrary', async () => {
      mockPublicTabsService.removeFromLibrary.mockResolvedValue(true);
      const result = await removeFromFavorites(1);
      expect(result).toBe(true);
    });
  });

  describe('checkInFavorites', () => {
    it('should call publicTabsService.checkInLibrary', async () => {
      mockPublicTabsService.checkInLibrary.mockResolvedValue(true);
      const result = await checkInFavorites(1);
      expect(result).toBe(true);
    });
  });

  describe('removeFromLibrary', () => {
    it('should call tabService.delete', async () => {
      mockTabService.delete.mockResolvedValue(true);
      const result = await removeFromLibrary(1);
      expect(result).toBe(true);
    });
  });

  describe('updateInLibrary', () => {
    it('should update tab', async () => {
      mockTabService.update.mockResolvedValue({ id: 1 } as any);
      const result = await updateInLibrary(1, {} as any);
      expect(result).toBe(true);
    });
  });
});