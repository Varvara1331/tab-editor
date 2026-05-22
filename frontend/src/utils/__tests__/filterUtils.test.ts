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
    it('должен фильтровать по названию', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Stairway to Heaven');
    });

    it('должен фильтровать по имени исполнителя', () => {
      const result = filterBySearchQuery(mockItems, 'Purple');
      expect(result).toHaveLength(1);
      expect(result[0].artist).toBe('Deep Purple');
    });

    it('должен быть нечувствительным к регистру по умолчанию', () => {
      const result = filterBySearchQuery(mockItems, 'STAIRWAY');
      expect(result).toHaveLength(1);
    });

    it('должен учитывать регистр при включенной опции caseSensitive', () => {
      const result = filterBySearchQuery(mockItems, 'STAIRWAY', { caseSensitive: true });
      expect(result).toHaveLength(0);
    });

    it('должен возвращать все элементы для пустого запроса', () => {
      const result = filterBySearchQuery(mockItems, '');
      expect(result).toHaveLength(3);
    });

    it('должен возвращать пустой массив при отсутствии совпадений', () => {
      const result = filterBySearchQuery(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('должен поддерживать режим точного совпадения', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway to Heaven', { matchExact: true });
      expect(result).toHaveLength(1);
    });

    it('не должен находить частичные совпадения в режиме точного совпадения', () => {
      const result = filterBySearchQuery(mockItems, 'Stairway', { matchExact: true });
      expect(result).toHaveLength(0);
    });
  });

  describe('filterLibraryItems', () => {
    const mockLibraryItems = [
      { id: 1, tabData: { title: 'Song 1', artist: 'Artist 1' } },
      { id: 2, tabData: { title: 'Song 2', artist: 'Artist 2' } },
    ] as any[];

    it('должен фильтровать элементы библиотеки по названию', () => {
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

    it('должен фильтровать по указанным полям', () => {
      const result = filterByFields(users, 'john', ['name', 'email']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('должен выполнять поиск по нескольким полям', () => {
      const result = filterByFields(users, 'example', ['name', 'email']);
      expect(result).toHaveLength(2);
    });

    it('должен возвращать все элементы для пустого запроса', () => {
      const result = filterByFields(users, '', ['name']);
      expect(result).toHaveLength(2);
    });

    it('должен обрабатывать чувствительность к регистру', () => {
      const result = filterByFields(users, 'JOHN', ['name'], { caseSensitive: true });
      expect(result).toHaveLength(0);
    });
  });
});