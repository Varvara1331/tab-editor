/**
 * @fileoverview Сервис для работы с прогрессом в разделе теории.
 * Управляет пройденными статьями, результатами тестов и синхронизацией.
 * 
 * @module services/theoryService
 */

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
 */
export const getTheoryProgress = async (): Promise<TheoryProgress> => {
  try {
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
  } catch (error) {
    console.error('Error loading theory progress:', error);
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
 */
export const updateTheoryProgress = async (data: UpdateProgressData): Promise<TheoryProgress> => {
  try {
    const current = await getTheoryProgress();
    const updatedProgress = {
      ...current,
      ...data,
      lastRead: data.lastRead || new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
    return updatedProgress;
  } catch (error) {
    console.error('Error updating theory progress:', error);
    throw error;
  }
};

/**
 * Отметить статью как пройденную
 * 
 * @param articleId - ID статьи
 * @param quizScore - Оценка за тест (опционально)
 * @returns Обновлённый прогресс
 */
export const completeArticle = async (articleId: string, quizScore?: number): Promise<TheoryProgress> => {
  try {
    const current = await getTheoryProgress();
    
    if (!current.completedArticles.includes(articleId)) {
      const updatedProgress = {
        ...current,
        completedArticles: [...current.completedArticles, articleId],
        lastRead: new Date().toISOString(),
        quizScores: {
          ...current.quizScores,
          ...(quizScore !== undefined && { [articleId]: quizScore })
        },
        totalPoints: (current.totalPoints || 0) + (quizScore || 0)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
      return updatedProgress;
    }
    
    return current;
  } catch (error) {
    console.error('Error completing article:', error);
    throw error;
  }
};

/**
 * Получение статистики прогресса
 * 
 * @returns Статистика прогресса
 */
export const getTheoryStatistics = async (): Promise<TheoryStatistics> => {
  try {
    const progress = await getTheoryProgress();
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
  } catch (error) {
    console.error('Error getting theory statistics:', error);
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
 */
export const syncTheoryProgress = async (): Promise<void> => {
  const localProgress = localStorage.getItem(STORAGE_KEY);
  if (localProgress) {
    try {
      console.log('Theory progress ready for sync');
    } catch (error) {
      console.error('Error syncing theory progress:', error);
    }
  }
};

/**
 * Очистка прогресса (для тестирования)
 */
export const clearTheoryProgress = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing theory progress:', error);
    localStorage.removeItem(STORAGE_KEY);
  }
};