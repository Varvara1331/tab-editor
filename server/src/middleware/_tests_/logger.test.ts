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
    it('должен вызывать next и регистрировать событие finish', () => {
      logger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('должен логировать детали запроса при событии finish', () => {
      logger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/api\/test - 200 - \d+ms/)
      );
    });

    it('должен обрабатывать разные HTTP методы и статус коды', () => {
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
    it('должен вызывать next и регистрировать событие finish', () => {
      const mockJson = jest.fn().mockReturnThis();
      res.json = mockJson;

      detailedLogger(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('должен переопределять метод json для отслеживания размера ответа', () => {
      const mockResponseBody = { success: true, data: { id: 1, name: 'test' } };
      const originalJson = res.json;

      detailedLogger(req as Request, res as Response, next);

      expect(res.json).not.toBe(originalJson);

      if (res.json) {
        res.json(mockResponseBody);
      }

      expect(originalJson).toHaveBeenCalledWith(mockResponseBody);
    });

    it('должен логировать детальную информацию включая IP и User-Agent при finish', () => {
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

    it('должен обрабатывать отсутствие IP адреса', () => {
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

    it('должен обрабатывать отсутствие User-Agent', () => {
      (req.get as jest.Mock).mockReturnValue(undefined);

      detailedLogger(req as Request, res as Response, next);

      if (finishCallback) {
        finishCallback();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[unknown]')
      );
    });

    it('должен вычислять размер ответа в KB', () => {
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

    it('должен обрабатывать разные HTTP методы и статус коды в детальном режиме', () => {
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

    it('должен обрезать длинные строки User-Agent', () => {
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