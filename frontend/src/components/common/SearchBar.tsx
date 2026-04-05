/**
 * @fileoverview Компонент строки поиска с дебаунсингом.
 * Предоставляет поле ввода с иконкой, кнопкой очистки и задержкой ввода.
 * 
 * @module components/common/SearchBar
 */

import React, { useCallback, useRef, useEffect, memo, useState } from 'react';

/**
 * Свойства компонента SearchBar
 */
interface SearchBarProps {
  /** Текущее значение поиска */
  value: string;
  /** Функция обратного вызова при изменении значения */
  onChange: (value: string) => void;
  /** Функция обратного вызова при очистке поля */
  onClear?: () => void;
  /** Плейсхолдер поля ввода (по умолчанию 'Поиск...') */
  placeholder?: string;
  /** Задержка дебаунсинга в миллисекундах (по умолчанию 300) */
  debounceDelay?: number;
  /** Автофокус при монтировании (по умолчанию false) */
  autoFocus?: boolean;
}

/**
 * Компонент строки поиска с дебаунсингом.
 * Предотвращает слишком частые вызовы onChange при быстром вводе.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент поиска
 * 
 * @example
 * ```typescript
 * function SearchExample() {
 *   const [query, setQuery] = useState('');
 *   
 *   return (
 *     <SearchBar
 *       value={query}
 *       onChange={setQuery}
 *       placeholder="Поиск табулатур..."
 *       debounceDelay={500}
 *     />
 *   );
 * }
 * ```
 */
const SearchBar: React.FC<SearchBarProps> = memo(({
  value,
  onChange,
  onClear,
  placeholder = 'Поиск...',
  debounceDelay = 300,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Дебаунсированный вызов onChange
   */
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceDelay);
    },
    [onChange, debounceDelay]
  );

  // Синхронизация внешнего значения с локальным
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Обработчик изменения значения
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  /**
   * Обработчик очистки поля
   */
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear?.();
    // Возвращаем фокус на поле ввода после очистки
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange, onClear]);

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="search-wrapper">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className="search-input"
        autoComplete="off"
        aria-label="Поиск"
      />
      {localValue && onClear && (
        <button
          className="search-clear"
          onClick={handleClear}
          type="button"
          aria-label="Очистить поле поиска"
        >
          ×
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;