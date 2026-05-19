import { 
  filterBySearchQuery, 
  filterLibraryItems, 
  filterPublicTabs, 
  filterByFields 
} from '../filterUtils';

describe('filterUtils', () => {
  const mockItems = [
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    { title: 'Smoke on the Water', artist: 'Deep Purple' },
    { title: 'Back in Black', artist: 'AC/DC' },
  ];

  describe('filterBySearchQuery', () => {
    it('should filter by title', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Stairway to Heaven');
    });

    it('should filter by artist', () => {
      const result = filterBySearchQuery(mockItems, 'Purple');
      expect(result).toHaveLength(1);
      expect(result[0].artist).toBe('Deep Purple');
    });

    it('should be case insensitive by default', () => {
      const result = filterBySearchQuery(mockItems, 'STAIRWAY');
      expect(result).toHaveLength(1);
    });

    it('should respect caseSensitive option', () => {
      const result = filterBySearchQuery(mockItems, 'STAIRWAY', { caseSensitive: true });
      expect(result).toHaveLength(0);
    });

    it('should return all items for empty query', () => {
      const result = filterBySearchQuery(mockItems, '');
      expect(result).toHaveLength(3);
    });

    it('should return empty array for no matches', () => {
      const result = filterBySearchQuery(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should support exact match mode', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway to Heaven', { matchExact: true });
      expect(result).toHaveLength(1);
    });

    it('should not match partial in exact mode', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway', { matchExact: true });
      expect(result).toHaveLength(0);
    });
  });

  describe('filterLibraryItems', () => {
    const mockLibraryItems = [
      { id: 1, tabData: { title: 'Song 1', artist: 'Artist 1' } },
      { id: 2, tabData: { title: 'Song 2', artist: 'Artist 2' } },
    ] as any[];

    it('should filter library items by title', () => {
      const result = filterLibraryItems(mockLibraryItems, 'Song 1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('filterByFields', () => {
    const users = [
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    ];

    it('should filter by specified fields', () => {
      const result = filterByFields(users, 'john', ['name', 'email']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should search in multiple fields', () => {
      const result = filterByFields(users, 'example', ['name', 'email']);
      expect(result).toHaveLength(2);
    });

    it('should return all items for empty query', () => {
      const result = filterByFields(users, '', ['name']);
      expect(result).toHaveLength(2);
    });

    it('should handle case sensitivity', () => {
      const result = filterByFields(users, 'JOHN', ['name'], { caseSensitive: true });
      expect(result).toHaveLength(0);
    });
  });
});