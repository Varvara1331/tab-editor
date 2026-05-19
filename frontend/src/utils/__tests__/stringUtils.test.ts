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
    it('should transliterate Cyrillic to Latin', () => {
      expect(transliterate('Привет')).toBe('Privet');
      expect(transliterate('Мир')).toBe('Mir');
    });

    it('should handle mixed case', () => {
      expect(transliterate('ПриВет')).toBe('PriVet');
    });

    it('should preserve Latin characters', () => {
      expect(transliterate('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(transliterate('')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('&')).toBe('&amp;');
    });

    it('should escape less than', () => {
      expect(escapeHtml('<')).toBe('&lt;');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('>')).toBe('&gt;');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('"')).toBe('&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("'")).toBe('&#39;');
    });

    it('should handle complex HTML', () => {
      const html = '<div class="test">Hello & welcome</div>';
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; welcome&lt;/div&gt;';
      expect(escapeHtml(html)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('escapeXml', () => {
    it('should escape XML special characters', () => {
      const xml = '<note>"It\'s & test"</note>';
      const expected = '&lt;note&gt;&quot;It&apos;s &amp; test&quot;&lt;/note&gt;';
      expect(escapeXml(xml)).toBe(expected);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove forbidden characters', () => {
      expect(sanitizeFilename('test:file?name*')).toBe('testfilename');
      expect(sanitizeFilename('<>:"/\\|?*')).toBe('untitled');
    });

    it('should handle spaces', () => {
      expect(sanitizeFilename('my song file')).toBe('my song file');
    });

    it('should keep valid characters', () => {
      expect(sanitizeFilename('My Song v1.0.gp')).toBe('My Song v1.0.gp');
    });

    it('should return untitled for empty string', () => {
      expect(sanitizeFilename('')).toBe('untitled');
    });
  });

  describe('truncate', () => {
    it('should truncate long string', () => {
      const long = 'This is a very long string that needs truncation';
      const result = truncate(long, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    it('should not truncate short string', () => {
      const short = 'Short';
      expect(truncate(short, 10)).toBe(short);
    });

    it('should handle custom suffix', () => {
      const result = truncate('Long string', 8, '[cut]');
      expect(result).toContain('[cut]');
    });

    it('should handle empty string', () => {
      expect(truncate('')).toBe('');
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('My Song')).toBe('my-song');
    });

    it('should transliterate Cyrillic', () => {
      expect(slugify('Моя песня')).toBe('moya-pesnya');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('rock and roll')).toBe('rock-and-roll');
    });

    it('should remove special characters', () => {
      expect(slugify('Rock & Roll!')).toBe('rock-roll');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });
});