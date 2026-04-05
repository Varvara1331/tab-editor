/**
 * @fileoverview Middleware для аутентификации пользователей.
 * Проверяет JWT токен из заголовка Authorization и добавляет
 * объект пользователя в запрос.
 * 
 * @module middleware/auth
 */

import { Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

/**
 * Middleware для защиты маршрутов, требующих аутентификации.
 * 
 * Извлекает JWT из заголовка Authorization в формате `Bearer <token>`,
 * верифицирует его и добавляет данные пользователя в `req.user`.
 * 
 * @param req - HTTP запрос с возможным полем user
 * @param res - HTTP ответ
 * @param next - Функция следующего middleware
 * @returns Promise, который разрешается после завершения аутентификации
 * 
 * @example
 * ```typescript
 * // Использование в маршруте
 * router.get('/profile', protect, (req: AuthRequest, res) => {
 *   res.json({ user: req.user });
 * });
 * ```
 * 
 * @throws {401} - Токен отсутствует, неверный формат или недействителен
 * @throws {401} - Пользователь не найден в базе данных
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  // Проверка наличия и формата заголовка Authorization
  if (!authHeader?.startsWith('Bearer')) {
    res.status(401).json({ 
      success: false, 
      error: 'Не авторизован, токен отсутствует' 
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Не авторизован' 
    });
    return;
  }

  try {
    // Верификация JWT токена
    const decoded = verifyToken(token);
    
    // Поиск пользователя в базе данных
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
      return;
    }
    
    // Добавление пользователя в объект запроса для дальнейшего использования
    req.user = user;
    next();
  } catch {
    // Ошибка верификации токена (просрочен, неверная подпись и т.д.)
    res.status(401).json({ 
      success: false, 
      error: 'Не авторизован' 
    });
  }
};

/**
 * Тип для защищённого запроса с полем user.
 * 
 * @example
 * ```typescript
 * app.get('/me', protect, (req: AuthRequest, res) => {
 *   console.log(req.user?.username); // Авторизованный пользователь
 * });
 * ```
 */
export type { AuthRequest };