/**
 * @fileoverview Главный файл приложения Express.
 * Настройка middleware, маршрутов, запуск сервера.
 * 
 * @module app
 */

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initDatabase } from './database';
import { logger } from './middleware/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSwagger } from './swagger';
import authRoutes from './routes/auth';
import tabRoutes from './routes/tabs';
import publicTabsRoutes from './routes/publicTabs';
import theoryRoutes from './routes/theory';

const app = express();

// ============================================================================
// Глобальные middleware
// ============================================================================

/**
 * Настройка CORS (Cross-Origin Resource Sharing)
 * Разрешает кросс-доменные запросы из указанных источников
 */
app.use(cors({
  origin: config.corsOrigins,
  credentials: true, // Разрешение отправки cookies и заголовков авторизации
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Парсинг JSON тела запроса
 * Ограничение размера - 10MB для защиты от слишком больших запросов
 */
app.use(express.json({ limit: config.limits.json }));

/**
 * Парсинг URL-encoded данных (из HTML форм)
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Логирование всех HTTP запросов
 * Выводит метод, URL, статус и время выполнения
 */
app.use(logger);

// ============================================================================
// Документация API
// ============================================================================

/**
 * Swagger/OpenAPI документация
 * Доступна по адресу: /api-docs
 */
setupSwagger(app);

// ============================================================================
// Маршруты API
// ============================================================================

/** Маршруты аутентификации (регистрация, вход, профиль) */
app.use('/api/auth', authRoutes);

/** Маршруты для работы с табулатурами пользователя (CRUD) */
app.use('/api/tabs', tabRoutes);

/** Маршруты для публичных табулатур и избранного */
app.use('/api/public-tabs', publicTabsRoutes);

/** Маршруты для прогресса в теории */
app.use('/api/theory', theoryRoutes);

// ============================================================================
// Служебные эндпоинты
// ============================================================================

/**
 * Health check endpoint для мониторинга
 * Возвращает статус сервера и время работы
 * 
 * @example GET /health
 */
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime() // Время работы сервера в секундах
  });
});

/**
 * Корневой эндпоинт с информацией об API
 * Возвращает список доступных эндпоинтов и версию
 * 
 * @example GET /
 */
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Tab Editor API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      tabs: '/api/tabs',
      'public-tabs': '/api/public-tabs',
      theory: '/api/theory',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// ============================================================================
// Обработчики ошибок (должны быть последними)
// ============================================================================

/** Обработчик 404 - маршрут не найден */
app.use(notFound);

/** Глобальный обработчик ошибок сервера */
app.use(errorHandler);

// ============================================================================
// Запуск сервера
// ============================================================================

/**
 * Запуск HTTP сервера с инициализацией базы данных
 * 
 * @async
 * @throws {Error} При ошибке подключения к БД или запуска сервера
 */
const startServer = async (): Promise<void> => {
  try {
    // Инициализация структуры базы данных
    await initDatabase();
    
    // Запуск сервера
    const server = app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`API Documentation: http://localhost:${config.port}/api-docs`);
      console.log(`Database: SQLite`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
    
    /**
     * Корректное завершение работы сервера
     * Закрывает соединения при получении сигналов SIGINT или SIGTERM
     */
    const shutdown = (): void => {
      console.log('\nShutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };
    
    // Обработка сигналов завершения
    process.on('SIGINT', shutdown);  // Ctrl+C
    process.on('SIGTERM', shutdown); // Docker stop, systemd
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Запуск приложения
startServer();

/**
 * Экспорт приложения для тестирования
 */
export default app;