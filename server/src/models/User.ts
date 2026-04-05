/**
 * @fileoverview Модель для работы с пользователями.
 * Предоставляет интерфейс к UserService для контроллеров.
 * 
 * @module models/User
 */

import { UserService } from '../services/userService';
import { IUser } from '../types';

/**
 * Объект модели User с методами для работы с пользователями.
 * 
 * Все методы делегируются UserService с привязкой контекста.
 * Эта прослойка обеспечивает:
 * - Единый интерфейс для контроллеров
 * - Возможность легко заменить реализацию сервиса
 * - Упрощение тестирования (можно замокать модель)
 * 
 * @public
 * 
 * @example
 * ```typescript
 * // Использование в контроллере
 * import { UserModel } from '../models/User';
 * 
 * // Регистрация нового пользователя
 * const user = await UserModel.create('john', 'john@example.com', 'password123');
 * 
 * // Поиск пользователя для входа
 * const existingUser = await UserModel.findByEmail('john@example.com');
 * if (existingUser && await UserModel.comparePassword(existingUser, 'password123')) {
 *   // Успешный вход
 * }
 * ```
 */
export const UserModel = {
  /**
   * Создание нового пользователя.
   * 
   * Автоматически хеширует пароль перед сохранением в базу данных.
   * 
   * @param username - Имя пользователя (должно быть уникальным, 3-50 символов)
   * @param email - Email пользователя (должен быть уникальным, корректный формат)
   * @param password - Пароль в открытом виде (будет захэширован, минимум 6 символов)
   * @returns Созданный пользователь с автоматически сгенерированным ID
   * @throws {Error} Если не удалось создать пользователя (дубликат email/username)
   * 
   * @example
   * ```typescript
   * const newUser = await UserModel.create('guitarist', 'guitar@example.com', 'securePass123');
   * console.log(`Пользователь ${newUser.username} создан с ID ${newUser.id}`);
   * ```
   */
  create: UserService.create.bind(UserService),
  
  /**
   * Поиск пользователя по email.
   * 
   * @param email - Email для поиска (регистронезависимый в БД)
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserModel.findByEmail('user@example.com');
   * if (user) {
   *   // Пользователь найден
   * }
   * ```
   */
  findByEmail: UserService.findByEmail.bind(UserService),
  
  /**
   * Поиск пользователя по имени пользователя.
   * 
   * @param username - Имя пользователя для поиска
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserModel.findByUsername('john_doe');
   * ```
   */
  findByUsername: UserService.findByUsername.bind(UserService),
  
  /**
   * Поиск пользователя по ID.
   * 
   * @param id - ID пользователя
   * @returns Найденный пользователь или null, если не найден
   * 
   * @example
   * ```typescript
   * const user = await UserModel.findById(1);
   * ```
   */
  findById: UserService.findById.bind(UserService),
  
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
   * await UserModel.updateLastLogin(user.id);
   * ```
   */
  updateLastLogin: UserService.updateLastLogin.bind(UserService),
  
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
   * const user = await UserModel.findByEmail('user@example.com');
   * const isValid = await UserModel.comparePassword(user, 'entered-password');
   * if (isValid) {
   *   // Пароль правильный
   * }
   * ```
   */
  comparePassword: UserService.comparePassword.bind(UserService),
} as const;

/**
 * Тип для объекта пользователя.
 * Содержит основную информацию о пользователе без чувствительных данных.
 */
export type { IUser };

/**
 * Тип для объекта UserModel (все методы модели).
 * Полезен для тестирования и создания моков.
 */
export type UserModelType = typeof UserModel;

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