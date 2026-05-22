import { 
  isValidCursorPosition, 
  generateMeasureId, 
  createEmptyNote, 
  createNoteWithFret, 
  createEmptyMeasure,
  DEFAULT_TUNING_6_STRING,
  DEFAULT_TAB_DATA
} from '../tab';

describe('types/tab', () => {
  describe('isValidCursorPosition', () => {
    it('должен возвращать true для валидной позиции курсора', () => {
      const validPos = { measureIndex: 0, stringIndex: 1, noteIndex: 2 };
      expect(isValidCursorPosition(validPos)).toBe(true);
    });

    it('должен возвращать false для null', () => {
      expect(isValidCursorPosition(null)).toBe(false);
    });

    it('должен возвращать false для undefined', () => {
      expect(isValidCursorPosition(undefined)).toBe(false);
    });

    it('должен возвращать false для не-объектных значений', () => {
      expect(isValidCursorPosition('string')).toBe(false);
      expect(isValidCursorPosition(123)).toBe(false);
    });

    it('должен возвращать false при отсутствии обязательных свойств', () => {
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: 1 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ stringIndex: 1, noteIndex: 2 })).toBe(false);
    });

    it('должен возвращать false при неверных типах свойств', () => {
      expect(isValidCursorPosition({ measureIndex: '0', stringIndex: 1, noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: '1', noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: 1, noteIndex: '2' })).toBe(false);
    });
  });

  describe('generateMeasureId', () => {
    it('должен возвращать строку', () => {
      const id = generateMeasureId();
      expect(typeof id).toBe('string');
    });

    it('должен возвращать уникальные ID при нескольких вызовах', () => {
      const id1 = generateMeasureId();
      const id2 = generateMeasureId();
      expect(id1).not.toBe(id2);
    });

    it('должен содержать временную метку и случайную часть', () => {
      const id = generateMeasureId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createEmptyNote', () => {
    it('должен создавать ноту с ладом null', () => {
      const note = createEmptyNote();
      expect(note.fret).toBeNull();
    });

    it('не должен содержать эффектов', () => {
      const note = createEmptyNote();
      expect(note.bend).toBeUndefined();
      expect(note.slide).toBeUndefined();
      expect(note.hammer).toBeUndefined();
      expect(note.pull).toBeUndefined();
      expect(note.vibrato).toBeUndefined();
    });
  });

  describe('createNoteWithFret', () => {
    it('должен создавать ноту с указанным ладом', () => {
      const note = createNoteWithFret(7);
      expect(note.fret).toBe(7);
    });

    it('должен обрабатывать открытую струну (лад 0)', () => {
      const note = createNoteWithFret(0);
      expect(note.fret).toBe(0);
    });

    it('должен обрабатывать высокие лады', () => {
      const note = createNoteWithFret(24);
      expect(note.fret).toBe(24);
    });
  });

  describe('createEmptyMeasure', () => {
    it('должен создавать такт с 6 струнами по умолчанию', () => {
      const measure = createEmptyMeasure();
      expect(measure.strings).toHaveLength(6);
    });

    it('должен создавать такт с произвольным количеством струн', () => {
      const measure = createEmptyMeasure(4);
      expect(measure.strings).toHaveLength(4);
    });

    it('должен создавать такт с пустыми массивами нот', () => {
      const measure = createEmptyMeasure(6);
      expect(measure.strings[0].notes).toHaveLength(0);
    });

    it('должен иметь корректные номера струн', () => {
      const measure = createEmptyMeasure(3);
      expect(measure.strings[0].stringNumber).toBe(1);
      expect(measure.strings[1].stringNumber).toBe(2);
      expect(measure.strings[2].stringNumber).toBe(3);
    });

    it('должен генерировать уникальные ID для каждого такта', () => {
      const measure1 = createEmptyMeasure();
      const measure2 = createEmptyMeasure();
      expect(measure1.id).not.toBe(measure2.id);
    });
  });

  describe('DEFAULT_TUNING_6_STRING', () => {
    it('должен содержать 6 струн', () => {
      expect(DEFAULT_TUNING_6_STRING).toHaveLength(6);
    });

    it('должен соответствовать стандартному строю EADGBE', () => {
      expect(DEFAULT_TUNING_6_STRING).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });
  });

  describe('DEFAULT_TAB_DATA', () => {
    it('должен иметь заголовок по умолчанию', () => {
      expect(DEFAULT_TAB_DATA.title).toBe('Новая табулатура');
    });

    it('должен иметь стандартный строй', () => {
      expect(DEFAULT_TAB_DATA.tuning).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });

    it('должен содержать один такт', () => {
      expect(DEFAULT_TAB_DATA.measures).toHaveLength(1);
    });

    it('должен быть приватным по умолчанию', () => {
      expect(DEFAULT_TAB_DATA.isPublic).toBe(false);
    });
  });
});