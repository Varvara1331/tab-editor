/**
 * @fileoverview Middleware для логирования HTTP запросов.
 * Записывает в консоль метод, URL, статус-код и время выполнения.
 * 
 * @module middleware/logger
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для логирования всех входящих запросов.
 * 
 * Замеряет время выполнения запроса от получения до отправки ответа
 * и выводит в консоль информацию в формате:
 * `METHOD /url - STATUS - DURATIONms`
 * 
 * @param req - HTTP запрос
 * @param res - HTTP ответ
 * @param next - Функция следующего middleware
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { logger } from './middleware/logger';
 * 
 * const app = express();
 * app.use(logger); // Логирование всех запросов
 * ```
 * 
 * @example
 * ```text
 * // Пример вывода в консоль:
 * GET /api/tabs - 200 - 45ms
 * POST /api/auth/login - 201 - 120ms
 * GET /api/public-tabs - 304 - 12ms
 * ```
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Подписка на событие завершения ответа
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logMessage = `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`;
    console.log(logMessage);
  });
  
  // Передача управления следующему middleware
  next();
};

/**
 * Расширенная версия логгера с дополнительной информацией.
 * Включает IP адрес, User-Agent и размер ответа.
 * 
 * @example
 * ```typescript
 * app.use(detailedLogger);
 * // Вывод: GET /api/tabs - 200 - 45ms [127.0.0.1] [Mozilla/5.0...] 2.3KB
 * ```
 */
export const detailedLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent') || 'unknown';
  
  let responseSize = 0;
  const originalJson = res.json;
  
  // Перехват json метода для подсчёта размера ответа
  res.json = function(body: any): Response {
    responseSize = Buffer.byteLength(JSON.stringify(body), 'utf8');
    return originalJson.call(this, body);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const sizeInKB = (responseSize / 1024).toFixed(1);
    console.log(
      `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms ` +
      `[${ip}] [${userAgent.slice(0, 50)}] ${sizeInKB}KB`
    );
  });
  
  next();
};