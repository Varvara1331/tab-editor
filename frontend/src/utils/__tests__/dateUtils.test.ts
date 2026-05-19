import { 
  formatDate, 
  DateFormat, 
  getRelativeTime, 
  compareDates, 
  isValidDate, 
  parseDateSafe, 
  startOfDay, 
  endOfDay, 
  isBetween 
} from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    const testDate = '2024-01-15T10:30:00Z';

    it('should format date in SHORT format (DD.MM.YYYY)', () => {
      const result = formatDate(testDate, { format: DateFormat.SHORT });
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('should format date in LONG format', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG });
      expect(result).toMatch(/\d{2}\s+[а-я]+\s+\d{4}/i);
    });

    it('should format date in ISO format', () => {
      const result = formatDate(testDate, { format: DateFormat.ISO });
      // Проверяем, что результат содержит правильную дату
      expect(result).toContain('2024-01-15');
      expect(result).toContain('10:30');
    });

    it('should return fallback for empty string', () => {
      const result = formatDate('', { fallback: '—' });
      expect(result).toBe('—');
    });

    it('should return fallback for invalid date', () => {
      const result = formatDate('invalid-date', { fallback: 'Invalid' });
      expect(result).toBe('Invalid');
    });

    it('should use default SHORT format when not specified', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('should use ru-RU locale by default', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG });
      // Должны быть русские названия месяцев
      expect(result).toMatch(/января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/i);
    });

    it('should use custom locale when provided', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG, locale: 'en-US' });
      // Должны быть английские названия месяцев
      expect(result).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/i);
    });
  });

  describe('getRelativeTime', () => {
    it('should return "только что" for current time', () => {
      const result = getRelativeTime(new Date());
      expect(result).toBe('только что');
    });

    it('should return minutes ago for less than hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ мин назад/);
    });

    it('should return hours ago for less than day', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ ч назад/);
    });

    it('should return days ago for less than week', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ дн назад/);
    });

    it('should return weeks ago for less than month', () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ нед назад/);
    });

    it('should return months ago for less than year', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ мес назад/);
    });

    it('should return years ago for more than year', () => {
      const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ г назад/);
    });
  });

  describe('compareDates', () => {
    it('should return negative when date1 < date2', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-02-01');
      expect(compareDates(date1, date2)).toBeLessThan(0);
    });

    it('should return positive when date1 > date2', () => {
      const date1 = new Date('2024-02-01');
      const date2 = new Date('2024-01-01');
      expect(compareDates(date1, date2)).toBeGreaterThan(0);
    });

    it('should return 0 when dates are equal', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      expect(compareDates(date1, date2)).toBe(0);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    it('should return false for invalid Date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isValidDate('2024-01-01')).toBe(false);
      expect(isValidDate(123)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate({})).toBe(false);
    });
  });

  describe('parseDateSafe', () => {
    it('should parse valid date string', () => {
      const result = parseDateSafe('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should parse date without time', () => {
      const result = parseDateSafe('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(15);
    });

    it('should return null for empty string', () => {
      expect(parseDateSafe('')).toBeNull();
    });

    it('should return null for invalid date', () => {
      expect(parseDateSafe('invalid')).toBeNull();
    });

    it('should return fallback for invalid date when provided', () => {
      const fallback = new Date('2024-01-01');
      const result = parseDateSafe('invalid', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('startOfDay', () => {
    it('should set time to 00:00:00.000', () => {
      const date = new Date('2024-01-15T15:30:45.123Z');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should not modify original date', () => {
      const original = new Date('2024-01-15T15:30:45.123Z');
      const originalTime = original.getTime();
      startOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });

    it('should use current date when no argument provided', () => {
      const result = startOfDay();
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('should set time to 23:59:59.999', () => {
      const date = new Date('2024-01-15T15:30:45.123Z');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should not modify original date', () => {
      const original = new Date('2024-01-15T15:30:45.123Z');
      const originalTime = original.getTime();
      endOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });

    it('should use current date when no argument provided', () => {
      const result = endOfDay();
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('isBetween', () => {
    const date = new Date('2024-01-15');
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    it('should return true when date is between start and end', () => {
      expect(isBetween(date, start, end)).toBe(true);
    });

    it('should return true when date equals start', () => {
      expect(isBetween(start, start, end)).toBe(true);
    });

    it('should return true when date equals end', () => {
      expect(isBetween(end, start, end)).toBe(true);
    });

    it('should return false when date is before start', () => {
      const before = new Date('2023-12-31');
      expect(isBetween(before, start, end)).toBe(false);
    });

    it('should return false when date is after end', () => {
      const after = new Date('2024-02-01');
      expect(isBetween(after, start, end)).toBe(false);
    });

    it('should handle same day range', () => {
      const sameDay = new Date('2024-01-15');
      const rangeStart = new Date('2024-01-15');
      const rangeEnd = new Date('2024-01-15');
      expect(isBetween(sameDay, rangeStart, rangeEnd)).toBe(true);
    });
  });
});