import { Request, Response, NextFunction } from 'express';
import { logger, detailedLogger } from '../logger';

describe('Logger Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleLogSpy: jest.SpyInstance;
  let finishCallback: (() => void) | null = null;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      socket: { remoteAddress: '127.0.0.1' } as any,
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
    };
    res = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
        return res as Response;
      }),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    finishCallback = null;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('logger', () => {
    it('should call next and register finish event', () => {
      logger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log request details on finish event', () => {
      logger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/api\/test - 200 - \d+ms/)
      );
    });

    it('should handle different HTTP methods and status codes', () => {
      req.method = 'POST';
      res.statusCode = 201;

      logger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/POST \/api\/test - 201 - \d+ms/)
      );
    });
  });

  describe('detailedLogger', () => {
    it('should call next and register finish event', () => {
      const mockJson = jest.fn().mockReturnThis();
      res.json = mockJson;

      detailedLogger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should override json method to track response size', () => {
      const mockResponseBody = { success: true, data: { id: 1, name: 'test' } };
      const originalJson = res.json;

      detailedLogger(req as Request, res as Response, next);

      expect(res.json).not.toBe(originalJson);

      if (res.json) {
        res.json(mockResponseBody);
      }

      expect(originalJson).toHaveBeenCalledWith(mockResponseBody);
    });

    it('should log detailed info including IP and User-Agent on finish', () => {
      detailedLogger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test - 200 -')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[127.0.0.1]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Mozilla/5.0 Test Browser]')
      );
    });

    it('should handle missing IP address', () => {
      // Создаём новый объект req без ip, с socket.remoteAddress
      const reqWithoutIp: Partial<Request> = {
        method: 'GET',
        url: '/api/test',
        socket: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      };

      detailedLogger(reqWithoutIp as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[192.168.1.1]')
      );
    });

    it('should handle missing User-Agent', () => {
      (req.get as jest.Mock).mockReturnValue(undefined);

      detailedLogger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[unknown]')
      );
    });

    it('should calculate response size in KB', () => {
      const mockResponseBody = { success: true, data: { id: 1, name: 'test' } };
      
      detailedLogger(req as Request, res as Response, next);
      
      if (res.json) {
        res.json(mockResponseBody);
      }
      
      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d+(\.\d+)?KB/)
      );
    });

    it('should handle different HTTP methods and status codes in detailed mode', () => {
      req.method = 'DELETE';
      res.statusCode = 204;

      detailedLogger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/DELETE \/api\/test - 204 - \d+ms/)
      );
    });

    it('should truncate long User-Agent strings', () => {
      const longUserAgent = 'VeryLongUserAgentStringThatExceedsFiftyCharactersAndShouldBeTruncated';
      (req.get as jest.Mock).mockReturnValue(longUserAgent);

      detailedLogger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(longUserAgent.slice(0, 50))
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.not.stringContaining(longUserAgent.slice(50))
      );
    });
  });
});