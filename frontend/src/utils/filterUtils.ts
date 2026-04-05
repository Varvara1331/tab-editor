/**
 * @fileoverview Утилиты для фильтрации массивов по поисковому запросу.
 * 
 * @module utils/filterUtils
 */

import { LibraryItem } from '../services/libraryService';
import { PublicTab } from '../services/publicTabsService';

/**
 * Объект, который можно искать по заголовку и исполнителю
 */
export interface Searchable {
  /** Заголовок */
  title: string;
  /** Исполнитель (опционально) */
  artist?: string | null;
}

/**
 * Опции для фильтрации
 */
export interface FilterOptions {
  /** Учитывать регистр (по умолчанию false) */
  caseSensitive?: boolean;
  /** Обрезать пробелы в запросе (по умолчанию true) */
  trimQuery?: boolean;
  /** Точное совпадение (по умолчанию false) */
  matchExact?: boolean;
}

/**
 * Фильтрация элементов по поисковому запросу
 * 
 * @param items - Массив элементов для фильтрации
 * @param query - Поисковый запрос
 * @param options - Опции фильтрации
 * @returns Отфильтрованный массив элементов
 * 
 * @example
 * ```typescript
 * const songs = [
 *   { title: 'Smoke on the Water', artist: 'Deep Purple' },
 *   { title: 'Stairway to Heaven', artist: 'Led Zeppelin' }
 * ];
 * 
 * filterBySearchQuery(songs, 'purple') // ['Smoke on the Water']
 * filterBySearchQuery(songs, 'STAIRWAY', { caseSensitive: true }) // []
 * ```
 */
export const filterBySearchQuery = <T extends Searchable>(
  items: T[],
  query: string,
  options: FilterOptions = {}
): T[] => {
  // Пустой запрос - возвращаем все элементы
  if (!query?.trim()) return items;
  
  // Подготовка поискового запроса
  let searchQuery = options.trimQuery !== false ? query.trim() : query;
  if (!options.caseSensitive) searchQuery = searchQuery.toLowerCase();
  
  // Фильтрация
  return items.filter((item) => {
    let title = item.title;
    let artist = item.artist || '';
    
    if (!options.caseSensitive) {
      title = title.toLowerCase();
      artist = artist.toLowerCase();
    }
    
    if (options.matchExact) {
      return title === searchQuery || artist === searchQuery;
    }
    
    return title.includes(searchQuery) || artist.includes(searchQuery);
  });
};

/**
 * Фильтрация элементов библиотеки
 * 
 * @param items - Массив элементов библиотеки
 * @param query - Поисковый запрос
 * @param options - Опции фильтрации
 * @returns Отфильтрованный массив элементов библиотеки
 * 
 * @example
 * ```typescript
 * const filtered = filterLibraryItems(libraryItems, 'rock', { matchExact: false });
 * ```
 */
export const filterLibraryItems = (
  items: LibraryItem[], 
  query: string, 
  options?: FilterOptions
): LibraryItem[] => {
  const searchableItems = items.map((item) => ({ 
    ...item, 
    title: item.tabData.title, 
    artist: item.tabData.artist 
  }));
  return filterBySearchQuery(searchableItems, query, options) as LibraryItem[];
};

/**
 * Фильтрация публичных табулатур
 * 
 * @param tabs - Массив публичных табулатур
 * @param query - Поисковый запрос
 * @param options - Опции фильтрации
 * @returns Отфильтрованный массив публичных табулатур
 * 
 * @example
 * ```typescript
 * const filtered = filterPublicTabs(publicTabs, 'beatles', { caseSensitive: false });
 * ```
 */
export const filterPublicTabs = (tabs: PublicTab[], query: string, options?: FilterOptions): PublicTab[] => {
  return filterBySearchQuery(tabs, query, options);
};

/**
 * Универсальная фильтрация по указанным полям
 * 
 * @param items - Массив объектов для фильтрации
 * @param query - Поисковый запрос
 * @param fields - Массив полей для поиска
 * @param options - Опции фильтрации
 * @returns Отфильтрованный массив объектов
 * 
 * @example
 * ```typescript
 * const users = [
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * ];
 * 
 * filterByFields(users, 'john', ['name', 'email']) // [{ name: 'John', ... }]
 * ```
 */
export const filterByFields = <T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  options?: FilterOptions
): T[] => {
  if (!query?.trim()) return items;
  
  // Подготовка поискового запроса
  let searchQuery = options?.trimQuery !== false ? query.trim() : query;
  if (!options?.caseSensitive) searchQuery = searchQuery.toLowerCase();
  
  // Фильтрация по указанным полям
  return items.filter((item) => fields.some((field) => {
    const value = item[field];
    if (!value) return false;
    
    let strValue = String(value);
    if (!options?.caseSensitive) strValue = strValue.toLowerCase();
    
    if (options?.matchExact) {
      return strValue === searchQuery;
    }
    return strValue.includes(searchQuery);
  }));
};