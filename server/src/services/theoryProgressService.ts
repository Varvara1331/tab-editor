/**
 * @fileoverview Сервис для отслеживания прогресса пользователя в разделе теории.
 * Управляет пройденными статьями, результатами тестов и системой очков.
 * 
 * @module services/theoryProgressService
 */

import { db } from '../database';

/**
 * Данные о прогрессе пользователя в теории.
 * 
 * @public
 */
export interface TheoryProgressData {
  /** ID пользователя */
  userId: number;
  /** Массив ID пройденных статей */
  completedArticles: string[];
  /** Время последнего чтения */
  lastRead: string | null;
  /** Оценки за тесты по статьям (ключ - ID статьи, значение - баллы от 0 до 100) */
  quizScores: Record<string, number>;
  /** Общее количество набранных очков (сумма всех quizScores) */
  totalPoints: number;
}

/**
 * Сервис для работы с прогрессом пользователя в разделе теории.
 * Все методы статические.
 * 
 * @public
 */
export class TheoryProgressService {
  /**
   * Получить прогресс пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Данные прогресса или null, если пользователь ещё не начинал обучение
   * 
   * @example
   * ```typescript
   * const progress = await TheoryProgressService.getProgress(1);
   * if (progress) {
   *   console.log(`Пройдено статей: ${progress.completedArticles.length}`);
   *   console.log(`Всего очков: ${progress.totalPoints}`);
   * }
   * ```
   */
  static async getProgress(userId: number): Promise<TheoryProgressData | null> {
    const result = await db.get<{
      CompletedArticles: string;
      LastRead: string | null;
      QuizScores: string;
      TotalPoints: number;
    }>(
      `SELECT CompletedArticles, LastRead, QuizScores, TotalPoints 
       FROM TheoryProgress 
       WHERE UserId = ?`,
      [userId]
    );

    if (!result) return null;

    return {
      userId,
      completedArticles: JSON.parse(result.CompletedArticles),
      lastRead: result.LastRead,
      quizScores: JSON.parse(result.QuizScores || '{}'),
      totalPoints: result.TotalPoints || 0
    };
  }

