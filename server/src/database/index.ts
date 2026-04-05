/**
 * @fileoverview Модуль для работы с SQLite базой данных.
 * Реализует паттерн Singleton для управления подключением к БД,
 * предоставляет асинхронные методы для выполнения запросов и
 * инициализации таблиц с индексами.
 * 
 * @module database
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Класс для управления подключением к SQLite базе данных.
 * Использует паттерн Singleton для обеспечения единственного экземпляра.
 * 
 * @public
 */
class Database {
  private static instance: Database;
  private db: sqlite3.Database | null = null;
  private readonly dataDir: string;

  private constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.ensureDataDirectory();
  }

  /**
   * Возвращает единственный экземпляр Database.
   * 
   * @returns Экземпляр Database
   */
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Создаёт директорию для данных, если она не существует.
   * 
   * @private
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Возвращает полный путь к файлу базы данных.
   * 
   * @returns Путь к файлу БД
   * @private
   */
  private getDbPath(): string {
    return path.join(this.dataDir, 'tab-editor.db');
  }

  /**
   * Возвращает активное подключение к БД.
   * При первом вызове устанавливает соединение.
   * 
   * @returns Подключение к SQLite
   */
  getConnection(): sqlite3.Database {
    if (!this.db) {
      this.db = new sqlite3.Database(this.getDbPath());
    }
    return this.db;
  }

  /**
   * Выполняет SQL запрос, возвращая количество затронутых строк и lastInsertId.
   * 
   * @param sql - SQL запрос
   * @param params - Параметры запроса
   * @returns Результат выполнения с lastID и changes
   * 
   * @example
   * ```typescript
   * const result = await db.run('INSERT INTO Users (name) VALUES (?)', ['John']);
   * console.log(result.lastID); // ID новой записи
   * ```
   */
  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const connection = this.getConnection();
    return new Promise((resolve, reject) => {
      connection.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Выполняет SQL запрос и возвращает все строки результата.
   * 
   * @template T - Тип возвращаемых данных
   * @param sql - SQL запрос
   * @param params - Параметры запроса
   * @returns Массив строк результата
   * 
   * @example
   * ```typescript
   * const users = await db.all<User>('SELECT * FROM Users WHERE age > ?', [18]);
   * ```
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const connection = this.getConnection();
    return new Promise((resolve, reject) => {
      connection.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }

  /**
   * Выполняет SQL запрос и возвращает первую строку результата.
   * 
   * @template T - Тип возвращаемых данных
   * @param sql - SQL запрос
   * @param params - Параметры запроса
   * @returns Первая строка результата или null
   * 
   * @example
   * ```typescript
   * const user = await db.get<User>('SELECT * FROM Users WHERE id = ?', [1]);
   * ```
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const connection = this.getConnection();
    return new Promise((resolve, reject) => {
      connection.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T || null);
      });
    });
  }

  /**
   * Выполняет операции в транзакции.
   * Автоматически выполняет BEGIN, COMMIT или ROLLBACK при ошибке.
   * 
   * @template T - Тип возвращаемого результата
   * @param callback - Функция с операциями внутри транзакции
   * @returns Результат выполнения callback
   * 
   * @example
   * ```typescript
   * const result = await db.transaction(async () => {
   *   await db.run('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
   *   await db.run('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
   *   return { success: true };
   * });
   * ```
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.run('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.run('COMMIT');
      return result;
    } catch (error) {
      await this.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Инициализирует структуру базы данных.
   * Создаёт таблицы Users, Tabs, Library, TheoryProgress и необходимые индексы.
   * 
   * @returns Promise, который разрешается после завершения инициализации
   */
  async initTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS Users (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT NOT NULL UNIQUE,
        Email TEXT NOT NULL UNIQUE,
        PasswordHash TEXT NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastLogin DATETIME,
        Settings TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS Tabs (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER NOT NULL,
        Title TEXT NOT NULL,
        Artist TEXT,
        Tuning TEXT NOT NULL,
        Measures TEXT NOT NULL,
        NotesPerMeasure INTEGER DEFAULT 16,
        IsPublic INTEGER DEFAULT 0,
        Views INTEGER DEFAULT 0,
        Likes INTEGER DEFAULT 0,
        Preview TEXT,
        Tags TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS Library (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER NOT NULL,
        TabId INTEGER NOT NULL,
        TabData TEXT NOT NULL,
        IsPublication INTEGER DEFAULT 0,
        OriginalAuthorId INTEGER,
        OriginalAuthorName TEXT,
        AddedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastOpened DATETIME,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        FOREIGN KEY (TabId) REFERENCES Tabs(Id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS TheoryProgress (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER NOT NULL,
        CompletedArticles TEXT NOT NULL DEFAULT '[]',
        LastRead DATETIME,
        QuizScores TEXT DEFAULT '{}',
        TotalPoints INTEGER DEFAULT 0,
        LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        UNIQUE(UserId)
      )`,
    ];

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_tabs_userid ON Tabs(UserId)`,
      `CREATE INDEX IF NOT EXISTS idx_tabs_createdat ON Tabs(CreatedAt)`,
      `CREATE INDEX IF NOT EXISTS idx_tabs_ispublic ON Tabs(IsPublic)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email)`,
      `CREATE INDEX IF NOT EXISTS idx_library_userid ON Library(UserId)`,
      `CREATE INDEX IF NOT EXISTS idx_library_tabid ON Library(TabId)`,
      `CREATE INDEX IF NOT EXISTS idx_theoryprogress_userid ON TheoryProgress(UserId)`,
    ];

    // Выполнение всех запросов на создание таблиц
    for (const query of queries) {
      await this.run(query);
    }
    
    // Выполнение всех запросов на создание индексов
    for (const index of indexes) {
      await this.run(index);
    }
  }
}

/**
 * Синглтон экземпляр Database для использования во всём приложении.
 */
export const db = Database.getInstance();

/**
 * Функция для инициализации базы данных.
 * Удобная обёртка над db.initTables().
 */
export const initDatabase = (): Promise<void> => db.initTables();