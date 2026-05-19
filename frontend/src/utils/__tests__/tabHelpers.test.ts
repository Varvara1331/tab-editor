import { 
  isLibraryItem, 
  isPublicTab, 
  getTabTitle, 
  getTabArtist, 
  getTabTuning, 
  getTabId,
  getTabDate,
  getTabPreview,
  getIsPublicFromTab
} from '../tabHelpers';
import { LibraryItem } from '../../services/libraryService';
import { PublicTab } from '../../services/publicTabsService';

const mockLibraryItem: LibraryItem = {
  id: 1,
  tabData: {
    id: 1,
    title: 'Song',
    artist: 'Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [],
    isPublic: false,
    isOwn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  lastModified: new Date().toISOString(),
  preview: 'Song preview',
  isPublication: false,
  originalAuthor: 'Original Author',
};

const mockPublicTab: PublicTab = {
  id: 2,
  userId: 100,
  title: 'Public Song',
  artist: 'Public Artist',
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  measures: [],
  isPublic: true,
  views: 100,
  likes: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorName: 'Public Author',
  preview: 'Public preview',
  tags: ['rock'],
};

describe('tabHelpers', () => {
  describe('isLibraryItem', () => {
    it('should return true for LibraryItem', () => {
      expect(isLibraryItem(mockLibraryItem)).toBe(true);
    });

    it('should return false for PublicTab', () => {
      expect(isLibraryItem(mockPublicTab)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isLibraryItem(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isLibraryItem(undefined)).toBe(false);
    });
  });

  describe('isPublicTab', () => {
    it('should return true for PublicTab', () => {
      expect(isPublicTab(mockPublicTab)).toBe(true);
    });

    it('should return false for LibraryItem', () => {
      expect(isPublicTab(mockLibraryItem)).toBe(false);
    });
  });

  describe('getTabTitle', () => {
    it('should get title from LibraryItem', () => {
      expect(getTabTitle(mockLibraryItem)).toBe('Song');
    });

    it('should get title from PublicTab', () => {
      expect(getTabTitle(mockPublicTab)).toBe('Public Song');
    });
  });

  describe('getTabArtist', () => {
    it('should get artist from LibraryItem', () => {
      expect(getTabArtist(mockLibraryItem)).toBe('Artist');
    });

    it('should get artist from PublicTab', () => {
      expect(getTabArtist(mockPublicTab)).toBe('Public Artist');
    });
  });

  describe('getTabTuning', () => {
    it('should get tuning from LibraryItem', () => {
      expect(getTabTuning(mockLibraryItem)).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('should get tuning from PublicTab', () => {
      expect(getTabTuning(mockPublicTab)).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });
  });

  describe('getTabId', () => {
    it('should get id from LibraryItem', () => {
      expect(getTabId(mockLibraryItem)).toBe(1);
    });

    it('should get id from PublicTab', () => {
      expect(getTabId(mockPublicTab)).toBe(2);
    });
  });

  describe('getTabDate', () => {
    it('should get date from LibraryItem', () => {
      const date = getTabDate(mockLibraryItem, 'my');
      expect(date).toBe(mockLibraryItem.lastModified);
    });

    it('should get date from PublicTab', () => {
      const date = getTabDate(mockPublicTab, 'public');
      expect(date).toBe(mockPublicTab.createdAt);
    });
  });

  describe('getTabPreview', () => {
    it('should get preview from LibraryItem', () => {
      expect(getTabPreview(mockLibraryItem)).toBe('Song preview');
    });

    it('should get preview from PublicTab', () => {
      expect(getTabPreview(mockPublicTab)).toBe('Public preview');
    });
  });

  describe('getIsPublicFromTab', () => {
    it('should return false for private LibraryItem', () => {
      expect(getIsPublicFromTab(mockLibraryItem)).toBe(false);
    });

    it('should return true for PublicTab', () => {
      expect(getIsPublicFromTab(mockPublicTab)).toBe(true);
    });
  });
});