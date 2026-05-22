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

    it('должен форматировать дату в коротком формате (DD.MM.YYYY)', () => {
      const result = formatDate(testDate, { format: DateFormat.SHORT });
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('должен форматировать дату в длинном формате с названием месяца', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG });
      expect(result).toMatch(/\d{2}\s+[а-я]+\s+\d{4}/i);
    });

    it('должен форматировать дату в ISO формате', () => {
      const result = formatDate(testDate, { format: DateFormat.ISO });
      expect(result).toContain('2024-01-15');
      expect(result).toContain('10:30');
    });

    it('должен возвращать fallback для пустой строки', () => {
      const result = formatDate('', { fallback: '—' });
      expect(result).toBe('—');
    });

    it('должен возвращать fallback для некорректной даты', () => {
      const result = formatDate('invalid-date', { fallback: 'Invalid' });
      expect(result).toBe('Invalid');
    });

    it('должен использовать короткий формат по умолчанию', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('должен использовать локаль ru-RU по умолчанию', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG });
      expect(result).toMatch(/января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря/i);
    });

    it('должен использовать пользовательскую локаль при передаче', () => {
      const result = formatDate(testDate, { format: DateFormat.LONG, locale: 'en-US' });
      expect(result).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December/i);
    });
  });

  describe('getRelativeTime', () => {
    it('должен возвращать "только что" для текущего времени', () => {
      const result = getRelativeTime(new Date());
      expect(result).toBe('только что');
    });

    it('должен возвращать количество минут для интервала менее часа', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ мин назад/);
    });

    it('должен возвращать количество часов для интервала менее дня', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ ч назад/);
    });

    it('должен возвращать количество дней для интервала менее недели', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ дн назад/);
    });

    it('должен возвращать количество недель для интервала менее месяца', () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ нед назад/);
    });

    it('должен возвращать количество месяцев для интервала менее года', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ мес назад/);
    });

    it('должен возвращать количество лет для интервала более года', () => {
      const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
      const result = getRelativeTime(date);
      expect(result).toMatch(/\d+ г назад/);
    });
  });

  describe('compareDates', () => {
    it('должен возвращать отрицательное значение когда date1 < date2', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-02-01');
      expect(compareDates(date1, date2)).toBeLessThan(0);
    });

    it('должен возвращать положительное значение когда date1 > date2', () => {
      const date1 = new Date('2024-02-01');
      const date2 = new Date('2024-01-01');
      expect(compareDates(date1, date2)).toBeGreaterThan(0);
    });

    it('должен возвращать 0 когда даты равны', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      expect(compareDates(date1, date2)).toBe(0);
    });
  });

  describe('isValidDate', () => {
    it('должен возвращать true для корректного объекта Date', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    it('должен возвращать false для некорректного объекта Date', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('должен возвращать false для значений не являющихся Date', () => {
      expect(isValidDate('2024-01-01')).toBe(false);
      expect(isValidDate(123)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate({})).toBe(false);
    });
  });

  describe('parseDateSafe', () => {
    it('должен корректно парсить валидную строку даты', () => {
      const result = parseDateSafe('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('должен парсить дату без времени', () => {
      const result = parseDateSafe('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('должен возвращать null для пустой строки', () => {
      expect(parseDateSafe('')).toBeNull();
    });

    it('должен возвращать null для некорректной даты', () => {
      expect(parseDateSafe('invalid')).toBeNull();
    });

    it('должен возвращать fallback для некорректной даты если он предоставлен', () => {
      const fallback = new Date('2024-01-01');
      const result = parseDateSafe('invalid', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('startOfDay', () => {
    it('должен устанавливать время на 00:00:00.000', () => {
      const date = new Date('2024-01-15T15:30:45.123Z');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('не должен изменять исходную дату', () => {
      const original = new Date('2024-01-15T15:30:45.123Z');
      const originalTime = original.getTime();
      startOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });

    it('должен использовать текущую дату если аргумент не передан', () => {
      const result = startOfDay();
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('должен устанавливать время на 23:59:59.999', () => {
      const date = new Date('2024-01-15T15:30:45.123Z');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('не должен изменять исходную дату', () => {
      const original = new Date('2024-01-15T15:30:45.123Z');
      const originalTime = original.getTime();
      endOfDay(original);
      expect(original.getTime()).toBe(originalTime);
    });

    it('должен использовать текущую дату если аргумент не передан', () => {
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

    it('должен возвращать true когда дата находится между началом и концом', () => {
      expect(isBetween(date, start, end)).toBe(true);
    });

    it('должен возвращать true когда дата равна началу интервала', () => {
      expect(isBetween(start, start, end)).toBe(true);
    });

    it('должен возвращать true когда дата равна концу интервала', () => {
      expect(isBetween(end, start, end)).toBe(true);
    });

    it('должен возвращать false когда дата раньше начала интервала', () => {
      const before = new Date('2023-12-31');
      expect(isBetween(before, start, end)).toBe(false);
    });

    it('должен возвращать false когда дата позже конца интервала', () => {
      const after = new Date('2024-02-01');
      expect(isBetween(after, start, end)).toBe(false);
    });

    it('должен корректно обрабатывать интервал в один день', () => {
      const sameDay = new Date('2024-01-15');
      const rangeStart = new Date('2024-01-15');
      const rangeEnd = new Date('2024-01-15');
      expect(isBetween(sameDay, rangeStart, rangeEnd)).toBe(true);
    });
  });
});