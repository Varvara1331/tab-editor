/**
 * @fileoverview Хук для управления состоянием аутентификации.
 * 
 * @module hooks/useAuthState
 */

import { useState, useEffect, useCallback } from 'react';
import { isAuthenticated, logout, getCurrentUser, User, clearEditorState } from '../services/authService';

/**
 * Возвращаемое значение хука useAuthState
 */
interface UseAuthStateReturn {
  /** Флаг авторизации */
  isLoggedIn: boolean;
  /** Текущий пользователь */
  currentUser: User | null;
  /** Флаг загрузки */
  isLoading: boolean;
  /** Обработчик успешной аутентификации */
  handleAuthSuccess: () => void;
  /** Обработчик выхода из системы */
  handleLogout: () => void;
}

/**
 * Хук для управления состоянием аутентификации
 * 
 * @returns Объект с состоянием аутентификации и методами управления
 * 
 * @example
 * ```typescript
 * const { isLoggedIn, currentUser, isLoading, handleAuthSuccess, handleLogout } = useAuthState();
 * ```
 */
export const useAuthState = (): UseAuthStateReturn => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка аутентификации при монтировании компонента
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      if (authenticated) {
        setCurrentUser(getCurrentUser());
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  /**
   * Обработчик успешной аутентификации
   */
  const handleAuthSuccess = useCallback(() => {
    clearEditorState();
    setIsLoggedIn(true);
    setCurrentUser(getCurrentUser());
  }, []);

  /**
   * Обработчик выхода из системы
   */
  const handleLogout = useCallback(() => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  return { isLoggedIn, currentUser, isLoading, handleAuthSuccess, handleLogout };
};