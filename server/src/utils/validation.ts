/**
 * @fileoverview Валидаторы и сообщения об ошибках для проверки входных данных.
 * Содержит функции для валидации различных полей и соответствующие сообщения.
 * Используется middleware validation.ts для проверки запросов.
 * 
 * @module utils/validation
 */

/**
 * Объект с функциями-валидаторами для различных типов полей.
 * Каждый валидатор принимает строку и возвращает boolean.
 * 
 * @public
 */
export const validators = {
  /**
   * Проверка корректности email адреса.
   * 
   * @param email - Email для проверки
   * @returns true если email соответствует формату user@example.com
   * 
   * @example
   * ```typescript
   * validators.email('user@example.com'); // true
   * validators.email('invalid-email'); // false
   * ```
   */
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  /**
   * Проверка надежности пароля.
   * 
   * @param password - Пароль для проверки
   * @returns true если длина пароля не менее 6 символов
   * 
   * @example
   * ```typescript
   * validators.password('secret'); // true (6 символов)
   * validators.password('123'); // false
   * ```
   */
  password: (password: string): boolean => password.length >= 6,
  
  /**
   * Проверка имени пользователя.
   * 
   * @param username - Имя пользователя для проверки
   * @returns true если длина от 3 до 50 символов
   * 
   * @example
   * ```typescript
   * validators.username('john'); // true (4 символа)
   * validators.username('jo'); // false (2 символа)
   * ```
   */
  username: (username: string): boolean => username.length >= 3 && username.length <= 50,
  
  /**
   * Проверка названия табулатуры.
   * 
   * @param title - Название для проверки
   * @returns true если длина от 1 до 200 символов
   * 
   * @example
   * ```typescript
   * validators.title('My Song'); // true
   * validators.title(''); // false
   * ```
   */
  title: (title: string): boolean => title.length >= 1 && title.length <= 200,
};

/**
 * Сообщения об ошибках для каждого типа валидатора.
 * Используются при не прохождении соответствующей проверки.
 * 
 * @public
 */
export const validationMessages = {
  email: 'Неверный формат email',
  password: 'Пароль должен содержать минимум 6 символов',
  username: 'Имя пользователя должно содержать от 3 до 50 символов',
  title: 'Название должно содержать от 1 до 200 символов',
} as const;

/**
 * Тип для ключей валидаторов.
 * Используется для типобезопасного доступа к validators и validationMessages.
 */
export type ValidatorKey = keyof typeof validators;

/**
 * Тип для функции-валидатора.
 */
export type ValidatorFn = (value: string) => boolean;

/**
 * Тип для результата валидации.
 */
export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Вспомогательная функция для выполнения валидации с сообщением об ошибке.
 * 
 * @param value - Значение для проверки
 * @param validatorKey - Ключ валидатора
 * @returns Результат валидации с сообщением об ошибке
 * 
 * @example
 * ```typescript
 * const result = validateWithMessage('user@example.com', 'email');
 * if (!result.isValid) {
 *   console.error(result.error); // "Неверный формат email"
 * }
 * ```
 */
export const validateWithMessage = (
  value: string,
  validatorKey: ValidatorKey
): ValidationResult => {
  const isValid = validators[validatorKey](value);
  return {
    isValid,
    error: isValid ? undefined : validationMessages[validatorKey],
  };
};