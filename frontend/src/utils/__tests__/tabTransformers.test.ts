import { 
  transformToTabData, 
  transformToLibraryItem, 
  transformPublicTabToTabData 
} from '../tabTransformers';

describe('tabTransformers', () => {
  const mockTabResponse = {
    id: 1,
    userId: 100,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [{ id: 'measure-1', strings: [] }],
    isPublic: false,
    views: 0,
    likes: 0,
    preview: 'Test preview',
    tags: ['test'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    authorName: 'Author',
  };

  const mockPublicTab = {
    id: 2,
    userId: 200,
    title: 'Public Song',
    artist: 'Public Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [{ id: 'measure-1', strings: [] }],
    isPublic: true,
    views: 100,
    likes: 10,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    authorName: 'Public Author',
    preview: 'Public preview',
    tags: ['rock'],
  };

  describe('transformToTabData', () => {
    it('should transform TabResponse to TabData', () => {
      const result = transformToTabData(mockTabResponse);
      
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Song');
      expect(result.artist).toBe('Test Artist');
      expect(result.isPublic).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should handle empty tab data', () => {
      const result = transformToTabData(null as any);
      expect(result.title).toBe('Untitled');
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('should apply transform options', () => {
      const result = transformToTabData(mockTabResponse, { 
        isOwn: true, 
        isPublic: true,
        userId: 100 
      });
      
      expect(result.isOwn).toBe(true);
      expect(result.isPublic).toBe(true);
      expect(result.userId).toBe(100);
    });

    it('should handle tab without artist', () => {
      const tab = { ...mockTabResponse, artist: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.artist).toBe('');
    });

    it('should handle tab without tuning (fallback to default)', () => {
      const tab = { ...mockTabResponse, tuning: null } as any;
      const result = transformToTabData(tab);
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('should handle tab with non-array tuning', () => {
      const tab = { ...mockTabResponse, tuning: 'invalid' as any };
      const result = transformToTabData(tab);
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('should handle tab without measures', () => {
      const tab = { ...mockTabResponse, measures: null } as any;
      const result = transformToTabData(tab);
      expect(result.measures).toEqual([]);
    });

    it('should handle tab without createdAt', () => {
      const tab = { ...mockTabResponse, createdAt: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should handle tab without updatedAt', () => {
      const tab = { ...mockTabResponse, updatedAt: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle error during transformation', () => {
      const badTab = {
        get id() { throw new Error('Test error'); }
      } as any;
      const result = transformToTabData(badTab);
      expect(result.title).toBe('Untitled');
    });
  });

  describe('transformToLibraryItem', () => {
    it('should transform TabResponse to LibraryItem', () => {
      const result = transformToLibraryItem(mockTabResponse);
      
      expect(result.id).toBe(1);
      expect(result.tabData.title).toBe('Test Song');
      expect(result.lastModified).toBe(mockTabResponse.updatedAt);
      expect(result.isPublication).toBe(false);
    });

    it('should handle publication options', () => {
      const result = transformToLibraryItem(mockTabResponse, {
        isPublication: true,
        originalAuthor: 'Original Author'
      });
      
      expect(result.isPublication).toBe(true);
      expect(result.originalAuthor).toBe('Original Author');
    });

    it('should handle missing updatedAt', () => {
      const tab = { ...mockTabResponse, updatedAt: undefined } as any;
      const result = transformToLibraryItem(tab);
      expect(result.lastModified).toBeDefined();
    });

    it('should handle missing preview', () => {
      const tab = { ...mockTabResponse, preview: undefined } as any;
      const result = transformToLibraryItem(tab);
      expect(result.preview).toBeUndefined();
    });
  });

  describe('transformPublicTabToTabData', () => {
    it('should transform PublicTab to TabData', () => {
      const result = transformPublicTabToTabData(mockPublicTab, 200);
      
      expect(result.id).toBe(2);
      expect(result.title).toBe('Public Song');
      expect(result.isPublic).toBe(true);
      expect(result.isOwn).toBe(true);
    });

    it('should set isOwn false for different user', () => {
      const result = transformPublicTabToTabData(mockPublicTab, 999);
      expect(result.isOwn).toBe(false);
    });

    it('should handle invalid public tab', () => {
      const result = transformPublicTabToTabData(null as any);
      expect(result.title).toBe('Untitled');
    });

    it('should handle public tab without id', () => {
      const tab = { ...mockPublicTab, id: undefined } as any;
      const result = transformPublicTabToTabData(tab);
      expect(result.title).toBe('Untitled');
    });

    it('should handle undefined currentUserId', () => {
      const result = transformPublicTabToTabData(mockPublicTab, undefined);
      expect(result.isOwn).toBe(false);
    });
  });
});