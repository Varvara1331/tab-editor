/**
 * @fileoverview Конфигурация Swagger/OpenAPI для автоматической документации API.
 * 
 * @module swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Конфигурация Swagger/OpenAPI
 * 
 * @see https://swagger.io/specification/
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tab Editor API',
      version: '1.0.0',
      description: `
API для редактора гитарных табулатур.

## Возможности:
- Создание и редактирование табулатур
- Публикация табулатур для других пользователей
- Добавление публичных табулатур в избранное
- Отслеживание прогресса в изучении теории музыки
- Система очков и таблица лидеров

## Аутентификация:
Для доступа к защищённым маршрутам необходимо добавить JWT токен в заголовок:
\`Authorization: Bearer <your-token>\`
      `,
      contact: {
        name: 'Tab Editor Support',
        email: 'support@tabeditor.com',
        url: 'https://github.com/tabeditor',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.tabeditor.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен, полученный при регистрации или входе',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'guitarist123' },
            email: { type: 'string', example: 'user@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Tab: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Smoke on the Water' },
            artist: { type: 'string', example: 'Deep Purple', nullable: true },
            tuning: { 
              type: 'array', 
              items: { type: 'string' }, 
              example: ['E', 'A', 'D', 'G', 'B', 'E'],
              description: 'Строй гитары (6 строк)'
            },
            measures: { 
              type: 'array', 
              description: 'Массив тактов табулатуры с нотами' 
            },
            notesPerMeasure: { 
              type: 'integer', 
              default: 16,
              description: 'Количество нот в такте'
            },
            isPublic: { 
              type: 'boolean', 
              default: false,
              description: 'Публичная ли табулатура'
            },
            views: { type: 'integer', default: 0 },
            likes: { type: 'integer', default: 0 },
            preview: { type: 'string', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FavoriteTab: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            title: { type: 'string' },
            artist: { type: 'string', nullable: true },
            authorName: { type: 'string', description: 'Имя автора табулатуры' },
            addedAt: { type: 'string', format: 'date-time' },
          },
        },
        LibraryItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            tabId: { type: 'integer' },
            isPublication: { type: 'boolean' },
            originalAuthorName: { type: 'string' },
            addedAt: { type: 'string', format: 'date-time' },
            lastOpened: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        TheoryProgress: {
          type: 'object',
          properties: {
            userId: { type: 'integer' },
            completedArticles: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'ID пройденных статей'
            },
            lastRead: { type: 'string', format: 'date-time', nullable: true },
            quizScores: { 
              type: 'object', 
              additionalProperties: { type: 'integer' },
              description: 'Оценки за тесты (0-100)'
            },
            totalPoints: { type: 'integer', description: 'Сумма всех оценок' },
          },
        },
        TheoryStatistics: {
          type: 'object',
          properties: {
            totalArticlesCompleted: { type: 'integer' },
            totalPoints: { type: 'integer' },
            averageScore: { type: 'number' },
            lastActive: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            userId: { type: 'integer' },
            username: { type: 'string' },
            totalPoints: { type: 'integer' },
            articlesCompleted: { type: 'integer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Аутентификация и управление пользователями' },
      { name: 'Tabs', description: 'CRUD операции с табулатурами пользователя' },
      { name: 'Public Tabs', description: 'Публичные табулатуры и избранное' },
      { name: 'Theory', description: 'Прогресс в изучении теории музыки' },
    ],
  },
  // Пути к файлам с JSDoc аннотациями для автоматического сбора документации
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

/**
 * Сгенерированная Swagger спецификация в формате OpenAPI 3.0
 */
export const swaggerSpec = swaggerJsdoc(options);

/**
 * Настройка Swagger UI для Express приложения.
 * 
 * Добавляет два эндпоинта:
 * - GET /api-docs - Swagger UI интерфейс
 * - GET /api-docs.json - Сырая OpenAPI спецификация в JSON
 * 
 * @param app - Express приложение
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { setupSwagger } from './swagger';
 * 
 * const app = express();
 * setupSwagger(app);
 * ```
 */
export const setupSwagger = (app: Express): void => {
  // Swagger UI для просмотра документации в браузере
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // JSON спецификация для инструментов и генерации клиентов
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

/**
 * Тип для Swagger спецификации
 */
export type SwaggerSpec = typeof swaggerSpec;