import { 
  createEmptyNote, 
  createEmptyMeasure, 
  createDefaultTab 
} from '../tabFactoryUtils';

describe('tabFactoryUtils', () => {
  describe('createEmptyNote', () => {
    it('should create note with null fret', () => {
      const note = createEmptyNote();
      expect(note.fret).toBeNull();
    });
  });

  describe('createEmptyMeasure', () => {
    it('should create measure with default parameters', () => {
      const measure = createEmptyMeasure();
      expect(measure.strings).toHaveLength(6);
      expect(measure.strings[0].notes).toHaveLength(16);
      expect(measure.timeSignature).toEqual([4, 4]);
    });

    it('should create measure with custom tuning length', () => {
      const measure = createEmptyMeasure(4);
      expect(measure.strings).toHaveLength(4);
    });

    it('should create measure with custom notes per measure', () => {
      const measure = createEmptyMeasure(6, 8);
      expect(measure.strings[0].notes).toHaveLength(8);
    });

    it('should use custom measure ID when provided', () => {
      const customId = 'custom-id-123';
      const measure = createEmptyMeasure(6, 16, customId);
      expect(measure.id).toBe(customId);
    });

    it('should generate unique ID when not provided', () => {
      const measure1 = createEmptyMeasure();
      const measure2 = createEmptyMeasure();
      expect(measure1.id).not.toBe(measure2.id);
    });
  });

  describe('createDefaultTab', () => {
    it('should create default tab with given title', () => {
      const tab = createDefaultTab('My Song');
      expect(tab.title).toBe('My Song');
    });

    it('should create default tab with default title', () => {
      const tab = createDefaultTab();
      expect(tab.title).toBe('Новая табулатура');
    });

    it('should have standard tuning', () => {
      const tab = createDefaultTab();
      expect(tab.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('should have one measure', () => {
      const tab = createDefaultTab();
      expect(tab.measures).toHaveLength(1);
    });

    it('should be private by default', () => {
      const tab = createDefaultTab();
      expect(tab.isPublic).toBe(false);
    });
  });
});