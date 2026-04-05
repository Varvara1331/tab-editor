/**
 * @fileoverview Type guard функции для определения типа табулатуры.
 * 
 * @module utils/tabHelpers
 */

import { LibraryItem } from '../services/libraryService';
import { PublicTab } from '../services/publicTabsService';

/**
 * Проверка, является ли объект элементом библиотеки
 * 
 * @param tab - Проверяемый объект
 * @returns true если объект имеет поле tabData
 * 
 * @example
 * ```typescript
 * if (isLibraryItem(tab)) {
 *   console.log(tab.tabData.title);
 * }
 * ```
 */
export const isLibraryItem = (tab: unknown): tab is LibraryItem => {
  return tab !== null && typeof tab === 'object' && 'tabData' in tab;
};

/**
 * Проверка, является ли объект публичной табулатурой
 * 
 * @param tab - Проверяемый объект
 * @returns true если объект имеет поле title и не имеет tabData
 * 
 * @example
 * ```typescript
 * if (isPublicTab(tab)) {
 *   console.log(tab.title);
 * }
 * ```
 */
export const isPublicTab = (tab: unknown): tab is PublicTab => {
  return tab !== null && typeof tab === 'object' && 'title' in tab && !('tabData' in tab);
};

/**
 * Получение заголовка табулатуры (работает с LibraryItem и PublicTab)
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns Заголовок табулатуры
 * 
 * @example
 * ```typescript
 * const title = getTabTitle(tab);
 * ```
 */
export const getTabTitle = (tab: LibraryItem | PublicTab): string => {
  return isLibraryItem(tab) ? tab.tabData.title : tab.title;
};

/**
 * Получение имени исполнителя табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns Имя исполнителя или undefined
 */
export const getTabArtist = (tab: LibraryItem | PublicTab): string | undefined => {
  return isLibraryItem(tab) ? tab.tabData.artist : tab.artist;
};

/**
 * Получение строя табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns Массив нот строя
 */
export const getTabTuning = (tab: LibraryItem | PublicTab): string[] => {
  return isLibraryItem(tab) ? tab.tabData.tuning : tab.tuning;
};

/**
 * Получение тактов табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns Массив тактов
 */
export const getTabMeasures = (tab: LibraryItem | PublicTab): unknown[] => {
  return isLibraryItem(tab) ? tab.tabData.measures : tab.measures;
};

/**
 * Получение даты табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @param type - Тип табулатуры ('my' | 'favorites' | 'public')
 * @returns Строка с датой в ISO формате
 */
export const getTabDate = (tab: LibraryItem | PublicTab, type: 'my' | 'favorites' | 'public'): string => {
  if (isLibraryItem(tab)) {
    return tab.lastModified || new Date().toISOString();
  }
  return tab.createdAt || new Date().toISOString();
};

/**
 * Получение превью табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns Строка превью или undefined
 */
export const getTabPreview = (tab: LibraryItem | PublicTab): string | undefined => {
  return tab.preview;
};

/**
 * Получение публичного статуса табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns true если табулатура публичная
 */
export const getIsPublicFromTab = (tab: LibraryItem | PublicTab): boolean => {
  return isLibraryItem(tab) ? (tab.tabData.isPublic || false) : true;
};

/**
 * Получение ID табулатуры
 * 
 * @param tab - Элемент библиотеки или публичная табулатура
 * @returns ID табулатуры
 */
export const getTabId = (tab: LibraryItem | PublicTab): number => {
  return tab.id;
};