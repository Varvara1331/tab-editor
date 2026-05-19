import { getPreviewText, hasPreview, truncatePreview } from '../previewUtils';

describe('previewUtils', () => {
  describe('getPreviewText', () => {
    it('should return preview text when valid preview provided', () => {
      const preview = '0 3 5 0 3 5';
      expect(getPreviewText(preview)).toBe('0 3 5 0 3 5');
    });

    it('should return "Нет превью" for undefined preview', () => {
      expect(getPreviewText(undefined)).toBe('Нет превью');
    });

    it('should return "Нет превью" for empty string preview', () => {
      expect(getPreviewText('')).toBe('Нет превью');
    });

    it('should return "Нет превью" when preview is "..."', () => {
      expect(getPreviewText('...')).toBe('Нет превью');
    });
  });

  describe('hasPreview', () => {
    it('should return true for valid preview', () => {
      expect(hasPreview('0 3 5')).toBe(true);
    });

    it('should return false for undefined preview', () => {
      expect(hasPreview(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasPreview('')).toBe(false);
    });

    it('should return false for "..." preview', () => {
      expect(hasPreview('...')).toBe(false);
    });
  });

  describe('truncatePreview', () => {
    it('should return full preview when shorter than maxLength', () => {
      const preview = '0 3 5';
      expect(truncatePreview(preview, 10)).toBe('0 3 5');
    });

    it('should truncate preview when longer than maxLength', () => {
      const preview = '0 3 5 0 3 5 0 3 5';
      const result = truncatePreview(preview, 10);
      expect(result.length).toBeLessThan(preview.length);
      expect(result).toContain('...');
    });

    it('should return "Нет превью" for undefined preview', () => {
      expect(truncatePreview(undefined)).toBe('Нет превью');
    });

    it('should return "Нет превью" for "..." preview', () => {
      expect(truncatePreview('...')).toBe('Нет превью');
    });

    it('should use default maxLength of 20 when not specified', () => {
      const longPreview = '0 3 5 0 3 5 0 3 5 0 3 5 0 3 5';
      const result = truncatePreview(longPreview);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    it('should trim whitespace before adding ellipsis', () => {
      const preview = '0 3 5 0 3 5   ';
      const result = truncatePreview(preview, 8);
      expect(result).not.toContain('  ');
    });
  });
});