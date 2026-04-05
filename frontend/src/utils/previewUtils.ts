/**
 * @fileoverview Утилиты для работы с превью табулатур.
 * 
 * @module utils/previewUtils
 */

/**
 * Получение текста превью для отображения
 * 
 * @param preview - Строка превью (может быть '...' если превью отсутствует)
 * @returns Текст превью или стандартное сообщение, если превью отсутствует
 * 
 * @example
 * ```typescript
 * getPreviewText('0 3 5 0 3 5') // '0 3 5 0 3 5'
 * getPreviewText('...') // 'Нет превью'
 * getPreviewText(undefined) // 'Нет превью'
 * ```
 */
export const getPreviewText = (preview?: string): string => {
  if (preview && preview !== '...') return preview;
  return 'Нет превью';
};

/**
 * Проверка наличия валидного превью
 * 
 * @param preview - Строка превью
 * @returns true если превью существует и не является заглушкой
 * 
 * @example
 * ```typescript
 * hasPreview('0 3 5 0 3 5') // true
 * hasPreview('...') // false
 * hasPreview(undefined) // false
 * ```
 */
export const hasPreview = (preview?: string): boolean => {
  return !!preview && preview !== '...';
};

/**
 * Обрезка превью до указанной длины
 * 
 * @param preview - Строка превью
 * @param maxLength - Максимальная длина (по умолчанию 20)
 * @returns Обрезанное превью с добавлением '...' если превышает длину
 * 
 * @example
 * ```typescript
 * truncatePreview('0 3 5 0 3 5 0 3 5 0 3 5', 10) // '0 3 5 0 3...'
 * ```
 */
export const truncatePreview = (preview?: string, maxLength: number = 20): string => {
  const text = getPreviewText(preview);
  if (text === 'Нет превью') return text;
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};