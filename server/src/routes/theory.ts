/**
 * @fileoverview Маршруты для работы с прогрессом в разделе теории.
 * Управление пройденными статьями, результатами тестов и таблицей лидеров.
 * 
 * @module routes/theory
 */

import express from 'express';
import { protect } from '../middleware/auth';
import { TheoryProgressModel } from '../models/TheoryProgressModel';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Theory
 *   description: Прогресс в изучении теории музыки
 */

/**
 * @swagger
 * /api/theory/progress:
 *   get:
 *     summary: Получение прогресса пользователя
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные прогресса пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TheoryProgress'
 *       401:
 *         description: Не авторизован
 */
router.get('/progress', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Проверка авторизации
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
      return;
    }
    
    // Получение прогресса пользователя
    const progress = await TheoryProgressModel.getProgress(userId);
    
    // Возвращаем данные прогресса или пустой объект, если пользователь ещё не начинал обучение
    res.json({ 
      success: true, 
      data: progress || { 
        userId,
        completedArticles: [], 
        lastRead: null,
        quizScores: {}, 
        totalPoints: 0 
      }
    });
  } catch (error) {
    console.error('Get theory progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при получении прогресса' 
    });
  }
});

/**
 * @swagger
 * /api/theory/progress:
 *   put:
 *     summary: Обновление прогресса пользователя
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completedArticles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Список ID пройденных статей
 *               quizScores:
 *                 type: object
 *                 additionalProperties:
 *                   type: integer
 *                 description: Оценки за тесты по статьям
 *               lastRead:
 *                 type: string
 *                 format: date-time
 *                 description: Время последнего чтения
 *     responses:
 *       200:
 *         description: Прогресс успешно обновлён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TheoryProgress'
 *       401:
 *         description: Не авторизован
 */
router.put('/progress', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Проверка авторизации
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
      return;
    }
    
    const { completedArticles, quizScores, lastRead } = req.body;
    
    // Обновление прогресса
    const progress = await TheoryProgressModel.upsertProgress(userId, {
      completedArticles,
      quizScores,
      lastRead
    });
    
    res.json({ 
      success: true, 
      data: progress 
    });
  } catch (error) {
    console.error('Update theory progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при обновлении прогресса' 
    });
  }
});

/**
 * @swagger
 * /api/theory/progress/complete:
 *   post:
 *     summary: Отметить статью как пройденную
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - articleId
 *             properties:
 *               articleId:
 *                 type: string
 *                 description: ID статьи
 *               quizScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Оценка за тест (опционально)
 *     responses:
 *       200:
 *         description: Статья отмечена как пройденная
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TheoryProgress'
 *       400:
 *         description: Не указан ID статьи
 *       401:
 *         description: Не авторизован
 */
router.post('/progress/complete', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Проверка авторизации
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
      return;
    }
    
    const { articleId, quizScore } = req.body;
    
    // Проверка наличия ID статьи
    if (!articleId) {
      res.status(400).json({ 
        success: false, 
        error: 'ID статьи обязателен' 
      });
      return;
    }
    
    // Отметка статьи как пройденной
    const progress = await TheoryProgressModel.completeArticle(userId, articleId, quizScore);
    
    res.json({ 
      success: true, 
      data: progress 
    });
  } catch (error) {
    console.error('Complete article error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при завершении статьи' 
    });
  }
});

/**
 * @swagger
 * /api/theory/statistics:
 *   get:
 *     summary: Получение статистики прогресса пользователя
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика прогресса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TheoryStatistics'
 *       401:
 *         description: Не авторизован
 */
router.get('/statistics', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Проверка авторизации
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
      return;
    }
    
    // Получение статистики
    const statistics = await TheoryProgressModel.getStatistics(userId);
    
    res.json({ 
      success: true, 
      data: statistics 
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при получении статистики' 
    });
  }
});

/**
 * @swagger
 * /api/theory/leaderboard:
 *   get:
 *     summary: Получение таблицы лидеров
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество записей в таблице лидеров
 *     responses:
 *       200:
 *         description: Таблица лидеров
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *       401:
 *         description: Не авторизован
 */
router.get('/leaderboard', protect, async (req: AuthRequest, res) => {
  try {
    // Получение лимита из query параметров
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Получение таблицы лидеров
    const leaderboard = await TheoryProgressModel.getLeaderboard(limit);
    
    res.json({ 
      success: true, 
      data: leaderboard 
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при получении таблицы лидеров' 
    });
  }
});

/**
 * @swagger
 * /api/theory/completed/{articleId}:
 *   get:
 *     summary: Проверка, пройдена ли конкретная статья
 *     tags: [Theory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID статьи
 *     responses:
 *       200:
 *         description: Результат проверки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: boolean
 *                     score:
 *                       type: integer
 *                       nullable: true
 *       401:
 *         description: Не авторизован
 */
router.get('/completed/:articleId', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Проверка авторизации
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
      return;
    }
    
    const articleId = req.params.articleId;
    
    // Параллельная проверка статуса статьи и получение оценки
    const [completed, score] = await Promise.all([
      TheoryProgressModel.isArticleCompleted(userId, articleId),
      TheoryProgressModel.getArticleScore(userId, articleId)
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        completed, 
        score: score || null 
      }
    });
  } catch (error) {
    console.error('Check article completed error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при проверке статьи' 
    });
  }
});

export default router;