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
    it('should return default port 5000 when not set in env', () => {
      delete process.env.PORT;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBe(5000);
    });

    it('should return port from environment variable', () => {
      process.env.PORT = '3000';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBe(3000);
    });

    it('should handle invalid port number (returns NaN)', () => {
      process.env.PORT = 'invalid';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.port).toBeNaN();
    });
  });

  describe('jwt', () => {
    it('should have default secret when not set in env', () => {
      delete process.env.JWT_SECRET;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.secret).toBe('my-super-secret-jwt-key-2024');
    });

    it('should return JWT_SECRET from environment variable', () => {
      process.env.JWT_SECRET = 'custom-secret-key';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.secret).toBe('custom-secret-key');
    });

    it('should have default expire time', () => {
      delete process.env.JWT_EXPIRE;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.expire).toBe('7d');
    });

    it('should return JWT_EXPIRE from environment variable', () => {
      process.env.JWT_EXPIRE = '1h';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.jwt.expire).toBe('1h');
    });
  });

  describe('nodeEnv', () => {
    it('should return development as default', () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('development');
    });

    it('should return production when set', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('production');
    });

    it('should return test when set', () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      const { config: freshConfig } = require('../index');
      expect(freshConfig.nodeEnv).toBe('test');
    });
  });

  describe('corsOrigins', () => {
    it('should be an array of allowed origins', () => {
      expect(config.corsOrigins).toBeInstanceOf(Array);
      expect(config.corsOrigins).toContain('http://localhost:3000');
      expect(config.corsOrigins).toContain('http://localhost:13000');
      expect(config.corsOrigins).toContain('http://localhost:15000');
      expect(config.corsOrigins).toContain('http://147.78.9.180:13000');
      expect(config.corsOrigins).toContain('http://147.78.9.180:15000');
    });
  });

  describe('limits', () => {
    it('should have json limit of 10mb', () => {
      expect(config.limits.json).toBe('10mb');
    });

    it('should have default page size of 50', () => {
      expect(config.limits.defaultPageSize).toBe(50);
    });

    it('should have max page size of 100', () => {
      expect(config.limits.maxPageSize).toBe(100);
    });
  });

  describe('config object', () => {
    it('should be defined', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have all required properties', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('nodeEnv');
      expect(config).toHaveProperty('corsOrigins');
      expect(config).toHaveProperty('limits');
    });
  });
});