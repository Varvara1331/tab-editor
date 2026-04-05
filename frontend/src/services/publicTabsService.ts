/**
 * @fileoverview Сервис для работы с публичными табулатурами.
 * Предоставляет методы для получения публикаций и управления избранным.
 * 
 * @module services/publicTabsService
 */

import { api, PaginatedApiResponse } from './api';
import { BaseService } from './baseService';
import { TabResponse } from './tabService';

/**
 * Публичная табулатура
 */
export interface PublicTab extends TabResponse {
  /** Флаг, добавлена ли в библиотеку текущего пользователя */
  isInLibrary?: boolean;
}

/**
 * Параметры запроса публичных табулатур
 */
export interface GetPublicTabsParams {
  /** Поисковый запрос (по названию или исполнителю) */
  search?: string;
  /** Количество записей на странице */
  limit?: number;
  /** Смещение для пагинации */
  offset?: number;
}

/**
 * Сервис для работы с публичными табулатурами
 */
class PublicTabsService extends BaseService<PublicTab> {
  constructor() {
    super('/public-tabs');
  }

  /**
   * Получение списка публичных табулатур с пагинацией и поиском
   * 
   * @param params - Параметры запроса
   * @returns Массив публичных табулатур
   * 
   * @example
   * ```typescript
   * const tabs = await publicTabsService.getPublicTabs({
   *   search: 'rock',
   *   limit: 20,
   *   offset: 0
   * });
   * ```
   */
  async getPublicTabs(params: GetPublicTabsParams = {}): Promise<PublicTab[]> {
    const { search, limit = 50, offset = 0 } = params;
    const queryParams: Record<string, string | number> = { limit, offset };
    if (search?.trim()) queryParams.search = search.trim();

    try {
      const response = await api.get<PaginatedApiResponse<PublicTab>>(this.basePath, { params: queryParams });
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      console.error('Error fetching public tabs:', error);
      return [];
    }
  }

  /**
   * Добавление публичной табулатуры в библиотеку (избранное)
   * 
   * @param tabId - ID табулатуры
   * @returns true при успешном добавлении
   */
  async addToLibrary(tabId: number): Promise<boolean> {
    if (!this.isValidId(tabId)) return false;
    
    try {
      const response = await api.post(`${this.basePath}/${tabId}/library`);
      return response.data.success === true;
    } catch (error: any) {
      // Если табулатура уже добавлена, считаем успехом
      if (error.response?.data?.error === 'Табулатура уже добавлена в библиотеку') {
        return true;
      }
      console.error('Error adding to library:', error);
      return false;
    }
  }

  /**
   * Удаление публичной табулатуры из библиотеки
   * 
   * @param tabId - ID табулатуры
   * @returns true при успешном удалении
   */
  async removeFromLibrary(tabId: number): Promise<boolean> {
    if (!this.isValidId(tabId)) return false;
    
    try {
      const response = await api.delete(`${this.basePath}/${tabId}/library`);
      return response.data.success === true;
    } catch (error) {
      console.error('Error removing from library:', error);
      return false;
    }
  }

  /**
   * Проверка, добавлена ли табулатура в библиотеку
   * 
   * @param tabId - ID табулатуры
   * @returns true если табулатура в библиотеке
   */
  async checkInLibrary(tabId: number): Promise<boolean> {
    if (!this.isValidId(tabId)) return false;
    
    try {
      const response = await api.get<{ success: boolean; data: { exists: boolean } }>(
        `${this.basePath}/${tabId}/library/check`
      );
      return response.data.success ? response.data.data?.exists || false : false;
    } catch (error) {
      console.error('Error checking library:', error);
      return false;
    }
  }

  /**
   * Скачивание публичной табулатуры
   * 
   * @param tabId - ID табулатуры
   * @returns Данные табулатуры или null при ошибке
   */
  async downloadTab(tabId: number): Promise<PublicTab | null> {
    return this.getById(tabId);
  }
}

/** Экземпляр сервиса публичных табулатур */
export const publicTabsService = new PublicTabsService();