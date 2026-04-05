/**
 * @fileoverview Модель для работы с библиотекой пользователя.
 * Предоставляет интерфейс к LibraryService для контроллеров.
 * 
 * @module models/Library
 */

import { LibraryService } from '../services/libraryService';
import { ILibraryItem, IFavoriteTab } from '../types';

/**
 * Объект модели Library с методами для работы с библиотекой пользователя.
 * 
 * Все методы делегируются LibraryService с привязкой контекста.
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
 * import { LibraryModel } from '../models/Library';
 * 
 * // Получение всех элементов библиотеки пользователя
 * const library = await LibraryModel.findByUserId(userId);
 * 
 * // Проверка наличия табулатуры в библиотеке
 * const exists = await LibraryModel.checkExists(userId, tabId);
 * ```
 */
export const LibraryModel = {
  /**
   * Добавление табулатуры в библиотеку.
   * 
   * @param userId - ID пользователя
   * @param tab - Объект табулатуры
   * @param isPublication - Является ли публикацией (избранное)
   * @returns Созданный элемент библиотеки
   */
  add: LibraryService.add.bind(LibraryService),
  
  /**
   * Добавление публичной табулатуры в библиотеку (избранное).
   * Автоматически сохраняет имя автора из таблицы Users.
   * 
   * @param userId - ID пользователя
   * @param tab - Объект табулатуры
   * @returns Созданный элемент библиотеки
   */
  addFromPublication: LibraryService.addFromPublication.bind(LibraryService),
  
  /**
   * Поиск элемента библиотеки по ID.
   * 
   * @param id - ID элемента библиотеки
   * @returns Элемент библиотеки или null, если не найден
   */
  findById: LibraryService.findById.bind(LibraryService),
  
  /**
   * Получение всей библиотеки пользователя.
   * Возвращает все табулатуры, добавленные пользователем,
   * включая как собственные, так и публикации других авторов.
   * 
   * @param userId - ID пользователя
   * @returns Массив элементов библиотеки, отсортированных по дате добавления (новые сверху)
   */
  findByUserId: LibraryService.findByUserId.bind(LibraryService),
  
  /**
   * Проверка наличия табулатуры в библиотеке пользователя.
   * 
   * @param userId - ID пользователя
   * @param tabId - ID табулатуры
   * @returns true если табулатура уже добавлена в библиотеку
   */
  checkExists: LibraryService.checkExists.bind(LibraryService),
  
  /**
   * Удаление табулатуры из библиотеки.
   * 
   * @param userId - ID пользователя
   * @param tabId - ID табулатуры
   * @returns true если удаление выполнено успешно
   */
  removeFromLibrary: LibraryService.removeFromLibrary.bind(LibraryService),
  
  /**
   * Обновление времени последнего открытия табулатуры.
   * Используется для отслеживания активности пользователя.
   * 
   * @param id - ID элемента библиотеки
   */
  updateLastOpened: LibraryService.updateLastOpened.bind(LibraryService),
  
  /**
   * Получение избранных табулатур пользователя.
   * Возвращает только публикации других авторов (IsPublication = 1).
   * 
   * @param userId - ID пользователя
   * @returns Массив избранных табулатур с данными об авторе
   */
  getFavoritesByUserId: LibraryService.getFavoritesByUserId.bind(LibraryService),
} as const;

/**
 * Тип для элемента библиотеки.
 * Содержит полную информацию о добавленной табулатуре.
 */
export type { ILibraryItem, IFavoriteTab };

/**
 * Тип для объекта LibraryModel (все методы модели).
 */
export type LibraryModelType = typeof LibraryModel;