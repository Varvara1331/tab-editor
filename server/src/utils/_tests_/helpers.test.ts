import { parseJson, stringifyJson, generatePreview, toBoolean, toNumber } from '../helpers';

describe('Helpers', () => {
  describe('parseJson', () => {
    it('должен парсить валидную JSON строку', () => {
      const result = parseJson<{ name: string }>('{"name":"test"}', { name: '' });
      expect(result).toEqual({ name: 'test' });
    });

    it('должен возвращать значение по умолчанию для null ввода', () => {
      const defaultValue: { default: boolean } = { default: true };
      const result = parseJson(null, defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('должен возвращать значение по умолчанию для невалидного JSON', () => {
      const defaultValue: number[] = [];
      const result = parseJson('invalid json', defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('должен парсить JSON массив', () => {
      const result = parseJson<number[]>('[1,2,3]', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('должен обрабатывать пустую строку', () => {
      const defaultValue: string[] = [];
      const result = parseJson('', defaultValue);
      expect(result).toBe(defaultValue);
    });
  });

  describe('stringifyJson', () => {
    it('должен преобразовывать объект в JSON строку', () => {
      const obj: { name: string; value: number } = { name: 'test', value: 123 };
      const result = stringifyJson(obj);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('должен преобразовывать массив в JSON строку', () => {
      const arr: number[] = [1, 2, 3];
      const result = stringifyJson(arr);
      expect(result).toBe('[1,2,3]');
    });

    it('должен преобразовывать строку в JSON строку', () => {
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

    it('должен генерировать превью из первых 8 нот', () => {
      const result = generatePreview(mockMeasures);
      expect(result).toBe('0 3 5 7 8 10 12 -');
    });

    it('должен возвращать "..." для пустых тактов', () => {
      const result = generatePreview([]);
      expect(result).toBe('...');
    });

    it('должен возвращать "..." для такта без струн', () => {
      const result = generatePreview([{}]);
      expect(result).toBe('...');
    });

    it('должен возвращать "..." для такта без нот', () => {
      const result = generatePreview([{ strings: [{}] }]);
      expect(result).toBe('...');
    });

    it('должен обрабатывать ноты с ладом null как дефис', () => {
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
    it('должен возвращать true для значения 1', () => {
      expect(toBoolean(1)).toBe(true);
    });

    it('должен возвращать false для значения 0', () => {
      expect(toBoolean(0)).toBe(false);
    });
  });

  describe('toNumber', () => {
    it('должен возвращать 1 для true', () => {
      expect(toNumber(true)).toBe(1);
    });

    it('должен возвращать 0 для false', () => {
      expect(toNumber(false)).toBe(0);
    });
  });
});