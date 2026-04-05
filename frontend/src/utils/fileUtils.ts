/**
 * @fileoverview Утилиты для работы с файлами.
 * Валидация файлов, чтение, определение расширений.
 * 
 * @module utils/fileUtils
 */

/**
 * Опции для валидации файла
 * 
 * @public
 */
export interface ValidateFileOptions {
  /** Список допустимых расширений файлов (без точки) */
  extensions: string[];
  /** Максимальный размер файла в мегабайтах */
  maxSizeMB: number;
}

/**
 * Результат валидации файла
 * 
 * @public
 */
export interface ValidationResult {
  /** Флаг валидности файла */
  valid: boolean;
  /** Сообщение об ошибке (если файл невалиден) */
  error?: string;
}

/**
 * Получение расширения файла из имени
 * 
 * @param filename - Имя файла
 * @returns Расширение файла в нижнем регистре или пустая строка
 * 
 * @example
 * ```typescript
 * getFileExtension('document.txt') // 'txt'
 * getFileExtension('file') // ''
 * getFileExtension('archive.tar.gz') // 'gz'
 * ```
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Проверка, является ли файл файлом Guitar Pro JSON
 * 
 * @param filename - Имя файла
 * @returns true если файл имеет расширение .gp.json
 * 
 * @example
 * ```typescript
 * isGpJsonFile('song.gp.json') // true
 * isGpJsonFile('song.json') // false
 * ```
 */
export const isGpJsonFile = (filename: string): boolean => {
  return filename.toLowerCase().endsWith('.gp.json');
};

/**
 * Чтение содержимого файла как текста
 * 
 * @param file - Файл для чтения
 * @returns Promise с содержимым файла в виде строки
 * @throws {Error} При ошибке чтения файла
 * 
 * @example
 * ```typescript
 * try {
 *   const content = await readFileAsText(file);
 *   console.log('Файл прочитан, длина:', content.length);
 * } catch (error) {
 *   console.error('Ошибка чтения:', error);
 * }
 * ```
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

/**
 * Валидация файла по расширению и размеру
 * 
 * @param file - Файл для проверки
 * @param options - Опции валидации
 * @returns Результат валидации
 * 
 * @example
 * ```typescript
 * const result = validateFile(file, {
 *   extensions: ['json', 'gp.json'],
 *   maxSizeMB: 10
 * });
 * 
 * if (!result.valid) {
 *   alert(result.error);
 * }
 * ```
 */
export const validateFile = (file: File, options: ValidateFileOptions): ValidationResult => {
  const { extensions, maxSizeMB } = options;
  const filename = file.name.toLowerCase();
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Проверка расширения файла
  const isValidExtension = extensions.some((ext) => {
    if (ext === 'gp.json') {
      return isGpJsonFile(filename);
    }
    return filename.endsWith(`.${ext}`);
  });

  if (!isValidExtension) {
    return { 
      valid: false, 
      error: `Поддерживаются только файлы: ${extensions.join(', ')}` 
    };
  }

  // Проверка размера файла
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `Файл слишком большой. Максимальный размер: ${maxSizeMB} МБ` 
    };
  }

  return { valid: true };
};

/**
 * Преобразование файла в Data URL
 * 
 * @param file - Файл для преобразования
 * @returns Promise с Data URL строкой
 * 
 * @example
 * ```typescript
 * const dataUrl = await fileToDataUrl(imageFile);
 * imgElement.src = dataUrl;
 * ```
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * Форматирование размера файла
 * 
 * @param bytes - Размер в байтах
 * @param decimals - Количество знаков после запятой (по умолчанию 1)
 * @returns Отформатированная строка размера
 * 
 * @example
 * ```typescript
 * formatFileSize(1024) // '1.0 KB'
 * formatFileSize(1536000) // '1.5 MB'
 * formatFileSize(500) // '500 B'
 * ```
 */
export const formatFileSize = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};