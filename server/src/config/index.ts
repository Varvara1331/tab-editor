/**
 * @fileoverview Централизованная конфигурация приложения.
 * Загружает переменные окружения из .env файла и предоставляет типизированный
 * объект конфигурации для всего приложения.
 * 
 * @module config
 */

import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

/**
 * Объект конфигурации приложения с значениями по умолчанию.
 * 
 * @public
 */
export const config = {
  /** Порт HTTP сервера */
  port: parseInt(process.env.PORT || '5000', 10),
  
  /** Настройки JWT аутентификации */
  jwt: {
    /** Секретный ключ для подписи токенов (минимум 32 символа) */
    secret: process.env.JWT_SECRET || 'my-super-secret-jwt-key-2024',
    /** Время жизни токена (формат: '7d', '24h', '30m') */
    expire: process.env.JWT_EXPIRE || '7d',
  } as const,
  
  /** Текущее окружение: development | production | test */
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /** Разрешённые источники для CORS */
  corsOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  
  /** Лимиты для обработки входящих запросов */
  limits: {
    /** Максимальный размер JSON тела запроса */
    json: '10mb',
    /** Количество записей на странице по умолчанию */
    defaultPageSize: 50,
    /** Максимально допустимое количество записей на странице */
    maxPageSize: 100,
  } as const,
};

/**
 * Тип конфигурации приложения.
 * Выводится автоматически из объекта config.
 */
export type AppConfig = typeof config;