/**
 * @fileoverview Менеджер импорта табулатур из файлов.
 * Поддерживает форматы JSON, Guitar Pro JSON и MusicXML.
 * 
 * @module utils/importUtils
 */

import { TabData } from '../../types/tab';
import { validateFile, readFileAsText, getFileExtension, isGpJsonFile } from '../fileUtils';

/**
 * Результат импорта файла
 */
export interface ImportResult {
  /** Успешен ли импорт */
  success: boolean;
  /** Импортированные данные табулатуры (при успехе) */
  tabData?: TabData;
  /** Сообщение об ошибке (при неудаче) */
  error?: string;
  /** Формат исходного файла */
  format?: string;
}

/**
 * Импорт табулатуры из файла
 * 
 * @param file - Файл для импорта
 * @returns Promise с результатом импорта
 * 
 * @example
 * ```typescript
 * const result = await importTabFromFile(file);
 * if (result.success) {
 *   console.log(`Импортировано: ${result.tabData?.title}`);
 * } else {
 *   console.error(`Ошибка: ${result.error}`);
 * }
 * ```
 */
export const importTabFromFile = async (file: File): Promise<ImportResult> => {
  const validation = validateFile(file, { extensions: ['json', 'gp.json', 'musicxml', 'xml'], maxSizeMB: 10 });
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const isGpJson = isGpJsonFile(file.name);
  const extension = getFileExtension(file.name);

  try {
    const content = await readFileAsText(file);
    
    if (isGpJson || extension === 'gpjson') {
      const { importFromGpJson } = await import('./importParsers');
      const tabData = importFromGpJson(content);
      return { success: true, tabData, format: 'Guitar Pro JSON' };
    } 
    
    if (extension === 'json') {
      const { importFromJson } = await import('./importParsers');
      const parsedData = JSON.parse(content);
      const tuningLength = parsedData.tuning?.length || 6;
      const tabData = importFromJson(content, tuningLength);
      return { success: true, tabData, format: 'JSON' };
    } 
    
    if (extension === 'musicxml' || extension === 'xml') {
      const { importFromMusicXML } = await import('./importParsers');
      const tabData = await importFromMusicXML(content);
      return { success: true, tabData, format: 'MusicXML' };
    } 
    
    return { 
      success: false, 
      error: 'Неподдерживаемый формат файла. Используйте .json, .gp.json или .musicxml' 
    };
  } catch (error) {
    console.error('Import error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка при импорте файла' 
    };
  }
};

/**
 * Проверка, можно ли импортировать файл
 * 
 * @param file - Файл для проверки
 * @returns true если файл можно импортировать
 * 
 * @example
 * ```typescript
 * if (canImportFile(file)) {
 *   // Показать кнопку импорта
 * }
 * ```
 */
export const canImportFile = (file: File): boolean => {
  const validation = validateFile(file, { extensions: ['json', 'gp.json', 'musicxml', 'xml'], maxSizeMB: 10 });
  return validation.valid;
};