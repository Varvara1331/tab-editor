/**
 * @fileoverview Утилиты для создания пустых табулатур и тактов.
 * 
 * @module utils/tabFactoryUtils
 */

import { TabMeasure, Note, TabData } from '../types/tab';

/**
 * Создание пустой ноты (без лада)
 * 
 * @returns Пустая нота с fret = null
 * 
 * @example
 * ```typescript
 * const emptyNote = createEmptyNote();
 * console.log(emptyNote.fret); // null
 * ```
 */
export const createEmptyNote = (): Note => ({ fret: null });

/**
 * Создание пустого такта с пустыми нотами
 * 
 * @param tuningLength - Количество струн (по умолчанию 6)
 * @param notesPerMeasure - Количество нот в такте (по умолчанию 16)
 * @param measureId - ID такта (опционально, генерируется автоматически)
 * @returns Пустой такт с заполненными пустыми нотами
 * 
 * @example
 * ```typescript
 * const measure = createEmptyMeasure(6, 16);
 * console.log(measure.strings.length); // 6
 * console.log(measure.strings[0].notes.length); // 16
 * ```
 */
export const createEmptyMeasure = (
  tuningLength: number = 6, 
  notesPerMeasure: number = 16, 
  measureId?: string
): TabMeasure => ({
  id: measureId || `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  strings: Array.from({ length: tuningLength }, (_, stringIndex) => ({
    stringNumber: stringIndex,
    notes: Array.from({ length: notesPerMeasure }, () => createEmptyNote()),
  })),
  timeSignature: [4, 4],
});

/**
 * Создание табулатуры по умолчанию
 * 
 * @param title - Название табулатуры (по умолчанию 'Новая табулатура')
 * @param notesPerMeasure - Количество нот в такте (по умолчанию 16)
 * @returns Частичные данные табулатуры для дальнейшего редактирования
 * 
 * @example
 * ```typescript
 * const defaultTab = createDefaultTab('My Song', 16);
 * console.log(defaultTab.title); // 'My Song'
 * console.log(defaultTab.measures?.length); // 1
 * ```
 */
export const createDefaultTab = (
  title: string = 'Новая табулатура', 
  notesPerMeasure: number = 16
): Partial<TabData> => ({
  title,
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  measures: [createEmptyMeasure(6, notesPerMeasure)],
  isPublic: false,
});