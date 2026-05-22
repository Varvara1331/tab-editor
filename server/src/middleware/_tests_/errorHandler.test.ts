import { Request, Response } from 'express';
import { errorHandler, notFound } from '../errorHandler';
import { config } from '../../config';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    it('должен возвращать 500 с сообщением об ошибке в режиме разработки', () => {
      config.nodeEnv = 'development';
      const error = new Error('Test error');

      errorHandler(error, req as Request, res as Response);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
      });
    });

    it('должен возвращать 500 с общим сообщением в режиме производства', () => {
      config.nodeEnv = 'production';
      const error = new Error('Test error');

      errorHandler(error, req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Внутренняя ошибка сервера',
      });
    });
  });

  describe('notFound', () => {
    it('должен возвращать 404 с корректным сообщением об ошибке', () => {
      notFound(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Маршрут GET /api/test не найден',
      });
    });
  });
});