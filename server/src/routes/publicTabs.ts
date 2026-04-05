/**
 * @fileoverview Маршруты для работы с публичными табулатурами.
 * Просмотр, добавление в избранное, скачивание.
 * 
 * @module routes/publicTabs
 */

import express, { Response } from 'express';
import { TabModel } from '../models/Tab';
import { LibraryModel } from '../models/Library';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Public Tabs
 *   description: Публичные табулатуры и работа с избранным
 */

/**
 * @swagger
 * /api/public-tabs:
 *   get:
 *     summary: Получение списка публичных табулатур
 *     tags: [Public Tabs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество записей на странице
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос (по названию или исполнителю)
 *     responses:
 *       200:
 *         description: Список публичных табулатур
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
 *                     $ref: '#/components/schemas/Tab'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Извлечение параметров запроса
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    
    // Получение публичных табулатур
    const tabs = await TabModel.findPublicTabs(limit, offset, search);
    
    // Для авторизованных пользователей добавляем флаг isInLibrary
    let userLibraryTabIds: Set<number> = new Set();
    if (req.user) {
      const library = await LibraryModel.findByUserId(req.user.id);
      userLibraryTabIds = new Set(library.map(item => item.tabId));
    }
    
    // Обогащение данных флагом наличия в библиотеке
    const tabsWithLibraryStatus = tabs.map(tab => ({
      ...tab,
      isInLibrary: userLibraryTabIds.has(tab.id)
    }));
    
    res.json({
      success: true,
      data: tabsWithLibraryStatus,
      pagination: {
        limit,
        offset,
        total: tabs.length
      }
    });
  } catch (error) {
    console.error('Get public tabs error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении публикаций',
    });
  }
});

/**
 * @swagger
 * /api/public-tabs/{id}:
 *   get:
 *     summary: Получение конкретной публичной табулатуры
 *     tags: [Public Tabs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
 *     responses:
 *       200:
 *         description: Данные табулатуры
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tab'
 *       403:
 *         description: Табулатура не является публичной
 *       404:
 *         description: Табулатура не найдена
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tab = await TabModel.findById(id);
    
    // Проверка существования табулатуры
    if (!tab) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена',
      });
      return;
    }
    
    // Проверка, что табулатура публичная
    if (!tab.isPublic) {
      res.status(403).json({
        success: false,
        error: 'Эта табулатура не является публичной',
      });
      return;
    }
    
    // Увеличиваем счётчик просмотров
    await TabModel.incrementViews(id);
    
    res.json({
      success: true,
      data: tab,
    });
  } catch (error) {
    console.error('Get public tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении табулатуры',
    });
  }
});

/**
 * @swagger
 * /api/public-tabs/{id}/library:
 *   post:
 *     summary: Добавление публичной табулатуры в библиотеку (избранное)
 *     tags: [Public Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
 *     responses:
 *       200:
 *         description: Табулатура добавлена в библиотеку
 *       400:
 *         description: Табулатура уже добавлена в библиотеку
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Табулатура не является публичной
 *       404:
 *         description: Табулатура не найдена
 */
router.post('/:id/library', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const tabId = parseInt(req.params.id);
    const tab = await TabModel.findById(tabId);
    
    // Проверка существования табулатуры
    if (!tab) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена',
      });
      return;
    }
    
    // Проверка, что табулатура публичная
    if (!tab.isPublic) {
      res.status(403).json({
        success: false,
        error: 'Эта табулатура не является публичной',
      });
      return;
    }
    
    // Проверка, не добавлена ли уже в библиотеку
    const exists = await LibraryModel.checkExists(req.user.id, tabId);
    if (exists) {
      res.status(400).json({
        success: false,
        error: 'Табулатура уже добавлена в библиотеку',
      });
      return;
    }
    
    // Добавление в библиотеку
    const libraryItem = await LibraryModel.addFromPublication(req.user.id, tab);
    
    res.json({
      success: true,
      data: libraryItem,
      message: 'Табулатура добавлена в библиотеку',
    });
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при добавлении в библиотеку',
    });
  }
});

/**
 * @swagger
 * /api/public-tabs/{id}/library:
 *   delete:
 *     summary: Удаление публичной табулатуры из библиотеки
 *     tags: [Public Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
 *     responses:
 *       200:
 *         description: Табулатура удалена из библиотеки
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Табулатура не найдена в библиотеке
 */
router.delete('/:id/library', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const tabId = parseInt(req.params.id);
    const deleted = await LibraryModel.removeFromLibrary(req.user.id, tabId);
    
    // Проверка, была ли табулатура в библиотеке
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена в библиотеке',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Табулатура удалена из библиотеки',
    });
  } catch (error) {
    console.error('Remove from library error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при удалении из библиотеки',
    });
  }
});

/**
 * @swagger
 * /api/public-tabs/{id}/library/check:
 *   get:
 *     summary: Проверка, добавлена ли табулатура в библиотеку
 *     tags: [Public Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
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
 *                     exists:
 *                       type: boolean
 *       401:
 *         description: Не авторизован
 */
router.get('/:id/library/check', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const tabId = parseInt(req.params.id);
    const exists = await LibraryModel.checkExists(req.user.id, tabId);
    
    res.json({
      success: true,
      data: { exists },
    });
  } catch (error) {
    console.error('Check library error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при проверке',
    });
  }
});

/**
 * @swagger
 * /api/public-tabs/{id}/download:
 *   get:
 *     summary: Скачивание публичной табулатуры
 *     tags: [Public Tabs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
 *     responses:
 *       200:
 *         description: Данные табулатуры для скачивания
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tab'
 *       404:
 *         description: Табулатура не найдена или не является публичной
 */
router.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tab = await TabModel.findById(id);
    
    // Проверка существования и публичности табулатуры
    if (!tab || !tab.isPublic) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена',
      });
      return;
    }
    
    res.json({
      success: true,
      data: tab,
    });
  } catch (error) {
    console.error('Download tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при скачивании',
    });
  }
});

export default router;