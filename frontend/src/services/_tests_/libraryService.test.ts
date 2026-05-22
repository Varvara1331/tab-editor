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
    it('должен возвращать true при успешном сохранении табулатуры в библиотеку', async () => {
      mockTabService.saveTab.mockResolvedValue({ id: 1 } as any);
      const result = await saveToLibrary({} as any);
      expect(result).toBe(true);
    });

    it('должен возвращать false при ошибке сохранения табулатуры', async () => {
      mockTabService.saveTab.mockResolvedValue(null);
      const result = await saveToLibrary({} as any);
      expect(result).toBe(false);
    });
  });

  describe('getLibrary', () => {
    it('должен возвращать список табулатур из библиотеки пользователя', async () => {
      mockTabService.getUserTabs.mockResolvedValue([{ id: 1, title: 'Tab 1', authorName: 'Author' }] as any);
      const result = await getLibrary();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('getFavorites', () => {
    it('должен возвращать список избранных табулатур с пометкой isPublication', async () => {
      mockTabService.getFavorites.mockResolvedValue([{ id: 1, title: 'Favorite 1', authorName: 'Author' }] as any);
      const result = await getFavorites();
      expect(result).toHaveLength(1);
      expect(result[0].isPublication).toBe(true);
    });
  });

  describe('addToFavorites', () => {
    it('должен добавлять табулатуру в избранное через publicTabsService', async () => {
      mockPublicTabsService.addToLibrary.mockResolvedValue(true);
      const result = await addToFavorites(1);
      expect(result).toBe(true);
      expect(mockPublicTabsService.addToLibrary).toHaveBeenCalledWith(1);
    });
  });

  describe('removeFromFavorites', () => {
    it('должен удалять табулатуру из избранного через publicTabsService', async () => {
      mockPublicTabsService.removeFromLibrary.mockResolvedValue(true);
      const result = await removeFromFavorites(1);
      expect(result).toBe(true);
    });
  });

  describe('checkInFavorites', () => {
    it('должен проверять наличие табулатуры в избранном через publicTabsService', async () => {
      mockPublicTabsService.checkInLibrary.mockResolvedValue(true);
      const result = await checkInFavorites(1);
      expect(result).toBe(true);
    });
  });

  describe('removeFromLibrary', () => {
    it('должен удалять табулатуру из библиотеки через tabService.delete', async () => {
      mockTabService.delete.mockResolvedValue(true);
      const result = await removeFromLibrary(1);
      expect(result).toBe(true);
    });
  });

  describe('updateInLibrary', () => {
    it('должен обновлять существующую табулатуру в библиотеке', async () => {
      mockTabService.update.mockResolvedValue({ id: 1 } as any);
      const result = await updateInLibrary(1, {} as any);
      expect(result).toBe(true);
    });
  });
});