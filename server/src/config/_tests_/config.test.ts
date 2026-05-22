import { config } from '../index';

describe('Config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('port', () => {
    it('должен возвращать порт 5000 по умолчанию когда не задан в окружении', () => {
      delete process.env.PORT;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBe(5000);
    });

    it('должен возвращать порт из переменной окружения', () => {
      process.env.PORT = '3000';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBe(3000);
    });

    it('должен возвращать NaN для некорректного значения порта', () => {
      process.env.PORT = 'invalid';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBeNaN();
    });

    it('должен возвращать порт 5000 для пустой строки порта', () => {
      process.env.PORT = '';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBe(5000);
    });
  });

  describe('jwt', () => {
    it('должен иметь секрет по умолчанию когда не задан в окружении', () => {
      delete process.env.JWT_SECRET;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.secret).toBe('my-super-secret-jwt-key-2024');
    });

    it('должен возвращать JWT_SECRET из переменной окружения', () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.secret).toBe('custom-secret-key');
    });

    it('должен иметь время жизни по умолчанию', () => {
      delete process.env.JWT_EXPIRE;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.expire).toBe('7d');
    });

    it('должен возвращать JWT_EXPIRE из переменной окружения', () => {
      process.env.JWT_EXPIRE = '1h';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.expire).toBe('1h');
    });
  });

  describe('nodeEnv', () => {
    it('должен возвращать development по умолчанию', () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('development');
    });

    it('должен возвращать production когда установлен', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('production');
    });

    it('должен возвращать test когда установлен', () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('test');
    });
  });

  describe('corsOrigins', () => {
    it('должен быть массивом разрешенных источников', () => {
      expect(config.corsOrigins).toBeInstanceOf(Array);
      expect(config.corsOrigins).toContain('http://localhost:3000');
      expect(config.corsOrigins).toContain('http://localhost:13000');
      expect(config.corsOrigins).toContain('http://localhost:15000');
      expect(config.corsOrigins).toContain('http://147.78.9.180:13000');
      expect(config.corsOrigins).toContain('http://147.78.9.180:15000');
    });
  });

  describe('limits', () => {
    it('должен иметь лимит JSON 10mb', () => {
      expect(config.limits.json).toBe('10mb');
    });

    it('должен иметь размер страницы по умолчанию 50', () => {
      expect(config.limits.defaultPageSize).toBe(50);
    });

    it('должен иметь максимальный размер страницы 100', () => {
      expect(config.limits.maxPageSize).toBe(100);
    });
  });

  describe('config object', () => {
    it('должен быть определен', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('должен содержать все необходимые свойства', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('corsOrigins');
      expect(config).toHaveProperty('limits');
    });
  });
});