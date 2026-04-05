/**
 * @fileoverview Утилиты для работы с настройкой гитары.
 * Вычисление MIDI нот, частот, проверка и нормализация строев.
 * 
 * @module utils/tuningUtils
 */

import { PRESET_TUNINGS, NOTE_TO_MIDI } from './tuningConstants';

// Реэкспорт для обратной совместимости
export { PRESET_TUNINGS, NOTE_TO_MIDI };

/**
 * Получение MIDI номера для заданной струны и лада
 * 
 * @param tuningNote - Нота открытой струны (например, 'E4')
 * @param fret - Номер лада
 * @returns MIDI номер ноты
 * 
 * @example
 * ```typescript
 * getMidiForString('E4', 0) // 64 (E4)
 * getMidiForString('E4', 5) // 69 (A4)
 * ```
 */
export const getMidiForString = (tuningNote: string, fret: number): number => {
  const match = tuningNote.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) return 40 + fret;
  
  const note = match[1].toUpperCase();
  const octave = parseInt(match[2]);
  const semitone = NOTE_TO_MIDI[note] ?? 0;
  
  return (octave + 1) * 12 + semitone + fret;
};

/**
 * Получение частоты в герцах для заданной струны и лада
 * 
 * @param tuningNote - Нота открытой струны (например, 'E4')
 * @param fret - Номер лада
 * @returns Частота в герцах
 * 
 * @example
 * ```typescript
 * getFrequencyForString('A4', 0) // 440 (A4)
 * ```
 */
export const getFrequencyForString = (tuningNote: string, fret: number): number => {
  const midi = getMidiForString(tuningNote, fret);
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Проверка, является ли строй стандартным
 * 
 * @param tuning - Массив нот строя
 * @returns true если строй соответствует стандартному EADGBE
 * 
 * @example
 * ```typescript
 * isStandardTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']) // true
 * ```
 */
export const isStandardTuning = (tuning: string[]): boolean => {
  const standard = PRESET_TUNINGS.Standard;
  return tuning.length === standard.length && tuning.every((note, i) => note === standard[i]);
};

/**
 * Получение названия предустановленного строя
 * 
 * @param tuning - Массив нот строя
 * @returns Название строя или 'Custom', если не найден
 * 
 * @example
 * ```typescript
 * getTuningName(['E4', 'B3', 'G3', 'D3', 'A2', 'D2']) // 'Drop D'
 * ```
 */
export const getTuningName = (tuning: string[]): string => {
  for (const [name, preset] of Object.entries(PRESET_TUNINGS)) {
    if (tuning.length === preset.length && tuning.every((note, i) => note === preset[i])) {
      return name;
    }
  }
  return 'Custom';
};

/**
 * Проверка валидности строя
 * 
 * @param tuning - Массив нот строя
 * @returns true если строй содержит корректные ноты с октавами
 * 
 * @example
 * ```typescript
 * isValidTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']) // true
 * isValidTuning(['X4', 'B3']) // false
 * ```
 */
export const isValidTuning = (tuning: string[]): boolean => {
  if (!Array.isArray(tuning) || tuning.length === 0) return false;
  const pattern = /^[A-Ga-g][#b]?\d+$/;
  return tuning.every((note) => pattern.test(note));
};

/**
 * Нормализация строя (приведение нот к формату: нота с заглавной буквы + октава)
 * 
 * @param tuning - Массив нот строя
 * @returns Нормализованный массив нот
 * 
 * @example
 * ```typescript
 * normalizeTuning(['e4', 'b3', 'g3']) // ['E4', 'B3', 'G3']
 * ```
 */
export const normalizeTuning = (tuning: string[]): string[] => {
  return tuning.map((note) => {
    const match = note.match(/^([A-Ga-g][#b]?)(\d+)$/);
    if (!match) return note;
    return match[1].toUpperCase() + match[2];
  });
};