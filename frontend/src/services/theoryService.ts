/**
 * @fileoverview Сервис для работы с прогрессом в разделе теории.
 * Управляет пройденными статьями, результатами тестов и синхронизацией.
 * 
 * @module services/theoryService
 */

import { api, ApiResponse } from './api';

/** Ключ для хранения прогресса в localStorage */
const STORAGE_KEY = 'guitar_tab_theory_progress';

/**
 * Прогресс пользователя в теории
 */
export interface TheoryProgress {
  /** Массив ID пройденных статей */
  completedArticles: string[];
  /** Время последнего чтения */
  lastRead: string | null;
  /** Оценки за тесты по статьям */
  quizScores: Record<string, number>;
  /** Общее количество очков */
  totalPoints: number;
}

/**
 * Статистика прогресса пользователя
 */
export interface TheoryStatistics {
  /** Количество пройденных статей */
  totalArticlesCompleted: number;
  /** Общее количество очков */
  totalPoints: number;
  /** Средняя оценка */
  averageScore: number;
  /** Время последней активности */
  lastActive: string | null;
}

/**
 * Данные для обновления прогресса
 */
export interface UpdateProgressData {
  /** Список пройденных статей */
  completedArticles?: string[];
  /** Оценки за тесты */
  quizScores?: Record<string, number>;
  /** Время последнего чтения */
  lastRead?: string;
}

/**
 * Получение прогресса пользователя
 * 
 * @returns Прогресс пользователя
 * 
 * @example
 * ```typescript
 * const progress = await getTheoryProgress();
 * console.log(`Пройдено статей: ${progress.completedArticles.length}`);
 * ```
 */
export const getTheoryProgress = async (): Promise<TheoryProgress> => {
  try {
    const response = await api.get<ApiResponse<TheoryProgress>>('/theory/progress');
    
    if (response.data.success && response.data.data) {
      // Сохраняем локальную копию для оффлайн доступа
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    // Возвращаем дефолтные значения если данных нет
    return {
      completedArticles: [],
      lastRead: null,
      quizScores: {},
      totalPoints: 0
    };
  } catch (error) {
    console.error('Error loading theory progress from server:', error);
    
    // Fallback на локальное хранилище
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      completedArticles: [],
      lastRead: null,
      quizScores: {},
      totalPoints: 0
    };
  }
};

/**
 * Обновление прогресса пользователя
 * 
 * @param data - Данные для обновления
 * @returns Обновлённый прогресс
 * @throws {Error} При ошибке обновления
 */
export const updateTheoryProgress = async (data: UpdateProgressData): Promise<TheoryProgress> => {
  try {
    const response = await api.put<ApiResponse<TheoryProgress>>('/theory/progress', data);
    
    if (response.data.success && response.data.data) {
      // Обновляем локальную копию
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update progress');
  } catch (error) {
    console.error('Error updating theory progress:', error);
    
    // Обновляем локальную копию даже при ошибке сервера
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const currentProgress = JSON.parse(saved);
      const updatedProgress = {
        ...currentProgress,
        ...data,
        lastRead: data.lastRead || new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    }
    
    throw error;
  }
};

/**
 * Отметить статью как пройденную
 * 
 * @param articleId - ID статьи
 * @param quizScore - Оценка за тест (опционально)
 * @returns Обновлённый прогресс
 * @throws {Error} При ошибке обновления
 * 
 * @example
 * ```typescript
 * // Отметить статью без оценки
 * await completeArticle('basic-chords');
 * 
 * // Отметить статью с оценкой
 * await completeArticle('advanced-scales', 95);
 * ```
 */
export const completeArticle = async (articleId: string, quizScore?: number): Promise<TheoryProgress> => {
  try {
    const response = await api.post<ApiResponse<TheoryProgress>>('/theory/progress/complete', {
      articleId,
      quizScore
    });
    
    if (response.data.success && response.data.data) {
      // Обновляем локальную копию
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.data));
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to complete article');
  } catch (error) {
    console.error('Error completing article:', error);
    
    // Локальное обновление при ошибке сервера
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const currentProgress = JSON.parse(saved);
      if (!currentProgress.completedArticles.includes(articleId)) {
        const updatedProgress = {
          ...currentProgress,
          completedArticles: [...currentProgress.completedArticles, articleId],
          lastRead: new Date().toISOString(),
          quizScores: {
            ...currentProgress.quizScores,
            ...(quizScore !== undefined && { [articleId]: quizScore })
          },
          totalPoints: (currentProgress.totalPoints || 0) + (quizScore || 0)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
        return updatedProgress;
      }
      return currentProgress;
    }
    
    throw error;
  }
};

/**
 * Получение статистики прогресса
 * 
 * @returns Статистика прогресса
 * 
 * @example
 * ```typescript
 * const stats = await getTheoryStatistics();
 * console.log(`Средний балл: ${stats.averageScore}`);
 * ```
 */
export const getTheoryStatistics = async (): Promise<TheoryStatistics> => {
  try {
    const response = await api.get<ApiResponse<TheoryStatistics>>('/theory/statistics');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // Возвращаем дефолтную статистику
    return {
      totalArticlesCompleted: 0,
      totalPoints: 0,
      averageScore: 0,
      lastActive: null
    };
  } catch (error) {
    console.error('Error getting theory statistics:', error);
    
    // Вычисляем статистику из локальных данных
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      const scores = Object.values(progress.quizScores || {}) as number[];
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      return {
        totalArticlesCompleted: progress.completedArticles?.length || 0,
        totalPoints: progress.totalPoints || 0,
        averageScore,
        lastActive: progress.lastRead || null
      };
    }
    
    return {
      totalArticlesCompleted: 0,
      totalPoints: 0,
      averageScore: 0,
      lastActive: null
    };
  }
};

/**
 * Синхронизация локального прогресса с сервером
 * 
 * @example
 * ```typescript
 * await syncTheoryProgress();
 * console.log('Прогресс синхронизирован');
 * ```
 */
export const syncTheoryProgress = async (): Promise<void> => {
  const localProgress = localStorage.getItem(STORAGE_KEY);
  if (localProgress) {
    try {
      const progress = JSON.parse(localProgress);
      await updateTheoryProgress(progress);
      console.log('Theory progress synced with server');
    } catch (error) {
      console.error('Error syncing theory progress:', error);
    }
  }
};

/**
 * Очистка прогресса (для тестирования)
 * 
 * @example
 * ```typescript
 * await clearTheoryProgress();
 * console.log('Прогресс сброшен');
 * ```
 */
export const clearTheoryProgress = async (): Promise<void> => {
  try {
    // Очищаем на сервере
    await updateTheoryProgress({
      completedArticles: [],
      quizScores: {},
      lastRead: new Date().toISOString()
    });
    
    // Очищаем локально
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing theory progress:', error);
    localStorage.removeItem(STORAGE_KEY);
  }
};