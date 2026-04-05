/**
 * @fileoverview Хуки для работы с аутентификацией.
 * Предоставляет доступ к информации о текущем пользователе и методам управления сессией.
 * 
 * @module hooks/useAuth
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentUser, User, isAuthenticated as checkAuth, logout as logoutService } from '../services/authService';

/**
 * Возвращаемое значение хука useAuth
 */
interface UseAuthReturn {
  /** Текущий пользователь или null, если не авторизован */
  currentUser: User | null;
  /** Флаг авторизации */
  isAuthenticated: boolean;
  /** Флаг загрузки (начальная проверка) */
  isLoading: boolean;
  /** Функция выхода из системы */
  logout: () => void;
  /** Функция принудительного обновления данных пользователя */
  refreshUser: () => void;
}

/**
 * Хук для управления аутентификацией пользователя.
 * Предоставляет информацию о текущем пользователе и методы управления сессией.
 * 
 * @returns Объект с данными о пользователе и методами управления
 * 
 * @example
 * ```typescript
 * function Profile() {
 *   const { currentUser, isAuthenticated, logout } = useAuth();
 *   
 *   if (!isAuthenticated) return <Login />;
 *   
 *   return (
 *     <div>
 *       <p>Привет, {currentUser?.username}</p>
 *       <button onClick={logout}>Выйти</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = (): UseAuthReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Обновление данных текущего пользователя
   */
  const refreshUser = useCallback(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(() => {
    logoutService();
    setCurrentUser(null);
    setIsLoading(false);
  }, []);

  /**
   * Флаг авторизации (мемоизирован)
   */
  const isAuthenticated = useMemo(() => !!currentUser, [currentUser]);

  // Загрузка данных пользователя при монтировании
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return { currentUser, isAuthenticated, isLoading, logout, refreshUser };
};

/**
 * Устаревший хук для обратной совместимости с кодом, использующим isAuthenticated как функцию.
 * 
 * @deprecated Используйте useAuth вместо этого хука
 * 
 * @example
 * ```typescript
 * // Старый способ (deprecated)
 * const { isAuthenticated } = useLegacyAuth();
 * if (isAuthenticated()) { ... }
 * 
 * // Новый способ
 * const { isAuthenticated } = useAuth();
 * if (isAuthenticated) { ... }
 * ```
 */
export const useLegacyAuth = () => {
  const { currentUser, isAuthenticated } = useAuth();
  return { 
    currentUser, 
    isAuthenticated: () => isAuthenticated 
  };
};