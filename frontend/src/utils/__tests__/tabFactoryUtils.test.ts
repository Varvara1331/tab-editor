import { 
  createEmptyNote, 
  createEmptyMeasure, 
  createDefaultTab 
} from '../tabFactoryUtils';

describe('tabFactoryUtils', () => {
  describe('createEmptyNote', () => {
    it('должен создавать ноту с пустым ладом (null)', () => {
      const note = createEmptyNote();
      expect(note.fret).toBeNull();
    });
  });

  describe('createEmptyMeasure', () => {
    it('должен создавать такт с параметрами по умолчанию', () => {
      const measure = createEmptyMeasure();
      expect(measure.strings).toHaveLength(6);
      expect(measure.strings[0].notes).toHaveLength(16);
      expect(measure.timeSignature).toEqual([4, 4]);
    });

    it('должен создавать такт с пользовательским количеством струн', () => {
      const measure = createEmptyMeasure(4);
      expect(measure.strings).toHaveLength(4);
    });

    it('должен создавать такт с пользовательским количеством нот на такт', () => {
      const measure = createEmptyMeasure(6, 8);
      expect(measure.strings[0].notes).toHaveLength(8);
    });

    it('должен использовать пользовательский ID такта когда он предоставлен', () => {
      const customId = 'custom-id-123';
      const measure = createEmptyMeasure(6, 16, customId);
      expect(measure.id).toBe(customId);
    });

    it('должен генерировать уникальный ID когда он не предоставлен', () => {
      const measure1 = createEmptyMeasure();
      const measure2 = createEmptyMeasure();
      expect(measure1.id).not.toBe(measure2.id);
    });
  });

  describe('createDefaultTab', () => {
    it('должен создавать табулатуру по умолчанию с указанным заголовком', () => {
      const tab = createDefaultTab('My Song');
      expect(tab.title).toBe('My Song');
    });

    it('должен создавать табулатуру с заголовком по умолчанию', () => {
      const tab = createDefaultTab();
      expect(tab.title).toBe('Новая табулатура');
    });

    it('должен иметь стандартный строй', () => {
      const tab = createDefaultTab();
      expect(tab.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });

    it('должен содержать один такт', () => {
      const tab = createDefaultTab();
      expect(tab.measures).toHaveLength(1);
    });

    it('должен быть приватным по умолчанию', () => {
      const tab = createDefaultTab();
      expect(tab.isPublic).toBe(false);
    });
  });
});