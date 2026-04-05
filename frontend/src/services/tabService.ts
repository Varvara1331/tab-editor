/**
 * @fileoverview Сервис для работы с табулатурами пользователя.
 * Предоставляет методы для CRUD операций и работы с избранным.
 * 
 * @module services/tabService
 */

import { BaseService } from './baseService';
import { api, ApiResponse } from './api';
import { TabData } from '../types/tab';

/**
 * Ответ сервера с данными табулатуры
 */
export interface TabResponse {
  /** ID табулатуры */
  id: number;
  /** ID пользователя-владельца */
  userId: number;
  /** Название */
  title: string;
  /** Исполнитель */
  artist?: string;
  /** Строй гитары */
  tuning: string[];
  /** Такты табулатуры */
  measures: any[];
  /** Количество нот в такте */
  notesPerMeasure?: number;
  /** Публичный статус */
  isPublic: boolean;
  /** Количество просмотров */
  views: number;
  /** Количество лайков */
  likes: number;
  /** Текстовое превью */
  preview?: string;
  /** Теги */
  tags?: string[];
  /** Дата создания */
  createdAt: string;
  /** Дата обновления */
  updatedAt: string;
  /** Имя автора (для публичных табулатур) */
  authorName?: string;
}

/**
 * Ответ сервера с избранной табулатурой
 */
export interface FavoriteTabResponse extends TabResponse {
  /** Дата добавления в избранное */
  addedAt: string;
}

/**
 * Преобразование TabData в формат для отправки на сервер
 * 
 * @param tabData - Данные табулатуры
 * @returns Объект для отправки на сервер
 * @private
 */
const tabDataToRequest = (tabData: TabData): any => ({
  title: tabData.title,
  artist: tabData.artist,
  tuning: tabData.tuning,
  measures: tabData.measures,
  notesPerMeasure: tabData.notesPerMeasure || 16,
  isPublic: tabData.isPublic,
  tags: [],
});

/**
 * Сервис для работы с табулатурами пользователя
 */
class TabService extends BaseService<TabResponse> {
  constructor() {
    super('/tabs');
  }

  /**
   * Получение всех табулатур текущего пользователя
   * 
   * @returns Массив табулатур пользователя
   */
  async getUserTabs(): Promise<TabResponse[]> {
    return this.getAll();
  }

  /**
   * Получение всех табулатур (переопределение базового метода)
   * 
   * @returns Массив табулатур
   */
  async getAll(): Promise<TabResponse[]> {
    try {
      const response = await api.get<ApiResponse<TabResponse[]>>(this.basePath);
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      console.error(`Error fetching ${this.basePath}:`, error);
      return [];
    }
  }

  /**
   * Получение избранных табулатур пользователя
   * 
   * @returns Массив избранных табулатур
   */
  async getFavorites(): Promise<FavoriteTabResponse[]> {
    try {
      const response = await api.get<{ success: boolean; data: FavoriteTabResponse[] }>(
        `${this.basePath}/favorites`
      );
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  /**
   * Сохранение табулатуры (создание или обновление)
   * 
   * @param tabData - Данные табулатуры
   * @returns Сохранённая табулатура или null при ошибке
   */
  async saveTab(tabData: TabData): Promise<TabResponse | null> {
    if (!this.isValidTabData(tabData)) {
      console.error('Invalid tab data for saving');
      return null;
    }
    
    const requestData = tabDataToRequest(tabData);
    
    if (tabData.id) {
      return this.update(tabData.id, requestData);
    } else {
      return this.create(requestData);
    }
  }

  /**
   * Проверка валидности данных табулатуры
   * 
   * @param data - Данные для проверки
   * @returns true если данные валидны
   * @private
   */
  private isValidTabData(data: TabData): boolean {
    return !!(data && data.title);
  }
}

/** Экземпляр сервиса табулатур */
export const tabService = new TabService();