/**
 * @fileoverview Сервис для управления табулатурами.
 * Содержит бизнес-логику создания, чтения, обновления, удаления табулатур,
 * а также работу с публичными табулатурами и счётчиками просмотров.
 * 
 * @module services/tabService
 */

import { db } from '../database';
import { ITab } from '../types';
import { parseJson, stringifyJson, generatePreview, toNumber, toBoolean } from '../utils/helpers';

/**
 * Стандартный строй гитары по умолчанию (E A D G B E)
 */
const DEFAULT_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

/**
 * Сервис для работы с табулатурами.
 * Все методы статические, предоставляют CRUD операции и дополнительные функции.
 * 
 * @public
 */
export class TabService {
  /**
   * Создание новой табулатуры.
   * 
   * @param userId - ID владельца табулатуры
   * @param tabData - Данные новой табулатуры
   * @returns Промис с созданной табулатурой
   * 
   * @example
   * ```typescript
   * const newTab = await TabService.create(1, {
   *   title: 'My Song',
   *   artist: 'Me',
   *   tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
   *   measures: [...]
   * });
   * console.log(`Создана табулатура: ${newTab.title}`);
   * ```
   */
  static async create(userId: number, tabData: Partial<ITab>): Promise<ITab> {
    // Сериализация JSON полей для хранения в SQLite
    const tuning = stringifyJson(tabData.tuning || DEFAULT_TUNING);
    const measures = stringifyJson(tabData.measures || []);
    const tags = stringifyJson(tabData.tags || []);
    const preview = generatePreview(tabData.measures || []);
    const notesPerMeasure = tabData.notesPerMeasure || 16;
    
    const result = await db.run(
      `INSERT INTO Tabs (UserId, Title, Artist, Tuning, Measures, NotesPerMeasure, IsPublic, Tags, Preview, CreatedAt, UpdatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, tabData.title || 'Untitled', tabData.artist || null, tuning, measures, 
     notesPerMeasure, toNumber(tabData.isPublic || false), tags, preview]
    );
    
    return (await this.findById(result.lastID))!;
  }
  
  /**
   * Поиск табулатуры по ID.
   * 
   * @param id - ID табулатуры
   * @returns Промис с найденной табулатурой или null, если не найдена
   * 
   * @example
   * ```typescript
   * const tab = await TabService.findById(123);
   * if (tab) {
   *   console.log(`Найдена: ${tab.title}`);
   * }
   * ```
   */
  static async findById(id: number): Promise<ITab | null> {
    const tab = await db.get<any>('SELECT * FROM Tabs WHERE Id = ?', [id]);
    return tab ? this.mapTab(tab) : null;
  }
  
  /**
   * Получение всех табулатур пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Промис с массивом табулатур пользователя, отсортированных по дате создания (новые сверху)
   * 
   * @example
   * ```typescript
   * const userTabs = await TabService.findByUserId(1);
   * console.log(`У пользователя ${userTabs.length} табулатур`);
   * ```
   */
  static async findByUserId(userId: number): Promise<ITab[]> {
    const rows = await db.all<any>(
      'SELECT * FROM Tabs WHERE UserId = ? ORDER BY CreatedAt DESC', 
      [userId]
    );
    return rows.map((row: any) => this.mapTab(row));
  }
  
  /**
   * Получение публичных табулатур с пагинацией и поиском.
   * 
   * @param limit - Максимальное количество записей (по умолчанию 50)
   * @param offset - Смещение для пагинации (по умолчанию 0)
   * @param search - Поисковый запрос (по названию или исполнителю)
   * @returns Промис с массивом публичных табулатур с именем автора
   * 
   * @example
   * ```typescript
   * // Поиск публичных табулатур с пагинацией
   * const { data, pagination } = await TabService.findPublicTabs(10, 0, 'beatles');
   * ```
   */
  static async findPublicTabs(limit: number = 50, offset: number = 0, search?: string): Promise<(ITab & { authorName?: string })[]> {
    let query = `
      SELECT t.*, u.Username as authorName 
      FROM Tabs t
      LEFT JOIN Users u ON t.UserId = u.Id
      WHERE t.IsPublic = 1
    `;
    const params: any[] = [];
    
    // Добавление поиска по названию или исполнителю
    if (search) {
      query += ' AND (t.Title LIKE ? OR t.Artist LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY t.CreatedAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const rows = await db.all(query, params);
    return rows.map((row: { authorName: any; }) => ({
      ...this.mapTab(row),
      authorName: row.authorName
    }));
  }
  
  /**
   * Обновление табулатуры.
   * Обновляет только переданные поля, оставляя остальные без изменений.
   * 
   * @param id - ID обновляемой табулатуры
   * @param userId - ID владельца (для проверки прав)
   * @param tabData - Данные для обновления
   * @returns Промис с обновлённой табулатурой или null, если нет прав доступа
   * 
   * @example
   * ```typescript
   * // Обновление только заголовка и публичного статуса
   * const updated = await TabService.update(1, 1, {
   *   title: 'New Title',
   *   isPublic: true
   * });
   * ```
   */
  static async update(id: number, userId: number, tabData: Partial<ITab>): Promise<ITab | null> {
    // Проверка существования и прав доступа
    const tab = await this.findById(id);
    if (!tab || tab.userId !== userId) return null;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    // Карта обновлений для динамического построения SQL запроса
    const updateMap: Record<string, () => void> = {
      title: () => { updates.push('Title = ?'); values.push(tabData.title); },
      artist: () => { updates.push('Artist = ?'); values.push(tabData.artist); },
      tuning: () => { updates.push('Tuning = ?'); values.push(stringifyJson(tabData.tuning)); },
      measures: () => {
        updates.push('Measures = ?');
        values.push(stringifyJson(tabData.measures));
        // При обновлении тактов автоматически перегенерируем превью
        updates.push('Preview = ?');
        values.push(generatePreview(tabData.measures!));
      },
      notesPerMeasure: () => {
        updates.push('NotesPerMeasure = ?');
        values.push(tabData.notesPerMeasure || 16);
      },
      isPublic: () => { updates.push('IsPublic = ?'); values.push(toNumber(tabData.isPublic!)); },
      tags: () => { updates.push('Tags = ?'); values.push(stringifyJson(tabData.tags)); },
    };
    
    // Добавляем только те поля, которые присутствуют в запросе
    Object.keys(updateMap).forEach(key => {
      if (tabData[key as keyof ITab] !== undefined) {
        updateMap[key]();
      }
    });
    
    // Если нет полей для обновления, возвращаем текущую табулатуру
    if (updates.length === 0) return tab;
    
    // Обновляем время последнего изменения
    updates.push('UpdatedAt = datetime("now")');
    values.push(id, userId);
    
    await db.run(`UPDATE Tabs SET ${updates.join(', ')} WHERE Id = ? AND UserId = ?`, values);
    return this.findById(id);
  }
  
  /**
   * Удаление табулатуры.
   * 
   * @param id - ID удаляемой табулатуры
   * @param userId - ID владельца (для проверки прав)
   * @returns Промис с true если удаление выполнено успешно
   * 
   * @example
   * ```typescript
   * const deleted = await TabService.delete(1, 1);
   * if (deleted) {
   *   console.log('Табулатура удалена');
   * }
   * ```
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await db.run('DELETE FROM Tabs WHERE Id = ? AND UserId = ?', [id, userId]);
    return result.changes > 0;
  }
  
  /**
   * Увеличение счётчика просмотров табулатуры.
   * Используется при просмотре публичных табулатур.
   * 
   * @param id - ID табулатуры
   * 
   * @example
   * ```typescript
   * // При просмотре публичной табулатуры
   * await TabService.incrementViews(tabId);
   * ```
   */
  static async incrementViews(id: number): Promise<void> {
    await db.run('UPDATE Tabs SET Views = Views + 1 WHERE Id = ?', [id]);
  }
  
  /**
   * Преобразование строки из БД в объект ITab.
   * Выполняет десериализацию JSON полей и преобразование типов.
   * 
   * @param row - Строка из БД
   * @returns Объект табулатуры
   * @private
   */
  private static mapTab(row: any): ITab {
    return {
      id: row.Id,
      userId: row.UserId,
      title: row.Title,
      artist: row.Artist,
      tuning: parseJson(row.Tuning, DEFAULT_TUNING),
      measures: parseJson(row.Measures, []),
      notesPerMeasure: row.NotesPerMeasure || 16,
      isPublic: toBoolean(row.IsPublic),
      views: row.Views || 0,
      likes: row.Likes || 0,
      preview: row.Preview,
      tags: parseJson(row.Tags, []),
      createdAt: new Date(row.CreatedAt),
      updatedAt: new Date(row.UpdatedAt)
    };
  }
}