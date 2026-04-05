/**
 * @fileoverview Утилиты для работы с датами.
 * Предоставляет функции форматирования, сравнения и валидации дат.
 * 
 * @module utils/dateUtils
 */

/**
 * Доступные форматы вывода даты
 * 
 * @public
 */
export enum DateFormat {
  /** Короткий формат: ДД.ММ.ГГГГ */
  SHORT = 'short',
  /** Длинный формат: ДД месяц ГГГГ */
  LONG = 'long',
  /** ISO формат: ГГГГ-ММ-ДДTЧЧ:ММ:СС.МММZ */
  ISO = 'iso',
  /** Относительный формат: "5 мин назад", "2 дня назад" */
  RELATIVE = 'relative',
}

/**
 * Опции для форматирования даты
 * 
 * @public
 */
export interface FormatDateOptions {
  /** Формат вывода (по умолчанию: SHORT) */
  format?: DateFormat;
  /** Локаль для форматирования (по умолчанию: 'ru-RU') */
  locale?: string;
  /** Значение по умолчанию при ошибке (по умолчанию: '—') */
  fallback?: string;
}

/**
 * Форматирование даты из строки в указанном формате
 * 
 * @param dateString - Строка с датой (должна быть валидной для new Date())
 * @param options - Опции форматирования
 * @returns Отформатированная дата или fallback при ошибке
 * 
 * @example
 * ```typescript
 * formatDate('2024-01-15T10:30:00Z', { format: DateFormat.SHORT })
 * // "15.01.2024"
 * 
 * formatDate('2024-01-15T10:30:00Z', { format: DateFormat.LONG, locale: 'en-US' })
 * // "15 January 2024"
 * 
 * formatDate('2024-01-15T10:30:00Z', { format: DateFormat.RELATIVE })
 * // "2 мес назад" (если сейчас март 2024)
 * ```
 */
export const formatDate = (dateString: string, options: FormatDateOptions = {}): string => {
  const { format = DateFormat.SHORT, locale = 'ru-RU', fallback = '—' } = options;
  
  // Проверка на пустую строку
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    
    // Проверка на валидность даты
    if (isNaN(date.getTime())) return fallback;
    
    switch (format) {
      case DateFormat.SHORT:
        return date.toLocaleDateString(locale, { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        
      case DateFormat.LONG:
        return date.toLocaleDateString(locale, { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
        
      case DateFormat.ISO:
        return date.toISOString();
        
      case DateFormat.RELATIVE:
        return getRelativeTime(date);
        
      default:
        return date.toLocaleDateString(locale);
    }
  } catch {
    return fallback;
  }
};

/**
 * Получение относительного времени относительно текущего момента
 * 
 * @param date - Дата для преобразования
 * @returns Строка с относительным временем на русском языке
 * 
 * @example
 * ```typescript
 * getRelativeTime(new Date()) // "только что"
 * getRelativeTime(new Date(Date.now() - 5 * 60000)) // "5 мин назад"
 * getRelativeTime(new Date(Date.now() - 2 * 3600000)) // "2 ч назад"
 * getRelativeTime(new Date(Date.now() - 3 * 86400000)) // "3 дн назад"
 * ```
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Определение подходящего интервала
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед назад`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес назад`;
  return `${Math.floor(diffDays / 365)} г назад`;
};

/**
 * Сравнение двух дат
 * 
 * @param date1 - Первая дата
 * @param date2 - Вторая дата
 * @returns Отрицательное число если date1 < date2, 0 если равны, положительное если date1 > date2
 * 
 * @example
 * ```typescript
 * compareDates(new Date('2024-01-01'), new Date('2024-02-01')) // -2678400000
 * compareDates(new Date('2024-02-01'), new Date('2024-01-01')) // 2678400000
 * ```
 */
export const compareDates = (date1: Date, date2: Date): number => {
  return date1.getTime() - date2.getTime();
};

/**
 * Проверка, является ли значение валидной датой
 * 
 * @param value - Значение для проверки
 * @returns true если значение является валидным объектом Date
 * 
 * @example
 * ```typescript
 * isValidDate(new Date()) // true
 * isValidDate(new Date('invalid')) // false
 * isValidDate('2024-01-01') // false (не Date)
 * ```
 */
export const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Парсинг строки в дату с проверкой валидности
 * 
 * @param dateString - Строка с датой
 * @param fallback - Значение по умолчанию при ошибке (по умолчанию null)
 * @returns Объект Date или fallback при ошибке
 * 
 * @example
 * ```typescript
 * parseDateSafe('2024-01-15T10:30:00Z') // Date(2024-01-15...)
 * parseDateSafe('invalid', new Date()) // текущая дата
 * parseDateSafe('') // null
 * ```
 */
export const parseDateSafe = (dateString: string, fallback: Date | null = null): Date | null => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    return isValidDate(date) ? date : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Получение начала дня для указанной даты
 * 
 * @param date - Дата (по умолчанию текущая)
 * @returns Дата, установленная на 00:00:00.000
 * 
 * @example
 * ```typescript
 * startOfDay(new Date('2024-01-15T15:30:00')) // 2024-01-15T00:00:00.000Z
 * ```
 */
export const startOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Получение конца дня для указанной даты
 * 
 * @param date - Дата (по умолчанию текущая)
 * @returns Дата, установленная на 23:59:59.999
 * 
 * @example
 * ```typescript
 * endOfDay(new Date('2024-01-15T15:30:00')) // 2024-01-15T23:59:59.999Z
 * ```
 */
export const endOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Проверка, находится ли дата между двумя другими датами (включительно)
 * 
 * @param date - Проверяемая дата
 * @param start - Начало диапазона
 * @param end - Конец диапазона
 * @returns true если дата в диапазоне
 * 
 * @example
 * ```typescript
 * const date = new Date('2024-01-15');
 * const start = new Date('2024-01-01');
 * const end = new Date('2024-01-31');
 * isBetween(date, start, end) // true
 * ```
 */
export const isBetween = (date: Date, start: Date, end: Date): boolean => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};