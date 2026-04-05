/**
 * @fileoverview Глобальные обработчики ошибок.
 * Перехватывает ошибки приложения и возвращает клиенту
 * стандартизированный JSON ответ.
 * 
 * @module middleware/errorHandler
 */

import { Request, Response } from 'express';
import { config } from '../config';

/**
 * Глобальный обработчик ошибок сервера.
 * 
 * @param err - Объект ошибки
 * @param _req - HTTP запрос (не используется, но требуется сигнатурой Express)
 * @param res - HTTP ответ
 * 
 * @example
 * ```typescript
 * app.use(errorHandler);
 * ```
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response
): void => {
  // Логирование полного стека ошибки для отладки
  console.error('Error:', err.stack);
  
  // В production режиме не показываем детали ошибки клиенту
  const errorMessage = config.nodeEnv === 'development' 
    ? err.message 
    : 'Внутренняя ошибка сервера';
  
  res.status(500).json({
    success: false,
    error: errorMessage
  });
};

/**
 * Обработчик для несуществующих маршрутов (404 Not Found).
 * 
 * Вызывается, когда ни один маршрут не совпал с запрошенным URL.
 * 
 * @param req - HTTP запрос
 * @param res - HTTP ответ
 * 
 * @example
 * ```typescript
 * app.use(notFound);
 * app.use(errorHandler);
 * ```
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Маршрут ${req.method} ${req.url} не найден`
  });
};

/**
 * Тип для ошибки с дополнительным статус-кодом.
 * Может быть использован для кастомных ошибок в приложении.
 * 
 * @example
 * ```typescript
 * class AppError extends Error {
 *   constructor(message: string, public statusCode: number = 500) {
 *     super(message);
 *   }
 * }
 * ```
 */
export interface AppError extends Error {
  statusCode?: number;
}