  /**
   * Создать или обновить прогресс пользователя.
   * 
   * Если прогресс не существует, создаётся новая запись.
   * Если существует - обновляется существующая.
   * 
   * @param userId - ID пользователя
   * @param data - Частичные данные для обновления
   * @returns Обновлённые данные прогресса
   * 
   * @example
   * ```typescript
   * // Обновление последнего времени чтения
   * const progress = await TheoryProgressService.upsertProgress(1, {
   *   lastRead: new Date().toISOString()
   * });
   * 
   * // Полное обновление прогресса
   * const progress = await TheoryProgressService.upsertProgress(1, {
   *   completedArticles: ['article-1', 'article-2'],
   *   quizScores: { 'article-1': 85, 'article-2': 90 }
   * });
   * ```
   */
  static async upsertProgress(
    userId: number,
    data: Partial<TheoryProgressData>
  ): Promise<TheoryProgressData> {
    const existing = await this.getProgress(userId);
    
    // Мержим существующие и новые данные
    const completedArticles = data.completedArticles || existing?.completedArticles || [];
    const quizScores = { ...(existing?.quizScores || {}), ...(data.quizScores || {}) };
    const totalPoints = Object.values(quizScores).reduce((sum, score) => sum + score, 0);
    
    if (existing) {
      // Обновление существующей записи
      await db.run(
        `UPDATE TheoryProgress 
         SET CompletedArticles = ?,
             LastRead = ?,
             QuizScores = ?,
             TotalPoints = ?,
             LastUpdated = CURRENT_TIMESTAMP
         WHERE UserId = ?`,
        [
          JSON.stringify(completedArticles),
          data.lastRead || new Date().toISOString(),
          JSON.stringify(quizScores),
          totalPoints,
          userId
        ]
      );
    } else {
      // Создание новой записи
      await db.run(
        `INSERT INTO TheoryProgress (UserId, CompletedArticles, LastRead, QuizScores, TotalPoints)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          JSON.stringify(completedArticles),
          data.lastRead || new Date().toISOString(),
          JSON.stringify(quizScores),
          totalPoints
        ]
      );
    }

    return {
      userId,
      completedArticles,
      lastRead: data.lastRead || new Date().toISOString(),
      quizScores,
      totalPoints
    };
  }

  /**
   * Отметить статью как пройденную.
   * 
   * Если передан quizScore, добавляет очки в общий счёт пользователя.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @param quizScore - Оценка за тест (опционально, от 0 до 100)
   * @returns Обновлённые данные прогресса
   * 
   * @example
   * ```typescript
   * // Отметить статью без оценки (просто прочитана)
   * await TheoryProgressService.completeArticle(1, 'basic-chords');
   * 
   * // Отметить статью с оценкой за тест
   * await TheoryProgressService.completeArticle(1, 'advanced-scales', 95);
   * ```
   */
  static async completeArticle(
    userId: number,
    articleId: string,
    quizScore?: number
  ): Promise<TheoryProgressData> {
    const existing = await this.getProgress(userId);
    const completedArticles = existing?.completedArticles || [];
    
    // Добавляем статью, если её ещё нет в списке
    if (!completedArticles.includes(articleId)) {
      completedArticles.push(articleId);
    }

    const quizScores = { ...(existing?.quizScores || {}) };
    if (quizScore !== undefined) {
      quizScores[articleId] = quizScore;
    }

    return this.upsertProgress(userId, {
      completedArticles,
      quizScores,
      lastRead: new Date().toISOString()
    });
  }

  /**
   * Получить статистику прогресса пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Статистика: количество пройденных статей, очки, средний балл, последняя активность
   * 
   * @example
   * ```typescript
   * const stats = await TheoryProgressService.getStatistics(1);
   * // {
   * //   totalArticlesCompleted: 5,
   * //   totalPoints: 420,
   * //   averageScore: 84,
   * //   lastActive: "2024-01-15T10:30:00Z"
   * // }
   * ```
   */
  static async getStatistics(userId: number): Promise<{
    totalArticlesCompleted: number;
    totalPoints: number;
    averageScore: number;
    lastActive: string | null;
  }> {
    const progress = await this.getProgress(userId);
    
    const scores = Object.values(progress?.quizScores || {});
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    return {
      totalArticlesCompleted: progress?.completedArticles.length || 0,
      totalPoints: progress?.totalPoints || 0,
      averageScore,
      lastActive: progress?.lastRead || null
    };
  }

  /**
   * Получить список ID пройденных статей.
   * 
   * @param userId - ID пользователя
   * @returns Массив ID пройденных статей
   * 
   * @example
   * ```typescript
   * const completed = await TheoryProgressService.getCompletedArticles(1);
   * console.log(`Пройденные статьи: ${completed.join(', ')}`);
   * ```
   */
  static async getCompletedArticles(userId: number): Promise<string[]> {
    const progress = await this.getProgress(userId);
    return progress?.completedArticles || [];
  }

  /**
   * Проверить, пройдена ли конкретная статья.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @returns true если статья пройдена
   * 
   * @example
   * ```typescript
   * const isCompleted = await TheoryProgressService.isArticleCompleted(1, 'basic-chords');
   * if (isCompleted) {
   *   // Показать следующий урок
   * }
   * ```
   */
  static async isArticleCompleted(userId: number, articleId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    return progress?.completedArticles.includes(articleId) || false;
  }

  /**
   * Получить общее количество очков пользователя.
   * Очки начисляются за прохождение тестов (сумма всех quizScores).
   * 
   * @param userId - ID пользователя
   * @returns Общее количество очков
   * 
   * @example
   * ```typescript
   * const points = await TheoryProgressService.getTotalPoints(1);
   * console.log(`Всего очков: ${points}`);
   * ```
   */
  static async getTotalPoints(userId: number): Promise<number> {
    const progress = await this.getProgress(userId);
    return progress?.totalPoints || 0;
  }

  /**
   * Получить оценку за конкретную статью.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @returns Оценка за тест (0-100) или null, если статья не пройдена
   * 
   * @example
   * ```typescript
   * const score = await TheoryProgressService.getArticleScore(1, 'basic-chords');
   * if (score) {
   *   console.log(`Оценка: ${score} баллов`);
   * }
   * ```
   */
  static async getArticleScore(userId: number, articleId: string): Promise<number | null> {
    const progress = await this.getProgress(userId);
    return progress?.quizScores[articleId] || null;
  }

  /**
   * Получить таблицу лидеров.
   * Возвращает топ пользователей по количеству набранных очков.
   * 
   * @param limit - Количество пользователей в топе (по умолчанию 10)
   * @returns Массив записей таблицы лидеров
   * 
   * @example
   * ```typescript
   * const leaderboard = await TheoryProgressService.getLeaderboard(5);
   * leaderboard.forEach((entry, index) => {
   *   console.log(`${index + 1}. ${entry.username} - ${entry.totalPoints} очков`);
   * });
   * ```
   */
  static async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    username: string;
    totalPoints: number;
    articlesCompleted: number;
  }>> {
    const results = await db.all<{
      UserId: number;
      Username: string;
      TotalPoints: number;
      ArticlesCount: number;
    }>(
      `SELECT 
        tp.UserId,
        u.Username,
        tp.TotalPoints,
        json_array_length(tp.CompletedArticles) as ArticlesCount
       FROM TheoryProgress tp
       JOIN Users u ON tp.UserId = u.Id
       WHERE tp.TotalPoints > 0
       ORDER BY tp.TotalPoints DESC
       LIMIT ?`,
      [limit]
    );

    return results.map(r => ({
      userId: r.UserId,
      username: r.Username,
      totalPoints: r.TotalPoints,
      articlesCompleted: r.ArticlesCount
    }));
  }

  /**
   * Удалить прогресс пользователя.
   * Используется при удалении аккаунта пользователя.
   * 
   * @param userId - ID пользователя
   * 
   * @example
   * ```typescript
   * // При удалении аккаунта пользователя
   * await TheoryProgressService.deleteProgress(userId);
   * ```
   */
  static async deleteProgress(userId: number): Promise<void> {
    await db.run('DELETE FROM TheoryProgress WHERE UserId = ?', [userId]);
  }
}