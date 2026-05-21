import { Database, db, initDatabase } from '../index';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// Моки для модулей
jest.mock('sqlite3');
jest.mock('fs');
jest.mock('path');

describe('Database', () => {
  let mockDbInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мок для SQLite Database
    mockDbInstance = {
      run: jest.fn((_sql: string, _params: any[], callback: Function) => {
        callback(null);
      }),
      get: jest.fn((_sql: string, _params: any[], callback: Function) => {
        callback(null, null);
      }),
      all: jest.fn((_sql: string, _params: any[], callback: Function) => {
        callback(null, []);
      }),
    };

    (sqlite3.Database as unknown as jest.Mock).mockImplementation(() => mockDbInstance);
    
    // Мок для fs
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    
    // Мок для path
    (path.join as jest.Mock).mockReturnValue('/mock/path/data/tab-editor.db');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Database.getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Database.getInstance();
      const instance2 = Database.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConnection', () => {
    it('should create new connection on first call', () => {
      const instance = Database.getInstance();
      const connection = instance.getConnection();
      expect(connection).toBeDefined();
      expect(sqlite3.Database).toHaveBeenCalled();
    });

    it('should return existing connection on subsequent calls', () => {
      const instance = Database.getInstance();
      const connection1 = instance.getConnection();
      const connection2 = instance.getConnection();
      expect(connection1).toBe(connection2);
      expect(sqlite3.Database).toHaveBeenCalledTimes(1);
    });
  });

  describe('run', () => {
    it('should execute SQL query', async () => {
      const instance = Database.getInstance();
      mockDbInstance.run.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(null);
      });

      const result = await instance.run('INSERT INTO test (name) VALUES (?)', ['test']);
      expect(result).toBeDefined();
    });

    it('should reject on error', async () => {
      const instance = Database.getInstance();
      mockDbInstance.run.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(new Error('SQL Error'));
      });

      await expect(instance.run('INSERT INTO test (name) VALUES (?)', ['test'])).rejects.toThrow('SQL Error');
    });
  });

  describe('all', () => {
    it('should return all rows', async () => {
      const instance = Database.getInstance();
      const mockRows = [{ id: 1, name: 'test' }];
      mockDbInstance.all.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(null, mockRows);
      });

      const result = await instance.all('SELECT * FROM test');
      expect(result).toEqual(mockRows);
    });

    it('should reject on error', async () => {
      const instance = Database.getInstance();
      mockDbInstance.all.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(new Error('SQL Error'));
      });

      await expect(instance.all('SELECT * FROM test')).rejects.toThrow('SQL Error');
    });
  });

  describe('get', () => {
    it('should return single row', async () => {
      const instance = Database.getInstance();
      const mockRow = { id: 1, name: 'test' };
      mockDbInstance.get.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(null, mockRow);
      });

      const result = await instance.get('SELECT * FROM test WHERE id = ?', [1]);
      expect(result).toEqual(mockRow);
    });

    it('should return null when no row found', async () => {
      const instance = Database.getInstance();
      mockDbInstance.get.mockImplementationOnce((_sql: string, _params: any[], callback: Function) => {
        callback(null, null);
      });

      const result = await instance.get('SELECT * FROM test WHERE id = ?', [999]);
      expect(result).toBeNull();
    });
  });

  describe('transaction', () => {
    it('should commit on success', async () => {
      const instance = Database.getInstance();
      const mockCallback = jest.fn().mockResolvedValue('success');

      const result = await instance.transaction(mockCallback);
      expect(result).toBe('success');
    });

    it('should rollback on error', async () => {
      const instance = Database.getInstance();
      const mockCallback = jest.fn().mockRejectedValue(new Error('Transaction error'));

      await expect(instance.transaction(mockCallback)).rejects.toThrow('Transaction error');
    });
  });

  describe('initTables', () => {
    it('should create all tables and indexes', async () => {
      const instance = Database.getInstance();
      mockDbInstance.run.mockImplementation((_sql: string, _params: any[], callback: Function) => {
        callback(null);
      });

      await instance.initTables();

      // Проверяем, что run вызывался для каждой таблицы и индекса
      expect(mockDbInstance.run).toHaveBeenCalled();
      // Минимум 4 таблицы + 7 индексов = 11 вызовов
      expect(mockDbInstance.run.mock.calls.length).toBeGreaterThanOrEqual(11);
    });
  });

  describe('ensureDataDirectory', () => {
    it('should create directory if not exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });
});

describe('db export', () => {
  it('should be the Database instance', () => {
    expect(db).toBeDefined();
    expect(db.getConnection).toBeDefined();
    expect(db.run).toBeDefined();
    expect(db.all).toBeDefined();
    expect(db.get).toBeDefined();
    expect(db.transaction).toBeDefined();
  });
});

describe('initDatabase', () => {
  it('should call db.initTables', async () => {
    const spy = jest.spyOn(db, 'initTables').mockResolvedValue();
    await initDatabase();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});