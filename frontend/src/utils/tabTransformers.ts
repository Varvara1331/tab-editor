/**
 * @fileoverview Трансформеры для преобразования данных табулатур.
 * 
 * @module utils/tabTransformers
 */

import { TabData } from '../types/tab';
import { PublicTab } from '../services/publicTabsService';

/**
 * Ответ сервера с данными табулатуры
 */
interface TabResponse {
  id: number;
  userId: number;
  title: string;
  artist?: string;
  tuning: string[];
  measures: unknown[];
  isPublic: boolean;
  views: number;
  likes: number;
  preview?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorName?: string;
}

/**
 * Опции трансформации
 */
export interface TransformOptions {
  /** Принадлежит ли табулатура текущему пользователю */
  isOwn?: boolean;
  /** Публичный статус */
  isPublic?: boolean;
  /** ID пользователя-владельца */
  userId?: number;
}

/**
 * Данные табулатуры по умолчанию
 */
const DEFAULT_TAB_DATA: TabData = {
  id: undefined,
  title: 'Untitled',
  artist: '',
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  measures: [],
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Преобразование ответа сервера в объект TabData
 * 
 * @param tab - Ответ сервера с данными табулатуры
 * @param options - Опции трансформации
 * @returns Объект TabData для использования в редакторе
 * 
 * @example
 * ```typescript
 * const tabData = transformToTabData(response, { isPublic: true });
 * ```
 */
export const transformToTabData = (tab: TabResponse | PublicTab, options?: TransformOptions): TabData => {
  if (!tab) {
    console.error('Invalid tab data: tab is null or undefined');
    return { ...DEFAULT_TAB_DATA };
  }
  
  try {
    const baseData: TabData = {
      id: tab.id,
      userId: tab.userId,
      title: tab.title || 'Untitled',
      artist: tab.artist || '',
      tuning: Array.isArray(tab.tuning) ? [...tab.tuning] : [...DEFAULT_TAB_DATA.tuning],
      measures: Array.isArray(tab.measures) ? [...tab.measures] : [],
      createdAt: tab.createdAt ? new Date(tab.createdAt) : new Date(),
      updatedAt: tab.updatedAt ? new Date(tab.updatedAt) : new Date(),
      isPublic: 'isPublic' in tab ? tab.isPublic : true,
    };
    
    return options ? { ...baseData, ...options } : baseData;
  } catch (error) {
    console.error('Error transforming tab data:', error);
    return { ...DEFAULT_TAB_DATA };
  }
};

/**
 * Преобразование ответа сервера в элемент библиотеки
 * 
 * @param tab - Ответ сервера с данными табулатуры
 * @param options - Дополнительные опции
 * @returns Объект для хранения в библиотеке
 */
export const transformToLibraryItem = (
  tab: TabResponse, 
  options?: { isPublication?: boolean; originalAuthor?: string }
) => ({
  id: tab.id,
  tabData: transformToTabData(tab),
  lastModified: tab.updatedAt || new Date().toISOString(),
  preview: tab.preview,
  isPublication: options?.isPublication || false,
  originalAuthor: options?.originalAuthor || tab.authorName,
});

/**
 * Преобразование публичной табулатуры в TabData
 * 
 * @param tab - Публичная табулатура
 * @param currentUserId - ID текущего пользователя (опционально)
 * @returns Объект TabData для использования в редакторе
 * 
 * @example
 * ```typescript
 * const tabData = transformPublicTabToTabData(publicTab, currentUser.id);
 * ```
 */
export const transformPublicTabToTabData = (tab: PublicTab, currentUserId?: number): TabData => {
  if (!tab?.id) {
    console.error('Invalid public tab data:', tab);
    return { ...DEFAULT_TAB_DATA };
  }
  
  try {
    return transformToTabData(tab, { 
      isOwn: tab.userId === currentUserId, 
      isPublic: true, 
      userId: tab.userId 
    });
  } catch (error) {
    console.error('Error transforming public tab:', error);
    return { ...DEFAULT_TAB_DATA };
  }
};