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
    it('должен преобразовывать TabResponse в TabData', () => {
      const result = transformToTabData(mockTabResponse);
      
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Song');
      expect(result.artist).toBe('Test Artist');
      expect(result.isPublic).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('должен обрабатывать пустые данные табулатуры', () => {
      const result = transformToTabData(null as any);
      expect(result.title).toBe('Untitled');
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('должен применять опции преобразования', () => {
      const result = transformToTabData(mockTabResponse, { 
        isOwn: true, 
        isPublic: true,
        userId: 100 
      });
      
      expect(result.isOwn).toBe(true);
      expect(result.isPublic).toBe(true);
      expect(result.userId).toBe(100);
    });

    it('должен обрабатывать табулатуру без исполнителя', () => {
      const tab = { ...mockTabResponse, artist: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.artist).toBe('');
    });

    it('должен обрабатывать табулатуру без строя (использовать строй по умолчанию)', () => {
      const tab = { ...mockTabResponse, tuning: null } as any;
      const result = transformToTabData(tab);
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('должен обрабатывать табулатуру с не-массивом в качестве строя', () => {
      const tab = { ...mockTabResponse, tuning: 'invalid' as any };
      const result = transformToTabData(tab);
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('должен обрабатывать табулатуру без тактов', () => {
      const tab = { ...mockTabResponse, measures: null } as any;
      const result = transformToTabData(tab);
      expect(result.measures).toEqual([]);
    });

    it('должен обрабатывать табулатуру без даты создания', () => {
      const tab = { ...mockTabResponse, createdAt: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('должен обрабатывать табулатуру без даты обновления', () => {
      const tab = { ...mockTabResponse, updatedAt: undefined } as any;
      const result = transformToTabData(tab);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('должен обрабатывать ошибку в процессе преобразования', () => {
      const badTab = {
        get id() { throw new Error('Test error'); }
      } as any;
      const result = transformToTabData(badTab);
      expect(result.title).toBe('Untitled');
    });
  });

  describe('transformToLibraryItem', () => {
    it('должен преобразовывать TabResponse в LibraryItem', () => {
      const result = transformToLibraryItem(mockTabResponse);
      
      expect(result.id).toBe(1);
      expect(result.tabData.title).toBe('Test Song');
      expect(result.lastModified).toBe(mockTabResponse.updatedAt);
      expect(result.isPublication).toBe(false);
    });

    it('должен обрабатывать опции публикации', () => {
      const result = transformToLibraryItem(mockTabResponse, {
        isPublication: true,
        originalAuthor: 'Original Author'
      });
      
      expect(result.isPublication).toBe(true);
      expect(result.originalAuthor).toBe('Original Author');
    });

    it('должен обрабатывать отсутствие updatedAt', () => {
      const tab = { ...mockTabResponse, updatedAt: undefined } as any;
      const result = transformToLibraryItem(tab);
      expect(result.lastModified).toBeDefined();
    });

    it('должен обрабатывать отсутствие preview', () => {
      const tab = { ...mockTabResponse, preview: undefined } as any;
      const result = transformToLibraryItem(tab);
      expect(result.preview).toBeUndefined();
    });
  });

  describe('transformPublicTabToTabData', () => {
    it('должен преобразовывать PublicTab в TabData', () => {
      const result = transformPublicTabToTabData(mockPublicTab, 200);
      
      expect(result.id).toBe(2);
      expect(result.title).toBe('Public Song');
      expect(result.isPublic).toBe(true);
      expect(result.isOwn).toBe(true);
    });

    it('должен устанавливать isOwn false для другого пользователя', () => {
      const result = transformPublicTabToTabData(mockPublicTab, 999);
      expect(result.isOwn).toBe(false);
    });

    it('должен обрабатывать невалидную публичную табулатуру', () => {
      const result = transformPublicTabToTabData(null as any);
      expect(result.title).toBe('Untitled');
    });

    it('должен обрабатывать публичную табулатуру без id', () => {
      const tab = { ...mockPublicTab, id: undefined } as any;
      const result = transformPublicTabToTabData(tab);
      expect(result.title).toBe('Untitled');
    });

    it('должен обрабатывать undefined в качестве currentUserId', () => {
      const result = transformPublicTabToTabData(mockPublicTab, undefined);
      expect(result.isOwn).toBe(false);
    });
  });
});