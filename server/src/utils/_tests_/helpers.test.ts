import { parseJson, stringifyJson, generatePreview, toBoolean, toNumber } from '../helpers';

describe('Helpers', () => {
  describe('parseJson', () => {
    it('should parse valid JSON string', () => {
      const result = parseJson<{ name: string }>('{"name":"test"}', { name: '' });
      expect(result).toEqual({ name: 'test' });
    });

    it('should return default value for null input', () => {
      const defaultValue: { default: boolean } = { default: true };
      const result = parseJson(null, defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should return default value for invalid JSON', () => {
      const defaultValue: number[] = [];
      const result = parseJson('invalid json', defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should parse array JSON', () => {
      const result = parseJson<number[]>('[1,2,3]', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty string input', () => {
      const defaultValue: string[] = [];
      const result = parseJson('', defaultValue);
      expect(result).toBe(defaultValue);
    });
  });

  describe('stringifyJson', () => {
    it('should convert object to JSON string', () => {
      const obj: { name: string; value: number } = { name: 'test', value: 123 };
      const result = stringifyJson(obj);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should convert array to JSON string', () => {
      const arr: number[] = [1, 2, 3];
      const result = stringifyJson(arr);
      expect(result).toBe('[1,2,3]');
    });

    it('should convert string to JSON string', () => {
      const result = stringifyJson('test');
      expect(result).toBe('"test"');
    });
  });

  describe('generatePreview', () => {
    const mockMeasures = [
      {
        strings: [
          {
            notes: [
              { fret: 0 },
              { fret: 3 },
              { fret: 5 },
              { fret: 7 },
              { fret: 8 },
              { fret: 10 },
              { fret: 12 },
              { fret: null },
              { fret: 15 },
            ],
          },
        ],
      },
    ];

    it('should generate preview from first 8 notes', () => {
      const result = generatePreview(mockMeasures);
      expect(result).toBe('0 3 5 7 8 10 12 -');
    });

    it('should return "..." for empty measures', () => {
      const result = generatePreview([]);
      expect(result).toBe('...');
    });

    it('should return "..." for measure without strings', () => {
      const result = generatePreview([{}]);
      expect(result).toBe('...');
    });

    it('should return "..." for measure without notes', () => {
      const result = generatePreview([{ strings: [{}] }]);
      expect(result).toBe('...');
    });

    it('should handle notes with null fret as dash', () => {
      const measuresWithNull = [
        {
          strings: [
            {
              notes: [{ fret: 5 }, { fret: null }, { fret: 7 }],
            },
          ],
        },
      ];
      const result = generatePreview(measuresWithNull);
      expect(result).toBe('5 - 7');
    });
  });

  describe('toBoolean', () => {
    it('should return true for value 1', () => {
      expect(toBoolean(1)).toBe(true);
    });

    it('should return false for value 0', () => {
      expect(toBoolean(0)).toBe(false);
    });
  });

  describe('toNumber', () => {
    it('should return 1 for true', () => {
      expect(toNumber(true)).toBe(1);
    });

    it('should return 0 for false', () => {
      expect(toNumber(false)).toBe(0);
    });
  });
});