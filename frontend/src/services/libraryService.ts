/**
 * @fileoverview Сервис для работы с библиотекой пользователя.
 * Управляет сохранёнными табулатурами и избранным.
 * 
 * @module services/libraryService
 */

import { TabData } from '../types/tab';
import { tabService, TabResponse } from './tabService';
import { publicTabsService, PublicTab } from './publicTabsService';

/**
 * Элемент библиотеки пользователя
 */
export interface LibraryItem {
  /** ID элемента */
  id: number;
  /** Данные табулатуры */
  tabData: TabData;
  /** Дата последнего изменения */
  lastModified: string;
  /** Текстовое превью */
  preview?: string;
  /** Является ли публикацией (избранное) */
  isPublication?: boolean;
  /** Оригинальный автор (для избранного) */
  originalAuthor?: string;
}

/**
 * Опции трансформации табулатуры в элемент библиотеки
 */
export interface TransformOptions {
  /** Является ли публикацией */
  isPublication?: boolean;
  /** Имя оригинального автора */
  originalAuthor?: string;
}

/**
 * Преобразование ответа сервера в элемент библиотеки
 * 
 * @param tab - Ответ сервера с данными табулатуры
 * @param options - Опции трансформации
 * @returns Элемент библиотеки
 * @private
 */
const transformToLibraryItem = (tab: TabResponse, options?: TransformOptions): LibraryItem => ({
  id: tab.id,
  tabData: {
    id: tab.id,
    userId: tab.userId,
    title: tab.title,
    artist: tab.artist,
    tuning: tab.tuning,
    measures: tab.measures,
    notesPerMeasure: tab.notesPerMeasure || 16,
    isPublic: tab.isPublic,
    createdAt: new Date(tab.createdAt),
    updatedAt: new Date(tab.updatedAt),
  },
  lastModified: tab.updatedAt || new Date().toISOString(),
  preview: tab.preview,
  isPublication: options?.isPublication || false,
  originalAuthor: options?.originalAuthor || tab.authorName,
});

/**
 * Сохранение табулатуры в библиотеку
 * 
 * @param tabData - Данные табулатуры
 * @returns true при успешном сохранении
 */
export const saveToLibrary = async (tabData: TabData): Promise<boolean> => {
  const savedTab = await tabService.saveTab(tabData);
  return savedTab !== null;
};

/**
 * Получение всех элементов библиотеки пользователя
 * 
 * @returns Массив элементов библиотеки
 */
export const getLibrary = async (): Promise<LibraryItem[]> => {
  const tabs = await tabService.getUserTabs();
  return tabs.map((tab) => transformToLibraryItem(tab, { isPublication: false }));
};

/**
 * Получение избранных табулатур пользователя
 * 
 * @returns Массив избранных табулатур
 */
export const getFavorites = async (): Promise<LibraryItem[]> => {
  const favorites = await tabService.getFavorites();
  return favorites.map((tab) =>
    transformToLibraryItem(tab, { isPublication: true, originalAuthor: tab.authorName })
  );
};

/**
 * Добавление табулатуры в избранное
 * 
 * @param tabId - ID табулатуры
 * @returns true при успешном добавлении
 */
export const addToFavorites = async (tabId: number): Promise<boolean> => {
  return publicTabsService.addToLibrary(tabId);
};

/**
 * Удаление табулатуры из избранного
 * 
 * @param tabId - ID табулатуры
 * @returns true при успешном удалении
 */
export const removeFromFavorites = async (tabId: number): Promise<boolean> => {
  return publicTabsService.removeFromLibrary(tabId);
};

/**
 * Проверка, находится ли табулатура в избранном
 * 
 * @param tabId - ID табулатуры
 * @returns true если в избранном
 */
export const checkInFavorites = async (tabId: number): Promise<boolean> => {
  return publicTabsService.checkInLibrary(tabId);
};

/**
 * Удаление табулатуры из библиотеки
 * 
 * @param id - ID табулатуры
 * @returns true при успешном удалении
 */
export const removeFromLibrary = async (id: number): Promise<boolean> => {
  return tabService.delete(id);
};

/**
 * Обновление табулатуры в библиотеке
 * 
 * @param id - ID табулатуры
 * @param tabData - Новые данные табулатуры
 * @returns true при успешном обновлении
 */
export const updateInLibrary = async (id: number, tabData: TabData): Promise<boolean> => {
  const requestData = {
    title: tabData.title,
    artist: tabData.artist,
    tuning: tabData.tuning,
    measures: tabData.measures,
    notesPerMeasure: tabData.notesPerMeasure || 16,
    isPublic: tabData.isPublic,
  };
  const updated = await tabService.update(id, requestData);
  return updated !== null;
};