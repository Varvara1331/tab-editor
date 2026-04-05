/**
 * @fileoverview Маршруты для работы с табулатурами пользователя.
 * CRUD операции, получение избранного.
 * 
 * @module routes/tabs
 */

import express, { Response } from 'express';
import { TabModel, ITab } from '../models/Tab';
import { LibraryModel } from '../models/Library';
import { protect } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tabs
 *   description: Управление табулатурами пользователя
 */

/**
 * @swagger
 * /api/tabs/favorites:
 *   get:
 *     summary: Получение избранных табулатур (публикации других авторов)
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список избранных табулатур
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
 *                     $ref: '#/components/schemas/FavoriteTab'
 *       401:
 *         description: Не авторизован
 */
router.get('/favorites', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    // Получение избранных табулатур пользователя
    const favorites = await LibraryModel.getFavoritesByUserId(req.user.id);
    
    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении избранного',
    });
  }
});

/**
 * @swagger
 * /api/tabs:
 *   get:
 *     summary: Получение всех табулатур пользователя
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список табулатур пользователя
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
 *       401:
 *         description: Не авторизован
 */
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    // Получение всех табулатур пользователя
    const tabs: ITab[] = await TabModel.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: tabs,
    });
  } catch (error) {
    console.error('Get tabs error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении табулатур',
    });
  }
});

/**
 * @swagger
 * /api/tabs/{id}:
 *   get:
 *     summary: Получение конкретной табулатуры (с проверкой прав доступа)
 *     tags: [Tabs]
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
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Нет доступа к этой табулатуре
 *       404:
 *         description: Табулатура не найдена
 */
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    const tab: ITab | null = await TabModel.findById(id);
    
    // Проверка существования табулатуры
    if (!tab) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена',
      });
      return;
    }
    
    // Проверка прав доступа: пользователь может видеть только свои табулатуры или публичные
    if (tab.userId !== req.user.id && !tab.isPublic) {
      res.status(403).json({
        success: false,
        error: 'Нет доступа к этой табулатуре',
      });
      return;
    }
    
    res.json({
      success: true,
      data: tab,
    });
  } catch (error) {
    console.error('Get tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при получении табулатуры',
    });
  }
});

/**
 * @swagger
 * /api/tabs:
 *   post:
 *     summary: Создание новой табулатуры
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My New Song"
 *               artist:
 *                 type: string
 *                 example: "My Band"
 *               tuning:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["E", "A", "D", "G", "B", "E"]
 *               measures:
 *                 type: array
 *                 description: Массив тактов табулатуры
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Табулатура успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tab'
 *       401:
 *         description: Не авторизован
 */
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    // Создание новой табулатуры
    const tab: ITab = await TabModel.create(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      data: tab,
    });
  } catch (error) {
    console.error('Create tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при создании табулатуры',
    });
  }
});

/**
 * @swagger
 * /api/tabs/{id}:
 *   put:
 *     summary: Обновление существующей табулатуры
 *     tags: [Tabs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID табулатуры
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               tuning:
 *                 type: array
 *                 items:
 *                   type: string
 *               measures:
 *                 type: array
 *               isPublic:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Табулатура успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tab'
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Табулатура не найдена
 */
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    const tab: ITab | null = await TabModel.update(id, req.user.id, req.body);
    
    // Проверка существования табулатуры и прав доступа
    if (!tab) {
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
    console.error('Update tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обновлении табулатуры',
    });
  }
});

/**
 * @swagger
 * /api/tabs/{id}:
 *   delete:
 *     summary: Удаление табулатуры
 *     tags: [Tabs]
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
 *         description: Табулатура успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Табулатура не найдена
 */
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    // Проверка авторизации
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Не авторизован',
      });
      return;
    }
    
    const id = parseInt(req.params.id);
    const deleted: boolean = await TabModel.delete(id, req.user.id);
    
    // Проверка успешности удаления
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Табулатура не найдена',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Табулатура успешно удалена',
    });
  } catch (error) {
    console.error('Delete tab error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при удалении табулатуры',
    });
  }
});

export default router;