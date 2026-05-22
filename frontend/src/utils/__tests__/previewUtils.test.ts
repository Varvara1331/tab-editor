import { getPreviewText, hasPreview, truncatePreview } from '../previewUtils';

describe('previewUtils', () => {
  describe('getPreviewText', () => {
    it('должен возвращать текст превью для валидного превью', () => {
      const preview = '0 3 5 0 3 5';
      expect(getPreviewText(preview)).toBe('0 3 5 0 3 5');
    });

    it('должен возвращать "Нет превью" для undefined', () => {
      expect(getPreviewText(undefined)).toBe('Нет превью');
    });

    it('должен возвращать "Нет превью" для пустой строки', () => {
      expect(getPreviewText('')).toBe('Нет превью');
    });

    it('должен возвращать "Нет превью" когда превью равно "..."', () => {
      expect(getPreviewText('...')).toBe('Нет превью');
    });
  });

  describe('hasPreview', () => {
    it('должен возвращать true для валидного превью', () => {
      expect(hasPreview('0 3 5')).toBe(true);
    });

    it('должен возвращать false для undefined', () => {
      expect(hasPreview(undefined)).toBe(false);
    });

    it('должен возвращать false для пустой строки', () => {
      expect(hasPreview('')).toBe(false);
    });

    it('должен возвращать false для превью "..."', () => {
      expect(hasPreview('...')).toBe(false);
    });
  });

  describe('truncatePreview', () => {
    it('должен возвращать полное превью если оно короче максимальной длины', () => {
      const preview = '0 3 5';
      expect(truncatePreview(preview, 10)).toBe('0 3 5');
    });

    it('должен обрезать превью если оно длиннее максимальной длины', () => {
      const preview = '0 3 5 0 3 5 0 3 5';
      const result = truncatePreview(preview, 10);
      expect(result.length).toBeLessThan(preview.length);
      expect(result).toContain('...');
    });

    it('должен возвращать "Нет превью" для undefined', () => {
      expect(truncatePreview(undefined)).toBe('Нет превью');
    });

    it('должен возвращать "Нет превью" для превью "..."', () => {
      expect(truncatePreview('...')).toBe('Нет превью');
    });

    it('должен использовать максимальную длину 20 по умолчанию', () => {
      const longPreview = '0 3 5 0 3 5 0 3 5 0 3 5 0 3 5';
      const result = truncatePreview(longPreview);
      expect(result.length).toBeLessThanOrEqual(23);
    });

    it('должен обрезать пробелы перед добавлением многоточия', () => {
      const preview = '0 3 5 0 3 5   ';
      const result = truncatePreview(preview, 8);
      expect(result).not.toContain('  ');
    });
  });
});