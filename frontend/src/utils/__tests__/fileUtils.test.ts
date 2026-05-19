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
    it('should return extension for simple filename', () => {
      expect(getFileExtension('document.txt')).toBe('txt');
    });

    it('should return extension for filename with multiple dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return the last part for filename without extension', () => {
      expect(getFileExtension('filename')).toBe('filename');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('isGpJsonFile', () => {
    it('should return true for .gp.json extension', () => {
      expect(isGpJsonFile('song.gp.json')).toBe(true);
    });

    it('should return false for regular .json', () => {
      expect(isGpJsonFile('song.json')).toBe(false);
    });

    it('should return false for other extensions', () => {
      expect(isGpJsonFile('song.txt')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isGpJsonFile('SONG.GP.JSON')).toBe(true);
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name: string, size: number): File => {
      return { name, size } as File;
    };

    it('should return valid for allowed extension and size', () => {
      const file = createMockFile('tab.json', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('should return invalid for wrong extension', () => {
      const file = createMockFile('tab.txt', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Поддерживаются только файлы');
    });

    it('should return invalid for file too large', () => {
      const file = createMockFile('tab.json', 2 * 1024 * 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('слишком большой');
    });

    it('should handle .gp.json extension correctly', () => {
      const file = createMockFile('tab.gp.json', 1024);
      const result = validateFile(file, { extensions: ['gp.json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('should handle empty extensions array', () => {
      const file = createMockFile('test.txt', 100);
      const result = validateFile(file, { extensions: [], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Поддерживаются только файлы');
    });

    it('should handle case insensitive extension check', () => {
      const file = createMockFile('tab.JSON', 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('should return valid for file exactly at size limit', () => {
      const file = createMockFile('tab.json', 1 * 1024 * 1024);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(true);
    });

    it('should return invalid for file slightly over size limit', () => {
      const file = createMockFile('tab.json', 1 * 1024 * 1024 + 1);
      const result = validateFile(file, { extensions: ['json'], maxSizeMB: 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Файл слишком большой');
    });
  });

  describe('readFileAsText', () => {
    it('should read file as text successfully', async () => {
      const content = 'test file content';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await readFileAsText(file);
      expect(result).toBe(content);
    });

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await readFileAsText(file);
      expect(result).toBe('');
    });
  });

  describe('fileToDataUrl', () => {
    it('should convert file to data URL', async () => {
      const content = 'test';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await fileToDataUrl(file);
      expect(result).toMatch(/^data:text\/plain;base64,/);
    });

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const result = await fileToDataUrl(file);
      expect(result).toMatch(/^data:text\/plain;base64,/);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toMatch(/1(\.0)? KB/);
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1.5 * 1024 * 1024)).toMatch(/1(\.5)? MB/);
    });

    it('should format gigabytes', () => {
      const result = formatFileSize(2 * 1024 * 1024 * 1024);
      expect(result).toMatch(/2(\.0)? GB/);
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should respect decimal places', () => {
      const result = formatFileSize(1536, 2);
      expect(result).toMatch(/1(\.5|\.50)? KB/);
    });

    it('should handle negative decimals', () => {
      const result = formatFileSize(1024, -1);
      expect(result).toBe('1 KB');
    });

    it('should handle zero decimals', () => {
      const result = formatFileSize(1536, 0);
      expect(result).toBe('2 KB');
    });
  });
});