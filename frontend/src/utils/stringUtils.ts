/**
 * @fileoverview Утилиты для работы со строками.
 * Транслитерация, экранирование HTML/XML, санитизация имён файлов.
 * 
 * @module utils/stringUtils
 */

/**
 * Карта транслитерации для кириллических символов
 */
const TRANSLIT_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

/**
 * Транслитерация строки (перевод с кириллицы на латиницу)
 * 
 * @param str - Исходная строка
 * @returns Строка, транслитерированная на латиницу
 * 
 * @example
 * ```typescript
 * transliterate('Привет мир') // 'Privet mir'
 * transliterate('Красивая музыка') // 'Krasivaya muzyka'
 * ```
 */
export const transliterate = (str: string): string => {
  return str.replace(/[а-яё]/gi, (char) => {
    const lowerChar = char.toLowerCase();
    const translit = TRANSLIT_MAP[lowerChar] || char;
    // Сохраняем оригинальный регистр
    return char === lowerChar ? translit : translit.toUpperCase();
  });
};

/**
 * Экранирование HTML специальных символов
 * 
 * @param str - Исходная строка
 * @returns Строка с экранированными HTML символами
 * 
 * @example
 * ```typescript
 * escapeHtml('<div class="test">Hello & welcome</div>')
 * // '&lt;div class=&quot;test&quot;&gt;Hello &amp; welcome&lt;/div&gt;'
 * ```
 */
export const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Экранирование XML специальных символов
 * 
 * @param str - Исходная строка
 * @returns Строка с экранированными XML символами
 * 
 * @example
 * ```typescript
 * escapeXml('<note>It\'s a "test"</note>')
 * // '&lt;note&gt;It&apos;s a &quot;test&quot;&lt;/note&gt;'
 * ```
 */
export const escapeXml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Санитизация имени файла (удаление запрещённых символов)
 * 
 * @param filename - Исходное имя файла
 * @returns Безопасное имя файла
 * 
 * @example
 * ```typescript
 * sanitizeFilename('my:file?name*') // 'myfilename'
 * sanitizeFilename('<>:"/\\|?*') // 'untitled'
 * sanitizeFilename('My Song v1.0.gp') // 'My Song v1.0.gp'
 * ```
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'untitled';
  
  // Удаляем запрещённые символы для файловых систем Windows/Linux
  const sanitized = filename.replace(/[<>:"/\\|?*]/g, '');
  
  return sanitized.trim() || 'untitled';
};

/**
 * Обрезка строки до указанной длины с добавлением многоточия
 * 
 * @param str - Исходная строка
 * @param maxLength - Максимальная длина (по умолчанию 50)
 * @param suffix - Суффикс для обрезанной строки (по умолчанию '...')
 * @returns Обрезанная строка
 * 
 * @example
 * ```typescript
 * truncate('Очень длинное название песни', 15) // 'Очень длинное...'
 * truncate('Short', 10) // 'Short'
 * ```
 */
export const truncate = (str: string, maxLength: number = 50, suffix: string = '...'): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length).trim() + suffix;
};

/**
 * Преобразование строки в slug (для URL)
 * 
 * @param str - Исходная строка
 * @returns Slug строка (только латиница, цифры и дефисы)
 * 
 * @example
 * ```typescript
 * slugify('Моя любимая песня!') // 'moya-lyubimaya-pesnya'
 * slugify('Rock & Roll') // 'rock-roll'
 * ```
 */
export const slugify = (str: string): string => {
  if (!str) return '';
  
  return transliterate(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-')      // Пробелы в дефисы
    .replace(/--+/g, '-')      // Убираем двойные дефисы
    .trim();
};