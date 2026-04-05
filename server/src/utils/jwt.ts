/**
 * @fileoverview Утилиты для работы с JWT токенами.
 * Генерация и верификация JSON Web Tokens.
 * 
 * @module utils/jwt
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * Генерация JWT токена для пользователя.
 * 
 * @param userId - ID пользователя
 * @returns JWT токен в виде строки
 * 
 * @example
 * ```typescript
 * const token = generateToken(123);
 * console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * ```
 */
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expire as any,
  });
};

/**
 * Верификация и декодирование JWT токена.
 * 
 * @param token - JWT токен для проверки
 * @returns Декодированная полезная нагрузка с ID пользователя и метками времени
 * @throws {JsonWebTokenError} При неверной подписи токена
 * @throws {TokenExpiredError} При просроченном токене
 * 
 * @example
 * ```typescript
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(`User ID: ${decoded.id}`);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 * ```
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

/**
 * Тип для опций генерации токена.
 * Может быть использован для расширения функциональности.
 */
export type TokenOptions = {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
};