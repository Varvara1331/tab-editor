import { 
  getFileExtension, 
  isGpJsonFile, 
  readFileAsText, 
  validateFile, 
  fileToDataUrl, 
  formatFileSize 
} from '../fileUtils';

describe('fileUtils', () => {
  describe('getFileExtension', () => {
    it('должен возвращать расширение для простого имени файла', () => {
      expect(getFileExtension('document.txt')).toBe('txt');
    });

    it('должен возвращать расширение для имени файла с несколькими точками', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('должен возвращать исходное имя для файла без расширения', () => {
      expect(getFileExtension('filename')).toBe('filename');
    });

    it('должен обрабатывать пустую строку', () => {
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('isGpJsonFile', () => {
    it('должен возвращать true для расширения .gp.json', () => {
      expect(isGpJsonFile('song.gp.json')).toBe(true);
    });

    it('должен возвращать false для обычного .json', () => {
      expect(isGpJsonFile('song.json')).toBe(false);
    });

    it('должен возвращать false для других расширений', () => {
      expect(isGpJsonFile('song.txt')).toBe(false);
    });

    it('должен быть нечувствительным к регистру', () => {
      expect(isGpJsonFile('SONG.GP.JSON')).toBe(true);
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number): File => {
      return { name, size } as File;
    };

    it('должен возвращать валидный результат для разрешенного расширения и размера', () => {
      const file = createMockFile('tab.json', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('должен возвращать невалидный результат для неподдерживаемого расширения', () => {
      const file = createMockFile('tab.txt', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Поддерживаются только файлы');
    });

    it('должен возвращать невалидный результат для слишком большого файла', () => {
      const file = createMockFile('tab.json', 2 * 1024 * 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('слишком большой');
    });

    it('должен корректно обрабатывать расширение .gp.json', () => {
      const file = createMockFile('tab.gp.json', 1024);
      const result = validateFile(file, { extensions: ['gp.json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('должен обрабатывать пустой массив расширений', () => {
      const file = createMockFile('test.txt', 100);
      const result = validateFile(file, { extensions: [], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Поддерживаются только файлы');
    });

    it('должен быть нечувствительным к регистру при проверке расширения', () => {
      const file = createMockFile('tab.JSON', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('должен возвращать валидный результат для файла точно по лимиту размера', () => {
      const file = createMockFile('tab.json', 1 * 1024 * 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('должен возвращать невалидный результат для файла немного превышающего лимит', () => {
      const file = createMockFile('tab.json', 1 * 1024 * 1024 + 1);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Файл слишком большой');
    });
  });

  describe('readFileAsText', () => {
    it('должен успешно читать файл как текст', async () => {
      const content = 'test file content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await readFileAsText(file);
      expect(result).toBe(content);
    });

    it('должен обрабатывать пустой файл', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await readFileAsText(file);
      expect(result).toBe('');
    });
  });

  describe('fileToDataUrl', () => {
    it('должен преобразовывать файл в data URL', async () => {
      const content = 'test';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await fileToDataUrl(file);
      expect(result).toMatch(/^data:text\/plain;base64,/);
    });

    it('должен обрабатывать пустой файл', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await fileToDataUrl(file);
      expect(result).toMatch(/^data:text\/plain;base64,/);
    });
  });

  describe('formatFileSize', () => {
    it('должен форматировать байты', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('должен форматировать килобайты', () => {
      expect(formatFileSize(1024)).toMatch(/1(\.0)? KB/);
    });

    it('должен форматировать мегабайты', () => {
      expect(formatFileSize(1.5 * 1024 * 1024)).toMatch(/1(\.5)? MB/);
    });

    it('должен форматировать гигабайты', () => {
      const result = formatFileSize(2 * 1024 * 1024 * 1024);
      expect(result).toMatch(/2(\.0)? GB/);
    });

    it('должен обрабатывать ноль байт', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('должен учитывать количество десятичных знаков', () => {
      const result = formatFileSize(1536, 2);
      expect(result).toMatch(/1(\.5|\.50)? KB/);
    });

    it('должен обрабатывать отрицательное количество десятичных знаков', () => {
      const result = formatFileSize(1024, -1);
      expect(result).toBe('1 KB');
    });

    it('должен обрабатывать ноль десятичных знаков', () => {
      const result = formatFileSize(1536, 0);
      expect(result).toBe('2 KB');
    });
  });
});