/**
 * @fileoverview Сервис для работы с библиотекой пользователя.
 * Содержит бизнес-логику добавления, удаления и получения табулатур из библиотеки.
 * 
 * @module services/libraryService
 */

import { db } from '../database';
import { ITab, ILibraryItem, IFavoriteTab } from '../types';
import { parseJson, toBoolean } from '../utils/helpers';

/**
 * Сервис для управления библиотекой пользователя.
 * Все методы статические для простоты использования.
 * 
 * @public
 */
export class LibraryService {
  /**
   * Добавление табулатуры в библиотеку.
   * 
   * @param userId - ID пользователя
   * @param tab - Объект табулатуры
   * @param isPublication - Является ли публикацией (избранное)
   * @returns Созданный элемент библиотеки
   * 
   * @example
   * ```typescript
   * const libraryItem = await LibraryService.add(1, tab, false);
   * console.log(`Добавлено в библиотеку: ${libraryItem.id}`);
   * ```
   */
  static async add(userId: number, tab: ITab, isPublication: boolean = false): Promise<ILibraryItem> {
    const result = await db.run(
      `INSERT INTO Library (UserId, TabId, TabData, IsPublication, OriginalAuthorId, OriginalAuthorName, AddedAt) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, tab.id, JSON.stringify(tab), isPublication ? 1 : 0, tab.userId, '']
    );
    
    const item = await this.findById(result.lastID);
    return item!;
  }
  
  /**
   * Добавление публичной табулатуры в библиотеку (избранное).
   * 
   * Сохраняет имя автора из таблицы Users для отображения в избранном.
   * 
   * @param userId - ID пользователя
   * @param tab - Объект табулатуры
   * @returns Созданный элемент библиотеки
   * 
   * @example
   * ```typescript
   * const favorite = await LibraryService.addFromPublication(1, publicTab);
   * console.log(`Добавлено в избранное: ${favorite.id}`);
   * ```
   */
  static async addFromPublication(userId: number, tab: ITab): Promise<ILibraryItem> {
    const result = await db.run(
      `INSERT INTO Library (UserId, TabId, TabData, IsPublication, OriginalAuthorId, OriginalAuthorName, AddedAt) 
       VALUES (?, ?, ?, 1, ?, (SELECT Username FROM Users WHERE Id = ?), datetime('now'))`,
      [userId, tab.id, JSON.stringify(tab), tab.userId, tab.userId]
    );
    
    const item = await this.findById(result.lastID);
    return item!;
  }
  
  /**
   * Поиск элемента библиотеки по ID.
   * 
   * @param id - ID элемента библиотеки
   * @returns Элемент библиотеки или null, если не найден
   */
  static async findById(id: number): Promise<ILibraryItem | null> {
    const row = await db.get<any>('SELECT * FROM Library WHERE Id = ?', [id]);
    if (!row) return null;
    return this.mapToLibraryItem(row);
  }
  
  /**
   * Получение всех элементов библиотеки пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Массив элементов библиотеки, отсортированных по дате добавления (новые сверху)
   * 
   * @example
   * ```typescript
   * const library = await LibraryService.findByUserId(1);
   * console.log(`В библиотеке ${library.length} элементов`);
   * ```
   */
  static async findByUserId(userId: number): Promise<ILibraryItem[]> {
    const rows = await db.all<any>(
      'SELECT * FROM Library WHERE UserId = ? ORDER BY AddedAt DESC',
      [userId]
    );
    return rows.map((row: any) => this.mapToLibraryItem(row));
  }
  
  /**
   * Проверка наличия табулатуры в библиотеке пользователя.
   * 
   * @param userId - ID пользователя
   * @param tabId - ID табулатуры
   * @returns true если табулатура уже в библиотеке
   * 
   * @example
   * ```typescript
   * const exists = await LibraryService.checkExists(1, 123);
   * if (exists) {
   *   console.log('Табулатура уже в библиотеке');
   * }
   * ```
   */
  static async checkExists(userId: number, tabId: number): Promise<boolean> {
    const row = await db.get<any>('SELECT Id FROM Library WHERE UserId = ? AND TabId = ?', [userId, tabId]);
    return !!row;
  }
  
  /**
   * Удаление табулатуры из библиотеки.
   * 
   * @param userId - ID пользователя
   * @param tabId - ID табулатуры
   * @returns true если удаление выполнено успешно
   */
  static async removeFromLibrary(userId: number, tabId: number): Promise<boolean> {
    const result = await db.run('DELETE FROM Library WHERE UserId = ? AND TabId = ?', [userId, tabId]);
    return result.changes > 0;
  }
  
  /**
   * Обновление времени последнего открытия табулатуры.
   * 
   * Используется для отслеживания активности пользователя и
   * сортировки "недавно открытых" табулатур.
   * 
   * @param id - ID элемента библиотеки
   * 
   * @example
   * ```typescript
   * // При открытии табулатуры из библиотеки
   * await LibraryService.updateLastOpened(libraryItem.id);
   * ```
   */
  static async updateLastOpened(id: number): Promise<void> {
    await db.run('UPDATE Library SET LastOpened = datetime("now") WHERE Id = ?', [id]);
  }
  
  /**
   * Получение избранных табулатур пользователя с данными из Tabs.
   * 
   * Возвращает только публикации других авторов (IsPublication = 1)
   * с полными данными о табулатуре и авторе.
   * 
   * @param userId - ID пользователя
   * @returns Массив избранных табулатур, обогащённых данными автора
   * 
   * @example
   * ```typescript
   * const favorites = await LibraryService.getFavoritesByUserId(1);
   * favorites.forEach(fav => {
   *   console.log(`${fav.title} by ${fav.authorName}`);
   * });
   * ```
   */
  static async getFavoritesByUserId(userId: number): Promise<IFavoriteTab[]> {
    const rows = await db.all<any>(
      `SELECT l.*, t.Title, t.Artist, t.Tuning, t.Measures, t.IsPublic, t.Preview, t.Tags, t.CreatedAt, t.UpdatedAt, u.Username as authorName
       FROM Library l
       JOIN Tabs t ON l.TabId = t.Id
       LEFT JOIN Users u ON t.UserId = u.Id
       WHERE l.UserId = ? AND l.IsPublication = 1
       ORDER BY l.AddedAt DESC`,
      [userId]
    );
    
    return rows.map((row) => ({
      id: row.TabId,
      userId: row.UserId,
      title: row.Title,
      artist: row.Artist,
      tuning: parseJson(row.Tuning, []),
      measures: parseJson(row.Measures, []),
      notesPerMeasure: row.NotesPerMeasure || 16,
      isPublic: toBoolean(row.IsPublic),
      preview: row.Preview,
      tags: parseJson(row.Tags, []),
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      authorName: row.authorName,
      addedAt: row.AddedAt
    }));
  }
  
  /**
   * Преобразование строки из БД в объект ILibraryItem.
   * 
   * Выполняет десериализацию дат и преобразование булевых полей.
   * 
   * @param row - Строка из БД
   * @returns Объект элемента библиотеки
   * @private
   */
  private static mapToLibraryItem(row: any): ILibraryItem {
    return {
      id: row.Id,
      userId: row.UserId,
      tabId: row.TabId,
      tabData: row.TabData,
      isPublication: toBoolean(row.IsPublication),
      originalAuthorId: row.OriginalAuthorId,
      originalAuthorName: row.OriginalAuthorName,
      addedAt: new Date(row.AddedAt),
      lastOpened: row.LastOpened ? new Date(row.LastOpened) : undefined
    };
  }
}