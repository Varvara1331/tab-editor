/**
 * @fileoverview Вспомогательные утилиты для работы с данными.
 * Функции для парсинга JSON, генерации превью, преобразования типов.
 * 
 * @module utils/helpers
 */

/**
 * Безопасный парсинг JSON с значением по умолчанию.
 * 
 * @template T - Тип возвращаемого значения
 * @param json - JSON строка для парсинга
 * @param defaultValue - Значение по умолчанию при ошибке или null
 * @returns Распарсенный объект или defaultValue
 * 
 * @example
 * ```typescript
 * const data = parseJson('{"name": "John"}', {});
 * console.log(data.name); // "John"
 * 
 * const invalid = parseJson(null, []);
 * console.log(invalid); // []
 * ```
 */
export const parseJson = <T>(json: string | null, defaultValue: T): T => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * Преобразование объекта в JSON строку.
 * 
 * @template T - Тип данных
 * @param data - Данные для преобразования
 * @returns JSON строка
 * 
 * @example
 * ```typescript
 * const jsonString = stringifyJson({ name: 'John', age: 30 });
 * console.log(jsonString); // '{"name":"John","age":30}'
 * ```
 */
export const stringifyJson = <T>(data: T): string => {
  return JSON.stringify(data);
};

/**
 * Генерация текстового превью табулатуры из первых нот.
 * 
 * Извлекает первые 8 нот из первой струны первого такта
 * и возвращает их в виде строки, где лады разделены пробелами.
 * 
 * @param measures - Массив тактов табулатуры
 * @returns Строка превью (первые 8 нот) или '...' если данных недостаточно
 * 
 * @example
 * ```typescript
 * const measures = [{
 *   strings: [{
 *     notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }, { fret: 0 }]
 *   }]
 * }];
 * const preview = generatePreview(measures);
 * console.log(preview); // "0 3 5 0"
 * ```
 */
export const generatePreview = (measures: any[]): string => {
  if (measures.length === 0) return '...';
  const firstMeasure = measures[0];
  if (!firstMeasure?.strings?.length) return '...';
  
  const firstString = firstMeasure.strings[0];
  if (!firstString?.notes?.length) return '...';
  
  return firstString.notes
    .slice(0, 8)
    .map((note: any) => note.fret !== null ? note.fret : '-')
    .join(' ');
};

/**
 * Преобразование числа в булево значение (для SQLite 0/1).
 * 
 * @param value - Числовое значение (0 или 1)
 * @returns true если value === 1
 * 
 * @example
 * ```typescript
 * toBoolean(1); // true
 * toBoolean(0); // false
 * ```
 */
export const toBoolean = (value: number): boolean => value === 1;

/**
 * Преобразование булева значения в число (для SQLite).
 * 
 * @param value - Булево значение
 * @returns 1 если true, иначе 0
 * 
 * @example
 * ```typescript
 * toNumber(true); // 1
 * toNumber(false); // 0
 * ```
 */
export const toNumber = (value: boolean): number => value ? 1 : 0;