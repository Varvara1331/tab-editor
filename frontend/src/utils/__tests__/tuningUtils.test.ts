import { 
  getMidiForString, 
  getFrequencyForString, 
  isStandardTuning, 
  getTuningName, 
  isValidTuning, 
  normalizeTuning,
  PRESET_TUNINGS
} from '../tuningUtils';

describe('tuningUtils', () => {
  describe('getMidiForString', () => {
    it('должен возвращать корректный MIDI-номер для открытой струны', () => {
      expect(getMidiForString('E4', 0)).toBe(64);
      expect(getMidiForString('A4', 0)).toBe(69);
    });

    it('должен возвращать корректный MIDI-номер для зажатой струны', () => {
      expect(getMidiForString('E4', 5)).toBe(69);
      expect(getMidiForString('A4', 12)).toBe(81);
    });
  });

  describe('getFrequencyForString', () => {
    it('должен возвращать корректную частоту для ноты A4', () => {
      expect(getFrequencyForString('A4', 0)).toBe(440);
    });

    it('должен возвращать корректную частоту для зажатой ноты', () => {
      const freq = getFrequencyForString('A4', 5);
      expect(freq).toBeCloseTo(587.33, 1);
    });
  });

  describe('isStandardTuning', () => {
    it('должен возвращать true для стандартного строя', () => {
      expect(isStandardTuning(PRESET_TUNINGS.Standard)).toBe(true);
    });

    it('должен возвращать false для нестандартного строя', () => {
      expect(isStandardTuning(PRESET_TUNINGS['Drop D'])).toBe(false);
    });
  });

  describe('getTuningName', () => {
    it('должен возвращать название для стандартного строя', () => {
      expect(getTuningName(PRESET_TUNINGS.Standard)).toBe('Standard');
    });

    it('должен возвращать "Custom" для неизвестного строя', () => {
      expect(getTuningName(['X1', 'Y2', 'Z3'])).toBe('Custom');
    });
  });

  describe('isValidTuning', () => {
    it('должен возвращать true для валидного строя', () => {
      expect(isValidTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])).toBe(true);
    });

    it('должен возвращать false для пустого массива', () => {
      expect(isValidTuning([])).toBe(false);
    });

    it('должен возвращать false для неверного формата ноты', () => {
      expect(isValidTuning(['X4', 'B3'])).toBe(false);
    });

    it('должен возвращать false для не-массива', () => {
      expect(isValidTuning(null as any)).toBe(false);
    });
  });

  describe('normalizeTuning', () => {
    it('должен приводить названия нот к верхнему регистру', () => {
      expect(normalizeTuning(['e4', 'b3', 'g3'])).toEqual(['E4', 'B3', 'G3']);
    });

    it('должен обрабатывать ноты с диезами', () => {
      expect(normalizeTuning(['f#4', 'c#5'])).toEqual(['F#4', 'C#5']);
    });
  });
});