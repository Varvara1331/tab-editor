/**
 * @fileoverview Маршруты для аутентификации.
 * Регистрация, вход и получение информации о текущем пользователе.
 * 
 * @module routes/auth
 */

import express from 'express';
import { UserModel } from '../models/User';
import { protect } from '../middleware/auth';
import { validate, ValidationSchema } from '../middleware/validation';
import { AuthRequest } from '../types';
import { generateToken } from '../utils/jwt';

const router = express.Router();

/**
 * Схема валидации для регистрации пользователя.
 * Проверяет username, email и password на соответствие форматам.
 */
const registerValidation: ValidationSchema = {
  username: { required: true, validator: 'username' },
  email: { required: true, validator: 'email' },
  password: { required: true, validator: 'password' }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "guitarist123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "securepassword123"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Пользователь уже существует или неверные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validate(registerValidation), async (req, res) => {
  const { username, email, password } = req.body;
  
  // Параллельная проверка существования пользователя по email и username
  const [existingByEmail, existingByUsername] = await Promise.all([
    UserModel.findByEmail(email),
    UserModel.findByUsername(username)
  ]);
  
  if (existingByEmail) {
    res.status(400).json({ 
      success: false, 
      error: 'Пользователь с таким email уже существует' 
    });
    return;
  }
  
  if (existingByUsername) {
    res.status(400).json({ 
      success: false, 
      error: 'Пользователь с таким именем уже существует' 
    });
    return;
  }
  
  // Создание пользователя и генерация JWT токена
  const user = await UserModel.create(username, email, password);
  const token = generateToken(user.id);
  
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Проверка наличия обязательных полей
  if (!email || !password) {
    res.status(400).json({ 
      success: false, 
      error: 'Пожалуйста, заполните все поля' 
    });
    return;
  }
  
  // Поиск пользователя и проверка пароля
  const user = await UserModel.findByEmail(email);
  if (!user || !(await UserModel.comparePassword(user, password))) {
    res.status(401).json({ 
      success: false, 
      error: 'Неверный email или пароль' 
    });
    return;
  }
  
  // Обновление времени последнего входа и генерация токена
  await UserModel.updateLastLogin(user.id);
  const token = generateToken(user.id);
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение информации о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', protect, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      error: 'Не авторизован' 
    });
    return;
  }
  
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
    },
  });
});

export default router;