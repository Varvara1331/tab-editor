/**
 * @fileoverview Сервис для управления пользователями.
 * Содержит бизнес-логику создания пользователей, поиска,
 * аутентификации и управления профилями.
 * 
 * @module services/userService
 */

import bcrypt from 'bcryptjs';
import { db } from '../database';
import { IUser } from '../types';
import { parseJson } from '../utils/helpers';

/**
 * Сервис для работы с пользователями.
 * Все методы статические, предоставляют операции управления пользователями.
 * 
 * @public
 */
export class UserService {
  /**
   * Количество раундов соли для хеширования пароля.
   * 10 раундов - хороший баланс между безопасностью и производительностью.
   * 
   * @private
   */
  private static readonly SALT_ROUNDS = 10;

  /**
   * Создание нового пользователя.
   * 
   * Автоматически хеширует пароль перед сохранением в базу данных.
   * 
   * @param username - Имя пользователя (должно быть уникальным, 3-50 символов)
   * @param email - Email пользователя (должен быть уникальным, корректный формат)
   * @param password - Пароль в открытом виде (будет захэширован, минимум 6 символов)
   * @returns Созданный пользователь с автоматически сгенерированным ID
   * @throws {Error} Если не удалось создать пользователя (ошибка БД или дубликат)
   * 
   * @example
   * ```typescript
   * const newUser = await UserService.create('guitarist', 'guitar@example.com', 'securePass123');
   * console.log(`Пользователь ${newUser.username} создан с ID ${newUser.id}`);
   * ```
   */
  static async create(username: string, email: string, password: string): Promise<IUser> {
    // Хеширование пароля для безопасного хранения
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    
    const result = await db.run(
      `INSERT INTO Users (Username, Email, PasswordHash, CreatedAt) 
       VALUES (?, ?, ?, datetime('now'))`,
      [username, email, passwordHash]
    );
    
    const user = await this.findById(result.lastID);
    if (!user) throw new Error('Failed to create user');
    
    return user;
  }

  /**
   * Поиск пользователя по email.
   * 
   * @param email - Email для поиска (регистронезависимый в БД)
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserService.findByEmail('user@example.com');
   * if (user) {
   *   console.log(`Пользователь найден: ${user.username}`);
   * }
   * ```
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    const row = await db.get<any>('SELECT * FROM Users WHERE Email = ?', [email]);
    if (!row) return null;
    return this.mapUser(row);
  }

  /**
   * Поиск пользователя по имени пользователя.
   * 
   * @param username - Имя пользователя для поиска
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserService.findByUsername('john_doe');
   * if (user) {
   *   console.log(`Email пользователя: ${user.email}`);
   * }
   * ```
   */
  static async findByUsername(username: string): Promise<IUser | null> {
    const row = await db.get<any>('SELECT * FROM Users WHERE Username = ?', [username]);
    if (!row) return null;
    return this.mapUser(row);
  }

  /**
   * Поиск пользователя по ID.
   * 
   * @param id - ID пользователя
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserService.findById(1);
   * if (user) {
   *   console.log(`Пользователь: ${user.username}`);
   * }
   * ```
   */
  static async findById(id: number): Promise<IUser | null> {
    const user = await db.get<any>('SELECT * FROM Users WHERE Id = ?', [id]);
    if (!user) return null;
    return this.mapUser(user);
  }

  /**
   * Обновление времени последнего входа пользователя.
   * 
   * Используется при успешной аутентификации для отслеживания активности.
   * 
   * @param id - ID пользователя
   * 
   * @example
   * ```typescript
   * // При успешном входе в систему
   * await UserService.updateLastLogin(user.id);
   * ```
   */
  static async updateLastLogin(id: number): Promise<void> {
    await db.run('UPDATE Users SET LastLogin = datetime("now") WHERE Id = ?', [id]);
  }

  /**
   * Проверка пароля пользователя.
   * 
   * Сравнивает введённый пароль с захэшированным паролем из базы данных.
   * 
   * @param user - Объект пользователя (должен содержать поле passwordHash)
   * @param password - Пароль для проверки (в открытом виде)
   * @returns true если пароль верный, false в противном случае
   * 
   * @example
   * ```typescript
   * const user = await UserService.findByEmail('user@example.com');
   * const isValid = await UserService.comparePassword(user, 'entered-password');
   * if (isValid) {
   *   // Пароль правильный
   *   console.log('Успешный вход');
   * }
   * ```
   */
  static async comparePassword(user: IUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Преобразование строки из БД в объект IUser.
   * 
   * Выполняет парсинг JSON поля Settings и преобразование дат.
   * 
   * @param row - Строка из БД
   * @returns Объект пользователя
   * @private
   */
  private static mapUser(row: any): IUser {
    return {
      id: row.Id,
      username: row.Username,
      email: row.Email,
      passwordHash: row.PasswordHash,
      createdAt: new Date(row.CreatedAt),
      lastLogin: row.LastLogin ? new Date(row.LastLogin) : undefined,
      settings: parseJson(row.Settings, undefined),
    };
  }
}

/**
 * Тип для публичных данных пользователя (без пароля и чувствительных полей).
 * Используется для отправки клиенту.
 * 
 * @example
 * ```typescript
 * const publicUser: PublicUser = {
 *   id: user.id,
 *   username: user.username,
 *   email: user.email,
 *   createdAt: user.createdAt
 * };
 * ```
 */
export type PublicUser = Omit<IUser, 'passwordHash'>;

/**
 * Тип для данных регистрации нового пользователя.
 */
export type RegisterData = {
  username: string;
  email: string;
  password: string;
};

/**
 * Тип для данных входа в систему.
 */
export type LoginData = {
  email: string;
  password: string;
};