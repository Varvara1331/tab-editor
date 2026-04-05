/**
 * @fileoverview Модель для работы с прогрессом пользователя в разделе теории.
 * Предоставляет интерфейс к TheoryProgressService для маршрутов.
 * 
 * @module models/TheoryProgressModel
 */

import { TheoryProgressService } from '../services/theoryProgressService';
import { ITheoryProgress } from '../types';

/**
 * Объект модели TheoryProgressModel с методами для работы с прогрессом.
 * 
 * Все методы делегируются TheoryProgressService с привязкой контекста.
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
 * import { TheoryProgressModel } from '../models/TheoryProgressModel';
 * 
 * // Получение прогресса пользователя
 * const progress = await TheoryProgressModel.getProgress(userId);
 * 
 * // Отметить статью как пройденную
 * await TheoryProgressModel.completeArticle(userId, 'article-123', 85);
 * ```
 */
export const TheoryProgressModel = {
  /**
   * Получить прогресс пользователя.
   * 
   * @param userId - ID пользователя
   * @returns Данные прогресса или null, если пользователь ещё не начинал обучение
   * 
   * @example
   * ```typescript
   * const progress = await TheoryProgressModel.getProgress(1);
   * if (progress) {
   *   console.log(`Пройдено статей: ${progress.completedArticles.length}`);
   * }
   * ```
   */
  getProgress: TheoryProgressService.getProgress.bind(TheoryProgressService),
  
  /**
   * Создать или обновить прогресс пользователя.
   * Если прогресс не существует, создаётся новый; если существует - обновляется.
   * 
   * @param userId - ID пользователя
   * @param data - Частичные данные для обновления
   * @returns Обновлённые данные прогресса
   * 
   * @example
   * ```typescript
   * // Обновление последнего времени чтения
   * await TheoryProgressModel.upsertProgress(1, {
   *   lastRead: new Date().toISOString()
   * });
   * ```
   */
  upsertProgress: TheoryProgressService.upsertProgress.bind(TheoryProgressService),
  
  /**
   * Отметить статью как пройденную.
   * Если передан quizScore, добавляет очки в общий счёт пользователя.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @param quizScore - Оценка за тест (опционально, от 0 до 100)
   * @returns Обновлённые данные прогресса
   * 
   * @example
   * ```typescript
   * // Отметить статью без оценки
   * await TheoryProgressModel.completeArticle(1, 'basic-chords');
   * 
   * // Отметить статью с оценкой за тест
   * await TheoryProgressModel.completeArticle(1, 'advanced-scales', 95);
   * ```
   */
  completeArticle: TheoryProgressService.completeArticle.bind(TheoryProgressService),
  
  /**
   * Получить статистику прогресса пользователя.
   * Включает количество пройденных статей, общие очки, средний балл и последнюю активность.
   * 
   * @param userId - ID пользователя
   * @returns Статистика прогресса
   * 
   * @example
   * ```typescript
   * const stats = await TheoryProgressModel.getStatistics(1);
   * // { totalArticlesCompleted: 5, totalPoints: 420, averageScore: 84, lastActive: "2024-01-15T10:30:00Z" }
   * ```
   */
  getStatistics: TheoryProgressService.getStatistics.bind(TheoryProgressService),
  
  /**
   * Получить список ID пройденных статей.
   * 
   * @param userId - ID пользователя
   * @returns Массив ID пройденных статей
   */
  getCompletedArticles: TheoryProgressService.getCompletedArticles.bind(TheoryProgressService),
  
  /**
   * Проверить, пройдена ли конкретная статья.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @returns true если статья пройдена
   * 
   * @example
   * ```typescript
   * const isCompleted = await TheoryProgressModel.isArticleCompleted(1, 'basic-chords');
   * if (isCompleted) {
   *   // Показать следующий урок
   * }
   * ```
   */
  isArticleCompleted: TheoryProgressService.isArticleCompleted.bind(TheoryProgressService),
  
  /**
   * Получить общее количество очков пользователя.
   * Очки начисляются за прохождение тестов.
   * 
   * @param userId - ID пользователя
   * @returns Общее количество очков
   */
  getTotalPoints: TheoryProgressService.getTotalPoints.bind(TheoryProgressService),
  
  /**
   * Получить оценку за конкретную статью.
   * 
   * @param userId - ID пользователя
   * @param articleId - ID статьи
   * @returns Оценка за тест (0-100) или null, если статья не пройдена
   */
  getArticleScore: TheoryProgressService.getArticleScore.bind(TheoryProgressService),
  
  /**
   * Получить таблицу лидеров.
   * Возвращает топ пользователей по количеству набранных очков.
   * 
   * @param limit - Количество пользователей в топе (по умолчанию 10)
   * @returns Массив записей таблицы лидеров с ID пользователя, именем, очками и количеством пройденных статей
   * 
   * @example
   * ```typescript
   * const leaderboard = await TheoryProgressModel.getLeaderboard(5);
   * // [{ userId: 1, username: "guitarist", totalPoints: 1250, articlesCompleted: 12 }, ...]
   * ```
   */
  getLeaderboard: TheoryProgressService.getLeaderboard.bind(TheoryProgressService),
  
  /**
   * Удалить прогресс пользователя.
   * Используется при удалении аккаунта пользователя.
   * 
   * @param userId - ID пользователя
   * 
   * @example
   * ```typescript
   * // При удалении аккаунта пользователя
   * await TheoryProgressModel.deleteProgress(userId);
   * ```
   */
  deleteProgress: TheoryProgressService.deleteProgress.bind(TheoryProgressService),
} as const;

/**
 * Тип для данных прогресса пользователя.
 * Содержит информацию о пройденных статьях, оценках и общих очках.
 */
export type { ITheoryProgress };

/**
 * Тип для объекта TheoryProgressModel (все методы модели).
 * Полезен для тестирования и создания моков.
 */
export type TheoryProgressModelType = typeof TheoryProgressModel;

/**
 * Тип для статистики прогресса.
 */
export type TheoryStatistics = {
  totalArticlesCompleted: number;
  totalPoints: number;
  averageScore: number;
  lastActive: string | null;
};

/**
 * Тип для записи в таблице лидеров.
 */
export type LeaderboardEntry = {
  userId: number;
  username: string;
  totalPoints: number;
  articlesCompleted: number;
};