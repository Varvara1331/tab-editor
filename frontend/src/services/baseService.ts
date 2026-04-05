/**
 * @fileoverview Базовый сервис для CRUD операций.
 * Предоставляет общие методы для работы с API ресурсами.
 * 
 * @module services/baseService
 */

import { api, ApiResponse } from './api';
import { getErrorMessage } from './errors';

/**
 * Объект с идентификатором
 */
export interface Identifiable {
  /** Уникальный идентификатор */
  id: number;
}

/**
 * Базовый сервис для работы с API ресурсами
 * 
 * @template T - Тип данных, должен иметь поле id
 * 
 * @example
 * ```typescript
 * interface User extends Identifiable {
 *   name: string;
 *   email: string;
 * }
 * 
 * const userService = new BaseService<User>('/users');
 * const users = await userService.getAll();
 * ```
 */
export class BaseService<T extends Identifiable> {
  /** Базовый путь API для ресурса */
  protected readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Получение всех записей
   * 
   * @returns Массив записей или пустой массив при ошибке
   */
  async getAll(): Promise<T[]> {
    try {
      const response = await api.get<ApiResponse<T[]>>(this.basePath);
      return response.data.success ? response.data.data || [] : [];
    } catch (error) {
      console.error(`Error fetching ${this.basePath}:`, error);
      return [];
    }
  }

  /**
   * Получение записи по ID
   * 
   * @param id - ID записи
   * @returns Запись или null при ошибке
   */
  async getById(id: number): Promise<T | null> {
    if (!this.isValidId(id)) return null;
    
    try {
      const response = await api.get<ApiResponse<T>>(`${this.basePath}/${id}`);
      return response.data.success ? response.data.data || null : null;
    } catch (error) {
      console.error(`Error fetching ${this.basePath}/${id}:`, error);
      return null;
    }
  }

  /**
   * Создание новой записи
   * 
   * @param data - Данные для создания (без id)
   * @returns Созданная запись или null при ошибке
   */
  async create(data: Omit<T, 'id'>): Promise<T | null> {
    try {
      const response = await api.post<ApiResponse<T>>(this.basePath, data);
      return response.data.success ? response.data.data || null : null;
    } catch (error) {
      console.error(`Error creating ${this.basePath}:`, error);
      return null;
    }
  }

  /**
   * Обновление существующей записи
   * 
   * @param id - ID записи
   * @param data - Данные для обновления
   * @returns Обновлённая запись или null при ошибке
   */
  async update(id: number, data: Partial<T>): Promise<T | null> {
    if (!this.isValidId(id)) return null;
    
    try {
      const response = await api.put<ApiResponse<T>>(`${this.basePath}/${id}`, data);
      return response.data.success ? response.data.data || null : null;
    } catch (error) {
      console.error(`Error updating ${this.basePath}/${id}:`, error);
      return null;
    }
  }

  /**
   * Удаление записи
   * 
   * @param id - ID записи
   * @returns true при успешном удалении, false при ошибке
   */
  async delete(id: number): Promise<boolean> {
    if (!this.isValidId(id)) return false;
    
    try {
      const response = await api.delete<ApiResponse>(`${this.basePath}/${id}`);
      return response.data.success === true;
    } catch (error) {
      console.error(`Error deleting ${this.basePath}/${id}:`, error);
      return false;
    }
  }

  /**
   * Проверка валидности ID
   * 
   * @param id - Проверяемый ID
   * @returns true если ID валиден
   * @protected
   */
  protected isValidId(id: number): boolean {
    return typeof id === 'number' && !isNaN(id) && id > 0;
  }
}