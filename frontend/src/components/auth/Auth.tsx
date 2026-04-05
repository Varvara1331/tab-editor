/**
 * @fileoverview Компонент аутентификации (вход/регистрация).
 * Предоставляет форму для входа в существующий аккаунт или регистрации нового.
 * 
 * @module components/auth/Auth
 */

import React, { useState, useCallback, memo, useRef } from 'react';
import { login, register } from '../../services/authService';

/**
 * Свойства компонента Auth
 */
interface AuthProps {
  /** Функция обратного вызова при успешной аутентификации */
  onAuthSuccess: () => void;
}

/**
 * Компонент аутентификации (вход/регистрация)
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент формы аутентификации
 * 
 * @example
 * ```typescript
 * function App() {
 *   const [isLoggedIn, setIsLoggedIn] = useState(false);
 *   
 *   if (!isLoggedIn) {
 *     return <Auth onAuthSuccess={() => setIsLoggedIn(true)} />;
 *   }
 *   
 *   return <MainApp />;
 * }
 * ```
 */
const Auth: React.FC<AuthProps> = memo(({ onAuthSuccess }) => {
  // Состояния формы
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs для предотвращения повторных отправок и ограничения частоты запросов
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  /**
   * Валидация полей формы
   * 
   * @returns Сообщение об ошибке или null, если всё валидно
   */
  const validateForm = useCallback((): string | null => {
    // Проверка email
    if (!email.trim()) return 'Введите email';
    if (!email.includes('@')) return 'Введите корректный email';
    
    // Проверка пароля
    if (!password) return 'Введите пароль';
    if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
    
    // Проверка имени пользователя (только при регистрации)
    if (!isLogin && !username.trim()) return 'Введите имя пользователя';
    if (!isLogin && username.length < 3) {
      return 'Имя пользователя должно содержать минимум 3 символа';
    }
    
    return null;
  }, [email, password, username, isLogin]);

  /**
   * Обработчик отправки формы
   * 
   * @param e - Событие отправки формы
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Предотвращение повторных отправок
    if (isSubmittingRef.current) {
      return;
    }
    
    // Ограничение частоты запросов (не чаще 1 раза в секунду)
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1000) {
      setError('Слишком много попыток. Подождите немного.');
      return;
    }
    
    // Валидация формы
    const validationError = validateForm();
    if (validationError) { 
      setError(validationError); 
      return; 
    }
    
    // Сброс ошибки и установка состояния загрузки
    setError(''); 
    setIsLoading(true);
    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    
    try {
      // Выполнение входа или регистрации
      const result = isLogin 
        ? await login(email, password) 
        : await register(username, email, password);
      
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Ошибка авторизации');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Произошла ошибка. Попробуйте позже.');
    } finally { 
      setIsLoading(false);
      // Сброс флага через небольшую задержку
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    }
  }, [isLogin, email, password, username, onAuthSuccess, validateForm]);

  /**
   * Переключение между режимами входа и регистрации
   */
  const handleSwitchMode = useCallback(() => {
    setIsLogin(prev => !prev);
    setError(''); 
    setEmail(''); 
    setPassword(''); 
    setUsername('');
    isSubmittingRef.current = false;
  }, []);

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        {/* Заголовок */}
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">🎸</div>
          <h2>{isLogin ? 'Вход в аккаунт' : 'Регистрация'}</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Войдите, чтобы получить доступ к своей библиотеке табулатур' 
              : 'Создайте аккаунт, чтобы сохранять свои табулатуры'}
          </p>
        </div>
        
        {/* Форма */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Поле имени пользователя (только при регистрации) */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                disabled={isLoading}
                autoComplete="username"
                aria-label="Имя пользователя"
              />
            </div>
          )}

          {/* Поле email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              disabled={isLoading}
              required
              autoComplete="email"
              aria-label="Email"
            />
          </div>

          {/* Поле пароля */}
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              aria-label="Пароль"
            />
            {!isLogin && (
              <p className="password-hint">Минимум 6 символов</p>
            )}
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="auth-error" role="alert">
              <span className="error-icon" aria-hidden="true">⚠️</span>
              {error}
            </div>
          )}

          {/* Кнопка отправки */}
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading}
            aria-label={isLogin ? 'Войти' : 'Зарегистрироваться'}
          >
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        {/* Футер с переключением режима */}
        <div className="auth-footer">
          <button 
            className="auth-switch-btn"
            onClick={handleSwitchMode}
            disabled={isLoading}
            type="button"
            aria-label={isLogin ? 'Перейти к регистрации' : 'Перейти к входу'}
          >
            {isLogin 
              ? 'Нет аккаунта? Зарегистрироваться' 
              : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
});

Auth.displayName = 'Auth';

export default Auth;