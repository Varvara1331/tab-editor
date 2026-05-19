/**
 * @fileoverview Хуки для дебаунсинга (задержки выполнения операций).
 * Полезен для оптимизации поиска, валидации и других частых операций.
 * 
 * @module hooks/useDebounce
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Опции для хука useDebounce
 */
export interface UseDebounceOptions {
  /** Задержка в миллисекундах */
  delay: number;
  /** Выполнить немедленно при первом вызове (по умолчанию false) */
  immediate?: boolean;
}

/**
 * Хук для дебаунсинга значения.
 * Возвращает значение, которое обновляется только после указанной задержки.
 * Полезно для оптимизации поисковых запросов, валидации форм и других частых операций.
 * 
 * @typeParam T - Тип дебаунсируемого значения
 * @param value - Значение для дебаунсинга
 * @param delay - Задержка в миллисекундах
 * @param immediate - Выполнить немедленно при первом вызове (по умолчанию false)
 * @returns Дебаунсированное значение
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 * 
 *   return (
 *     <input
 *       type="text"
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Поиск..."
 *     />
 *   );
 * }
 * ```
 */
export const useDebounce = <T>(value: T, delay: number, immediate: boolean = false): T => {
  /** Дебаунсированное значение */
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (immediate && isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => setDebouncedValue(value), delay);
    
    return () => clearTimeout(handler);
  }, [value, delay, immediate]);

  return debouncedValue;
};

/**
 * Хук для дебаунсинга callback функции.
 * Возвращает функцию, которая вызывает оригинальный callback только после указанной задержки.
 * 
 * @typeParam T - Тип callback функции
 * @param callback - Функция для дебаунсинга
 * @param delay - Задержка в миллисекундах
 * @returns Дебаунсированная версия callback
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const handleSearch = useDebouncedCallback((query: string) => {
 *     api.search(query);
 *   }, 500);
 * 
 *   return (
 *     <input
 *       type="text"
 *       onChange={(e) => handleSearch(e.target.value)}
 *       placeholder="Поиск..."
 *     />
 *   );
 * }
 * ```
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export default useDebounce;