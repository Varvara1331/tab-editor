/**
 * @fileoverview Модель для работы с табулатурами.
 * Предоставляет интерфейс к TabService для контроллеров.
 * 
 * @module models/Tab
 */

import { TabService } from '../services/tabService';
import { ITab } from '../types';

/**
 * Объект модели Tab с методами для работы с табулатурами.
 * 
 * Все методы делегируются TabService с привязкой контекста.
 * Эта прослойка обеспечивает:
 * - Единый интерфейс для контроллеров
 * - Возможность легко заменить реализацию сервиса
 * - Упрощение тестирования (можно замокать модель)
 * 
 * @public
 * 
 * @example
 * ```typescript
 * // Использование в контроллере
 * import { TabModel } from '../models/Tab';
 * 
 * // Создание новой табулатуры
 * const tab = await TabModel.create(userId, { title: 'My Song', artist: 'Me' });
 * 
 * // Получение публичных табулатур с поиском
 * const publicTabs = await TabModel.findPublicTabs(20, 0, 'rock');
 * ```
 */
export const TabModel = {
  /**
   * Создание новой табулатуры.
   * 
   * @param userId - ID владельца табулатуры
   * @param tabData - Данные новой табулатуры (title, artist, tuning, measures и т.д.)
   * @returns Созданная табулатура с автоматически сгенерированным ID
   * 
   * @example
   * ```typescript
   * const newTab = await TabModel.create(1, {
   *   title: 'Smoke on the Water',
   *   artist: 'Deep Purple',
   *   tuning: ['E', 'A', 'D', 'G', 'B', 'E']
   * });
   * ```
   */
  create: TabService.create.bind(TabService),
  
  /**
   * Поиск табулатуры по ID.
   * 
   * @param id - ID табулатуры
   * @returns Найденная табулатура или null, если не найдена
   */
  findById: TabService.findById.bind(TabService),
  
  /**
   * Получение всех табулатур пользователя.
   * Возвращает как публичные, так и приватные табулатуры пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Массив табулатур пользователя, отсортированных по дате создания (новые сверху)
   */
  findByUserId: TabService.findByUserId.bind(TabService),
  
  /**
   * Получение публичных табулатур с пагинацией и поиском.
   * 
   * @param limit - Количество записей на странице (по умолчанию 50)
   * @param offset - Смещение для пагинации (по умолчанию 0)
   * @param search - Поисковый запрос (по названию или исполнителю)
   * @returns Массив публичных табулатур с именем автора
   * 
   * @example
   * ```typescript
   * // Поиск публичных табулатур с пагинацией
   * const { data, pagination } = await TabModel.findPublicTabs(10, 0, 'beatles');
   * ```
   */
  findPublicTabs: TabService.findPublicTabs.bind(TabService),
  
  /**
   * Обновление существующей табулатуры.
   * Обновляет только переданные поля, остальные остаются без изменений.
   * 
   * @param id - ID обновляемой табулатуры
   * @param userId - ID владельца (для проверки прав)
   * @param tabData - Данные для обновления
   * @returns Обновлённая табулатура или null, если нет прав доступа
   * 
   * @example
   * ```typescript
   * // Обновление только заголовка и публичного статуса
   * const updated = await TabModel.update(1, 1, {
   *   title: 'New Title',
   *   isPublic: true
   * });
   * ```
   */
  update: TabService.update.bind(TabService),
  
  /**
   * Удаление табулатуры.
   * 
   * @param id - ID удаляемой табулатуры
   * @param userId - ID владельца (для проверки прав)
   * @returns true если удаление выполнено успешно
   */
  delete: TabService.delete.bind(TabService),
  
  /**
   * Увеличение счётчика просмотров табулатуры.
   * Используется при просмотре публичных табулатур.
   * 
   * @param id - ID табулатуры
   * 
   * @example
   * ```typescript
   * // При просмотре публичной табулатуры
   * await TabModel.incrementViews(tabId);
   * ```
   */
  incrementViews: TabService.incrementViews.bind(TabService),
} as const;

/**
 * Тип для объекта табулатуры.
 * Содержит полную информацию о табулатуре: метаданные, содержание, статистику.
 */
export type { ITab };

/**
 * Тип для объекта TabModel (все методы модели).
 * Полезен для тестирования и создания моков.
 */
export type TabModelType = typeof TabModel;

/**
 * Тип для частичного обновления табулатуры.
 * Все поля опциональны.
 */
export type TabUpdateData = Partial<Omit<ITab, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;