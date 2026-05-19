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
    it('should return correct MIDI for open string', () => {
      expect(getMidiForString('E4', 0)).toBe(64);
      expect(getMidiForString('A4', 0)).toBe(69);
    });

    it('should return correct MIDI for fretted string', () => {
      expect(getMidiForString('E4', 5)).toBe(69);
      expect(getMidiForString('A4', 12)).toBe(81);
    });
  });

  describe('getFrequencyForString', () => {
    it('should return correct frequency for A4', () => {
      expect(getFrequencyForString('A4', 0)).toBe(440);
    });

    it('should return correct frequency for fretted note', () => {
      const freq = getFrequencyForString('A4', 5);
      expect(freq).toBeCloseTo(587.33, 1);
    });
  });

  describe('isStandardTuning', () => {
    it('should return true for standard tuning', () => {
      expect(isStandardTuning(PRESET_TUNINGS.Standard)).toBe(true);
    });

    it('should return false for non-standard tuning', () => {
      expect(isStandardTuning(PRESET_TUNINGS['Drop D'])).toBe(false);
    });
  });

  describe('getTuningName', () => {
    it('should return name for standard tuning', () => {
      expect(getTuningName(PRESET_TUNINGS.Standard)).toBe('Standard');
    });

    it('should return "Custom" for unknown tuning', () => {
      expect(getTuningName(['X1', 'Y2', 'Z3'])).toBe('Custom');
    });
  });

  describe('isValidTuning', () => {
    it('should return true for valid tuning', () => {
      expect(isValidTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(isValidTuning([])).toBe(false);
    });

    it('should return false for invalid note format', () => {
      expect(isValidTuning(['X4', 'B3'])).toBe(false);
    });

    it('should return false for non-array', () => {
      expect(isValidTuning(null as any)).toBe(false);
    });
  });

  describe('normalizeTuning', () => {
    it('should normalize note names to uppercase', () => {
      expect(normalizeTuning(['e4', 'b3', 'g3'])).toEqual(['E4', 'B3', 'G3']);
    });

    it('should handle sharp notes', () => {
      expect(normalizeTuning(['f#4', 'c#5'])).toEqual(['F#4', 'C#5']);
    });
  });
});