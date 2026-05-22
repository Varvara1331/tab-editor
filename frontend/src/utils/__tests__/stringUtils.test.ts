import { 
  transliterate, 
  escapeHtml, 
  escapeXml, 
  sanitizeFilename, 
  truncate, 
  slugify 
} from '../stringUtils';

describe('stringUtils', () => {
  describe('transliterate', () => {
    it('должен транслитерировать кириллицу в латиницу', () => {
      expect(transliterate('Привет')).toBe('Privet');
      expect(transliterate('Мир')).toBe('Mir');
    });

    it('должен обрабатывать смешанный регистр', () => {
      expect(transliterate('ПриВет')).toBe('PriVet');
    });

    it('должен сохранять латинские символы', () => {
      expect(transliterate('Hello World')).toBe('Hello World');
    });

    it('должен обрабатывать пустую строку', () => {
      expect(transliterate('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('должен экранировать амперсанд', () => {
      expect(escapeHtml('&')).toBe('&amp;');
    });

    it('должен экранировать знак меньше', () => {
      expect(escapeHtml('<')).toBe('&lt;');
    });

    it('должен экранировать знак больше', () => {
      expect(escapeHtml('>')).toBe('&gt;');
    });

    it('должен экранировать двойные кавычки', () => {
      expect(escapeHtml('"')).toBe('&quot;');
    });

    it('должен экранировать одинарные кавычки', () => {
      expect(escapeHtml("'")).toBe('&#39;');
    });

    it('должен обрабатывать сложный HTML', () => {
      const html = '<div class="test">Hello & welcome</div>';
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; welcome&lt;/div&gt;';
      expect(escapeHtml(html)).toBe(expected);
    });

    it('должен обрабатывать пустую строку', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('escapeXml', () => {
    it('должен экранировать специальные символы XML', () => {
      const xml = '<note>"It\'s & test"</note>';
      const expected = '&lt;note&gt;&quot;It&apos;s &amp; test&quot;&lt;/note&gt;';
      expect(escapeXml(xml)).toBe(expected);
    });
  });

  describe('sanitizeFilename', () => {
    it('должен удалять запрещенные символы', () => {
      expect(sanitizeFilename('test:file?name*')).toBe('testfilename');
      expect(sanitizeFilename('<>:"/\\|?*')).toBe('untitled');
    });

    it('должен сохранять пробелы', () => {
      expect(sanitizeFilename('my song file')).toBe('my song file');
    });

    it('должен сохранять валидные символы', () => {
      expect(sanitizeFilename('My Song v1.0.gp')).toBe('My Song v1.0.gp');
    });

    it('должен возвращать untitled для пустой строки', () => {
      expect(sanitizeFilename('')).toBe('untitled');
    });
  });

  describe('truncate', () => {
    it('должен обрезать длинную строку', () => {
      const long = 'This is a very long string that needs truncation';
      const result = truncate(long, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    it('не должен обрезать короткую строку', () => {
      const short = 'Short';
      expect(truncate(short, 10)).toBe(short);
    });

    it('должен обрабатывать пользовательский суффикс', () => {
      const result = truncate('Long string', 8, '[cut]');
      expect(result).toContain('[cut]');
    });

    it('должен обрабатывать пустую строку', () => {
      expect(truncate('')).toBe('');
    });
  });

  describe('slugify', () => {
    it('должен преобразовывать в нижний регистр', () => {
      expect(slugify('My Song')).toBe('my-song');
    });

    it('должен транслитерировать кириллицу', () => {
      expect(slugify('Моя песня')).toBe('moya-pesnya');
    });

    it('должен заменять пробелы на дефисы', () => {
      expect(slugify('rock and roll')).toBe('rock-and-roll');
    });

    it('должен удалять специальные символы', () => {
      expect(slugify('Rock & Roll!')).toBe('rock-roll');
    });

    it('должен обрабатывать пустую строку', () => {
      expect(slugify('')).toBe('');
    });
  });
});