import { Database } from '../index';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

jest.unmock('../../database');
jest.resetModules();

describe('Тестирование Database модуля', () => {
  let testDir: string;
  let db: Database;

  const getTestDir = () => {
    return path.join(process.cwd(), `test-data-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);
  };

  beforeEach(async () => {
    testDir = getTestDir();
    
    // @ts-ignore
    if (Database.instance) {
      // @ts-ignore
      if (Database.instance['db']) {
        try {
          // @ts-ignore
          Database.instance['db'].close();
        } catch (e) {}
      }
      // @ts-ignore
      Database.instance = null;
    }
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    db = Database.getInstance();
    
    // @ts-ignore
    db['dataDir'] = testDir;
    
    await db.initTables();
  });

  afterEach(async () => {
    try {
      const conn = db.getConnection();
      if (conn) {
        await new Promise<void>((resolve) => {
          conn.close((err) => {
            if (err) console.error('Error closing connection:', err);
            resolve();
          });
        });
      }
    } catch (e) {
      console.error('Error in closing:', e);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // @ts-ignore
    Database.instance = null;
    
    if (testDir && fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Error deleting test dir, retrying:', e);
        setTimeout(() => {
          try {
            if (fs.existsSync(testDir)) {
              fs.rmSync(testDir, { recursive: true, force: true });
            }
          } catch (err) {
            console.error('Final error deleting test dir:', err);
          }
        }, 200);
      }
    }
  });

  test('getConnection должен возвращать подключение к базе данных', () => {
    const connection = db.getConnection();
    expect(connection).toBeDefined();
    expect(connection).toBeInstanceOf(sqlite3.Database);
  });

  test('initTables должен создавать таблицу Users', async () => {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Users'"
    );
    expect(tables.length).toBe(1);
    expect(tables[0].name).toBe('Users');
  });

  test('run должен вставлять данные и возвращать lastID', async () => {
    const result = await db.run(
      'INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
      ['testuser', 'test@example.com', 'hash123']
    );
    
    expect(result.lastID).toBe(1);
    expect(result.changes).toBe(1);
  });

  test('get должен возвращать одну запись', async () => {
    await db.run(
      'INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
      ['bob', 'bob@example.com', 'hash456']
    );
    
    const user = await db.get('SELECT * FROM Users WHERE Username = ?', ['bob']);
    
    expect(user).not.toBeNull();
    expect(user.Username).toBe('bob');
    expect(user.Email).toBe('bob@example.com');
  });

  test('all должен возвращать все записи', async () => {
    await db.run('INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)', 
      ['user1', 'user1@test.com', 'hash']);
    await db.run('INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)', 
      ['user2', 'user2@test.com', 'hash']);
    
    const users = await db.all('SELECT * FROM Users ORDER BY Id');
    
    expect(users.length).toBe(2);
    expect(users[0].Username).toBe('user1');
    expect(users[1].Username).toBe('user2');
  });

  test('transaction должен успешно выполняться', async () => {
    const result = await db.transaction(async () => {
      const userResult = await db.run(
        'INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
        ['txuser', 'tx@example.com', 'hash']
      );
      return { userId: userResult.lastID };
    });
    
    expect(result.userId).toBe(1);
    
    const user = await db.get('SELECT * FROM Users WHERE Id = ?', [result.userId]);
    expect(user).not.toBeNull();
    expect(user.Username).toBe('txuser');
  });

  test('transaction должен выполнять откат при ошибке', async () => {
    await expect(
      db.transaction(async () => {
        await db.run('INSERT INTO Users (Username, Email, PasswordHash) VALUES (?, ?, ?)',
          ['temp', 'temp@test.com', 'hash']);
        throw new Error('Ошибка в транзакции');
      })
    ).rejects.toThrow('Ошибка в транзакции');
    
    const user = await db.get('SELECT * FROM Users WHERE Username = ?', ['temp']);
    expect(user).toBeNull();
  });
});