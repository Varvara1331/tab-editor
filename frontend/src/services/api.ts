/**
 * @fileoverview Настройка HTTP клиента для работы с API.
 * Содержит конфигурацию Axios, интерсепторы для авторизации и обработки ошибок.
 * 
 * @module services/api
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/** Базовый URL API */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Ключи для хранения данных в localStorage
 */
export const STORAGE_KEYS = {
  /** Ключ для JWT токена */
  TOKEN: 'token',
  /** Ключ для данных пользователя */
  USER: 'user',
} as const;

/**
 * Создание настроенного экземпляра Axios
 * 
 * @returns Настроенный AxiosInstance
 * 
 * @example
 * ```typescript
 * const api = createApiClient();
 * const response = await api.get('/tabs');
 * ```
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30 секунд таймаут
  });

  // Интерсептор запросов: добавление токена авторизации
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Интерсептор ответов: обработка ошибок авторизации
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Очистка сессии при неавторизованном доступе
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Перенаправление на страницу входа
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Настроенный API клиент для отправки запросов
 */
export const api = createApiClient();

/**
 * Стандартный ответ API
 * 
 * @template T - Тип данных в ответе
 */
export interface ApiResponse<T = unknown> {
  /** Успешность операции */
  success: boolean;
  /** Данные ответа (при успехе) */
  data?: T;
  /** Сообщение об ошибке (при неудаче) */
  error?: string;
  /** Дополнительное сообщение */
  message?: string;
}

/**
 * Ответ API с пагинацией
 * 
 * @template T - Тип элементов в массиве
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  /** Информация о пагинации */
  pagination?: {
    /** Количество записей на странице */
    limit: number;
    /** Смещение от начала */
    offset: number;
    /** Общее количество записей */
    total: number;
  };
}