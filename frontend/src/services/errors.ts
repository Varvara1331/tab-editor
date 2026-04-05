/**
 * @fileoverview Типы и утилиты для обработки ошибок API.
 * Содержит класс ApiError, типы ошибок и вспомогательные функции.
 * 
 * @module services/errors
 */

/**
 * Типы ошибок API
 */
export enum ApiErrorType {
  /** Ошибка сети */
  NETWORK = 'NETWORK_ERROR',
  /** Таймаут запроса */
  TIMEOUT = 'TIMEOUT_ERROR',
  /** Не авторизован (401) */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Доступ запрещён (403) */
  FORBIDDEN = 'FORBIDDEN',
  /** Ресурс не найден (404) */
  NOT_FOUND = 'NOT_FOUND',
  /** Ошибка валидации данных (400) */
  VALIDATION = 'VALIDATION_ERROR',
  /** Внутренняя ошибка сервера (500) */
  SERVER = 'SERVER_ERROR',
  /** Неизвестная ошибка */
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Кастомный класс для ошибок API
 * 
 * @example
 * ```typescript
 * throw new ApiError('Не удалось загрузить данные', ApiErrorType.SERVER, 500);
 * ```
 */
export class ApiError extends Error {
  /** Тип ошибки */
  public readonly type: ApiErrorType;
  /** HTTP статус код (при наличии) */
  public readonly statusCode?: number;
  /** Исходная ошибка */
  public readonly originalError?: unknown;

  constructor(
    message: string,
    type: ApiErrorType = ApiErrorType.UNKNOWN,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Нормализация ошибки в объект ApiError
 * 
 * @param error - Исходная ошибка
 * @param defaultMessage - Сообщение по умолчанию
 * @returns Нормализованный ApiError
 * 
 * @example
 * ```typescript
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   const apiError = normalizeError(error, 'Что-то пошло не так');
 *   console.log(apiError.type); // ApiErrorType.SERVER
 * }
 * ```
 */
export const normalizeError = (error: unknown, defaultMessage: string): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message, ApiErrorType.UNKNOWN, undefined, error);
  }
  if (typeof error === 'string') {
    return new ApiError(error, ApiErrorType.UNKNOWN);
  }
  return new ApiError(defaultMessage, ApiErrorType.UNKNOWN, undefined, error);
};

/**
 * Извлечение сообщения об ошибке из различных форматов
 * 
 * @param error - Исходная ошибка
 * @param fallback - Сообщение по умолчанию
 * @returns Текст ошибки
 * 
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const message = getErrorMessage(error, 'Произошла ошибка');
 *   showToast(message);
 * }
 * ```
 */
export const getErrorMessage = (error: unknown, fallback: string = 'Произошла ошибка'): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  
  const axiosError = error as { response?: { data?: { error?: string } } };
  if (axiosError.response?.data?.error) {
    return axiosError.response.data.error;
  }
  
  return fallback;
};