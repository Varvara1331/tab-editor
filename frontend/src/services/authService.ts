/**
 * @fileoverview Сервис аутентификации.
 * Управление регистрацией, входом, выходом и сессией пользователя.
 * 
 * @module services/authService
 */

import { api, ApiResponse, STORAGE_KEYS } from './api';
import { getErrorMessage } from './errors';

/**
 * Пользователь системы
 */
export interface User {
  /** ID пользователя */
  id: number;
  /** Имя пользователя */
  username: string;
  /** Email пользователя */
  email: string;
  /** Дата регистрации */
  createdAt: string;
  /** Дата последнего входа */
  lastLogin?: string;
}

/**
 * Ответ аутентификации
 */
export interface AuthResponse extends ApiResponse {
  /** JWT токен */
  token?: string;
  /** Данные пользователя */
  user?: User;
}

/**
 * Сохранение сессии в localStorage
 * 
 * @param token - JWT токен
 * @param user - Данные пользователя
 * @private
 */
const saveSession = (token: string, user: User): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Очистка сессии из localStorage
 * 
 * @private
 */
const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Очистка черновиков редактора
 * 
 * @param userId - ID пользователя (опционально)
 * 
 * @example
 * ```typescript
 * clearEditorDrafts(123); // Удалит черновики для пользователя 123
 * clearEditorDrafts(); // Удалит общие черновики
 * ```
 */
export const clearEditorDrafts = (userId?: number): void => {
  if (userId) {
    localStorage.removeItem(`currentTab_${userId}`);
  }
  localStorage.removeItem('currentTabData');
};

/**
 * Очистка состояния редактора (алиас для clearEditorDrafts)
 */
export const clearEditorState = clearEditorDrafts;

/**
 * Регистрация нового пользователя
 * 
 * @param username - Имя пользователя
 * @param email - Email
 * @param password - Пароль
 * @returns Ответ с токеном и данными пользователя при успехе
 * 
 * @example
 * ```typescript
 * const result = await register('john', 'john@example.com', 'password123');
 * if (result.success) {
 *   console.log('Регистрация успешна');
 * }
 * ```
 */
export const register = async (
  username: string, 
  email: string, 
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', { 
      username, 
      email, 
      password 
    });
    
    if (response.data.success && response.data.token && response.data.user) {
      saveSession(response.data.token, response.data.user);
    }
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, 'Ошибка при регистрации') 
    };
  }
};

/**
 * Вход пользователя в систему
 * 
 * @param email - Email пользователя
 * @param password - Пароль
 * @returns Ответ с токеном и данными пользователя при успехе
 * 
 * @example
 * ```typescript
 * const result = await login('john@example.com', 'password123');
 * if (result.success) {
 *   console.log('Вход выполнен');
 * }
 * ```
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    
    if (response.data.success && response.data.token && response.data.user) {
      saveSession(response.data.token, response.data.user);
    }
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, 'Ошибка при входе') 
    };
  }
};

/**
 * Выход пользователя из системы
 * Очищает сессию и черновики редактора
 * 
 * @example
 * ```typescript
 * logout(); // Пользователь выходит из системы
 * ```
 */
export const logout = (): void => {
  const user = getCurrentUser();
  clearEditorDrafts(user?.id);
  clearSession();
};

/**
 * Получение текущего авторизованного пользователя
 * 
 * @returns Данные пользователя или null, если не авторизован
 * 
 * @example
 * ```typescript
 * const user = getCurrentUser();
 * if (user) {
 *   console.log(`Привет, ${user.username}`);
 * }
 * ```
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Проверка, авторизован ли пользователь
 * 
 * @returns true если есть валидный токен
 * 
 * @example
 * ```typescript
 * if (isAuthenticated()) {
 *   // Показать защищённый контент
 * }
 * ```
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
};

/**
 * Получение JWT токена
 * 
 * @returns Токен или null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};