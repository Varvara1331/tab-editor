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
 * Хук для управления состоянием аутентификации.
 * Предоставляет состояние входа, данные пользователя и обработчики для событий аутентификации.
 * Автоматически проверяет статус при монтировании компонента.
 * 
 * @returns Объект с состоянием аутентификации и методами управления
 * 
 * @example
 * ```tsx
 * const { isLoggedIn, currentUser, isLoading, handleAuthSuccess, handleLogout } = useAuthState();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!isLoggedIn) return <Auth onAuthSuccess={handleAuthSuccess} />;
 * 
 * return (
 *   <div>
 *     <p>Добро пожаловать, {currentUser?.username}!</p>
 *     <button onClick={handleLogout}>Выйти</button>
 *   </div>
 * );
 * ```
 */
export const useAuthState = (): UseAuthStateReturn => {
  /** Флаг авторизации пользователя */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  /** Текущий пользователь */
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  /** Флаг загрузки состояния */
  const [isLoading, setIsLoading] = useState(true);

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
   * Обработчик успешной аутентификации.
   * Очищает состояние редактора и обновляет данные пользователя.
   */
  const handleAuthSuccess = useCallback(() => {
    clearEditorState();
    setIsLoggedIn(true);
    setCurrentUser(getCurrentUser());
  }, []);

  /**
   * Обработчик выхода из системы.
   * Запрашивает подтверждение у пользователя и выполняет выход.
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