/**
 * @fileoverview Middleware для валидации входных данных.
 * Проверяет тело запроса по заданной схеме и возвращает ошибки.
 * 
 * @module middleware/validation
 */

import { Request, Response, NextFunction } from 'express';
import { validators, validationMessages } from '../utils/validation';

/**
 * Правила валидации для одного поля.
 */
export interface ValidationRule {
  /** Поле обязательно для заполнения */
  required?: boolean;
  /** Имя валидатора из объекта validators */
  validator?: keyof typeof validators;
  /** Минимальная длина строки */
  minLength?: number;
  /** Максимальная длина строки */
  maxLength?: number;
  /** Кастомная функция валидации */
  custom?: (value: any) => boolean;
  /** Сообщение об ошибке для кастомной валидации */
  customMessage?: string;
}

/**
 * Схема валидации для тела запроса.
 * Ключ - имя поля, значение - правила валидации.
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Фабрика middleware для валидации данных запроса.
 * 
 * @param schema - Схема валидации, где ключ - имя поля, значение - объект с правилами
 * @returns Middleware валидации для использования в маршрутах Express
 * 
 * @example
 * ```typescript
 * // Базовая валидация
 * const registerValidation = {
 *   email: { required: true, validator: 'email' },
 *   password: { required: true, validator: 'password' },
 *   username: { required: true, validator: 'username' }
 * } as const satisfies ValidationSchema;
 * 
 * app.post('/register', validate(registerValidation), handler);
 * ```
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // 1. Проверка обязательности поля
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Поле ${field} обязательно`);
        continue;
      }
      
      // Пропускаем дальнейшие проверки, если поле необязательно и отсутствует
      if (value === undefined || value === null) {
        continue;
      }
      
      // 2. Проверка минимальной длины (для строк)
      if (rules.minLength !== undefined && typeof value === 'string') {
        if (value.length < rules.minLength) {
          errors.push(`Поле ${field} должно содержать минимум ${rules.minLength} символов`);
          continue;
        }
      }
      
      // 3. Проверка максимальной длины (для строк)
      if (rules.maxLength !== undefined && typeof value === 'string') {
        if (value.length > rules.maxLength) {
          errors.push(`Поле ${field} должно содержать максимум ${rules.maxLength} символов`);
          continue;
        }
      }
      
      // 4. Проверка формата через предустановленный валидатор
      if (rules.validator && validators[rules.validator]) {
        if (!validators[rules.validator](value)) {
          const message = validationMessages[rules.validator];
          errors.push(message || `Поле ${field} имеет неверный формат`);
          continue;
        }
      }
      
      // 5. Кастомная валидация
      if (rules.custom) {
        try {
          const isValid = rules.custom(value);
          if (!isValid) {
            errors.push(rules.customMessage || `Поле ${field} имеет неверное значение`);
          }
        } catch (err) {
          errors.push(`Ошибка валидации поля ${field}: ${err}`);
        }
      }
    }
    
    if (errors.length > 0) {
      res.status(400).json({ 
        success: false, 
        errors,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware для санитизации (очистки) входных данных.
 * Удаляет потенциально опасные символы и trim-ит строки.
 * 
 * @param fields - Список полей для санитизации (по умолчанию все строковые поля)
 * 
 * @example
 * ```typescript
 * app.post('/comment', sanitize(['text', 'author']), handler);
 * ```
 */
export const sanitize = (fields?: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const target = fields || Object.keys(req.body);
    
    for (const field of target) {
      const value = req.body[field];
      if (typeof value === 'string') {
        // Базовые санитизации: удаление лишних пробелов и экранирование HTML
        req.body[field] = value
          .trim()
          .replace(/[<>]/g, '') // Удаление < и > для предотвращения XSS
          .slice(0, 1000); // Ограничение длины
      }
    }
    
    next();
  };
};