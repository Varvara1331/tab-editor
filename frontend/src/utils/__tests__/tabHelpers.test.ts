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
    it('должен возвращать true для LibraryItem', () => {
      expect(isLibraryItem(mockLibraryItem)).toBe(true);
    });

    it('должен возвращать false для PublicTab', () => {
      expect(isLibraryItem(mockPublicTab)).toBe(false);
    });

    it('должен возвращать false для null', () => {
      expect(isLibraryItem(null)).toBe(false);
    });

    it('должен возвращать false для undefined', () => {
      expect(isLibraryItem(undefined)).toBe(false);
    });
  });

  describe('isPublicTab', () => {
    it('должен возвращать true для PublicTab', () => {
      expect(isPublicTab(mockPublicTab)).toBe(true);
    });

    it('должен возвращать false для LibraryItem', () => {
      expect(isPublicTab(mockLibraryItem)).toBe(false);
    });
  });

  describe('getTabTitle', () => {
    it('должен получать заголовок из LibraryItem', () => {
      expect(getTabTitle(mockLibraryItem)).toBe('Song');
    });

    it('должен получать заголовок из PublicTab', () => {
      expect(getTabTitle(mockPublicTab)).toBe('Public Song');
    });
  });

  describe('getTabArtist', () => {
    it('должен получать исполнителя из LibraryItem', () => {
      expect(getTabArtist(mockLibraryItem)).toBe('Artist');
    });

    it('должен получать исполнителя из PublicTab', () => {
      expect(getTabArtist(mockPublicTab)).toBe('Public Artist');
    });
  });

  describe('getTabTuning', () => {
    it('должен получать строй из LibraryItem', () => {
      expect(getTabTuning(mockLibraryItem)).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('должен получать строй из PublicTab', () => {
      expect(getTabTuning(mockPublicTab)).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });
  });

  describe('getTabId', () => {
    it('должен получать ID из LibraryItem', () => {
      expect(getTabId(mockLibraryItem)).toBe(1);
    });

    it('должен получать ID из PublicTab', () => {
      expect(getTabId(mockPublicTab)).toBe(2);
    });
  });

  describe('getTabDate', () => {
    it('должен получать дату из LibraryItem', () => {
      const date = getTabDate(mockLibraryItem, 'my');
      expect(date).toBe(mockLibraryItem.lastModified);
    });

    it('должен получать дату из PublicTab', () => {
      const date = getTabDate(mockPublicTab, 'public');
      expect(date).toBe(mockPublicTab.createdAt);
    });
  });

  describe('getTabPreview', () => {
    it('должен получать превью из LibraryItem', () => {
      expect(getTabPreview(mockLibraryItem)).toBe('Song preview');
    });

    it('должен получать превью из PublicTab', () => {
      expect(getTabPreview(mockPublicTab)).toBe('Public preview');
    });
  });

  describe('getIsPublicFromTab', () => {
    it('должен возвращать false для приватной LibraryItem', () => {
      expect(getIsPublicFromTab(mockLibraryItem)).toBe(false);
    });

    it('должен возвращать true для PublicTab', () => {
      expect(getIsPublicFromTab(mockPublicTab)).toBe(true);
    });
  });
});