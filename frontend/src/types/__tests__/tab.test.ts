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
    it('should return true for valid cursor position', () => {
      const validPos = { measureIndex: 0, stringIndex: 1, noteIndex: 2 };
      expect(isValidCursorPosition(validPos)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidCursorPosition(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidCursorPosition(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidCursorPosition('string')).toBe(false);
      expect(isValidCursorPosition(123)).toBe(false);
    });

    it('should return false for missing properties', () => {
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: 1 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ stringIndex: 1, noteIndex: 2 })).toBe(false);
    });

    it('should return false for invalid property types', () => {
      expect(isValidCursorPosition({ measureIndex: '0', stringIndex: 1, noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: '1', noteIndex: 2 })).toBe(false);
      expect(isValidCursorPosition({ measureIndex: 0, stringIndex: 1, noteIndex: '2' })).toBe(false);
    });
  });

  describe('generateMeasureId', () => {
    it('should return a string', () => {
      const id = generateMeasureId();
      expect(typeof id).toBe('string');
    });

    it('should return unique IDs for multiple calls', () => {
      const id1 = generateMeasureId();
      const id2 = generateMeasureId();
      expect(id1).not.toBe(id2);
    });

    it('should contain timestamp and random part', () => {
      const id = generateMeasureId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createEmptyNote', () => {
    it('should create note with null fret', () => {
      const note = createEmptyNote();
      expect(note.fret).toBeNull();
    });

    it('should not have any effects', () => {
      const note = createEmptyNote();
      expect(note.bend).toBeUndefined();
      expect(note.slide).toBeUndefined();
      expect(note.hammer).toBeUndefined();
      expect(note.pull).toBeUndefined();
      expect(note.vibrato).toBeUndefined();
    });
  });

  describe('createNoteWithFret', () => {
    it('should create note with specified fret', () => {
      const note = createNoteWithFret(7);
      expect(note.fret).toBe(7);
    });

    it('should handle fret 0', () => {
      const note = createNoteWithFret(0);
      expect(note.fret).toBe(0);
    });

    it('should handle high fret numbers', () => {
      const note = createNoteWithFret(24);
      expect(note.fret).toBe(24);
    });
  });

  describe('createEmptyMeasure', () => {
    it('should create measure with default 6 strings', () => {
      const measure = createEmptyMeasure();
      expect(measure.strings).toHaveLength(6);
    });

    it('should create measure with custom string count', () => {
      const measure = createEmptyMeasure(4);
      expect(measure.strings).toHaveLength(4);
    });

    it('should create measure with empty notes arrays', () => {
      const measure = createEmptyMeasure(6);
      expect(measure.strings[0].notes).toHaveLength(0);
    });

    it('should have correct string numbers', () => {
      const measure = createEmptyMeasure(3);
      expect(measure.strings[0].stringNumber).toBe(1);
      expect(measure.strings[1].stringNumber).toBe(2);
      expect(measure.strings[2].stringNumber).toBe(3);
    });

    it('should have unique IDs for each measure', () => {
      const measure1 = createEmptyMeasure();
      const measure2 = createEmptyMeasure();
      expect(measure1.id).not.toBe(measure2.id);
    });
  });

  describe('DEFAULT_TUNING_6_STRING', () => {
    it('should have 6 strings', () => {
      expect(DEFAULT_TUNING_6_STRING).toHaveLength(6);
    });

    it('should be in standard tuning EADGBE', () => {
      expect(DEFAULT_TUNING_6_STRING).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });
  });

  describe('DEFAULT_TAB_DATA', () => {
    it('should have default title', () => {
      expect(DEFAULT_TAB_DATA.title).toBe('Новая табулатура');
    });

    it('should have standard tuning', () => {
      expect(DEFAULT_TAB_DATA.tuning).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
    });

    it('should have one measure', () => {
      expect(DEFAULT_TAB_DATA.measures).toHaveLength(1);
    });

    it('should be private by default', () => {
      expect(DEFAULT_TAB_DATA.isPublic).toBe(false);
    });
  });
});