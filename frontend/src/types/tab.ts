/**
 * @fileoverview TypeScript типы и интерфейсы для работы с табулатурами.
 * Содержит определения нот, струн, тактов и основных структур данных табулатуры.
 * 
 * @module types/tab
 */

/**
 * Артикуляция ноты (эффекты исполнения)
 */
export interface NoteArticulation {
  /** Бенд (подтяжка струны) */
  bend?: boolean;
  /** Слайд (скольжение): 'up' - вверх, 'down' - вниз, 'both' - в обе стороны */
  slide?: 'up' | 'down' | 'both';
  hammer?: boolean;
  /** Пулл-офф (срыв с лада) */
  pull?: boolean;
  /** Вибрато */
  vibrato?: boolean;
}

/**
 * Нота табулатуры
 */
export interface Note extends NoteArticulation {
  /** Номер лада (null - пауза или пустое место) */
  fret: number | null;
  /** Длительность ноты (опционально) */
  duration?: number;
}

/**
 * Струна табулатуры с массивом нот
 */
export interface TabString {
  /** Номер струны (1 - самая нижняя/толстая, 6 - самая верхняя/тонкая) */
  stringNumber: number;
  /** Массив нот на струне (по позициям в такте) */
  notes: Note[];
}

/**
 * Размер такта (числитель/знаменатель)
 * @example [4, 4] - размер 4/4
 * @example [3, 4] - размер 3/4
 */
export type TimeSignature = [number, number];

/**
 * Такт табулатуры
 */
export interface TabMeasure {
  /** Уникальный идентификатор такта */
  id: string;
  /** Массив струн с нотами */
  strings: TabString[];
  /** Темп в ударах в минуту (опционально) */
  tempo?: number;
  /** Размер такта (по умолчанию [4, 4]) */
  timeSignature?: TimeSignature;
}

/**
 * Полные данные табулатуры
 */
export interface TabData {
  /** ID табулатуры в базе данных (undefined для новых) */
  id?: number;
  /** ID пользователя-владельца */
  userId?: number;
  /** Название табулатуры */
  title: string;
  /** Исполнитель (опционально) */
  artist?: string;
  /** Строй гитары (массив нот для каждой струны) */
  tuning: string[];
  /** Массив тактов табулатуры */
  measures: TabMeasure[];
  /** Дата создания */
  createdAt?: Date;
  /** Дата последнего обновления */
  updatedAt?: Date;
  /** Публичный статус */
  isPublic?: boolean;
  /** Принадлежит ли текущему пользователю */
  isOwn?: boolean;
  /** Количество нот в такте (по умолчанию 16) */
  notesPerMeasure?: number;
}

/**
 * Позиция курсора в редакторе
 */
export interface CursorPosition {
  /** Индекс такта */
  measureIndex: number;
  /** Индекс струны */
  stringIndex: number;
  /** Индекс ноты в такте */
  noteIndex: number;
}

/**
 * Данные для создания новой табулатуры
 */
export type CreateTabData = Pick<TabData, 'title' | 'artist' | 'tuning' | 'measures'> & {
  isPublic?: boolean;
};

/**
 * Данные для обновления существующей табулатуры
 */
export type UpdateTabData = Partial<Omit<TabData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

/**
 * Проверка, является ли значение валидной позицией курсора
 * 
 * @param pos - Проверяемое значение
 * @returns true если значение является CursorPosition
 * 
 * @example
 * ```typescript
 * const pos = { measureIndex: 0, stringIndex: 1, noteIndex: 2 };
 * if (isValidCursorPosition(pos)) {
 *   // pos имеет правильный тип
 * }
 * ```
 */
export const isValidCursorPosition = (pos: unknown): pos is CursorPosition => {
  return (
    typeof pos === 'object' &&
    pos !== null &&
    typeof (pos as CursorPosition).measureIndex === 'number' &&
    typeof (pos as CursorPosition).stringIndex === 'number' &&
    typeof (pos as CursorPosition).noteIndex === 'number'
  );
};

/**
 * Генерация уникального ID для такта
 * 
 * @returns Уникальная строка ID
 * 
 * @example
 * ```typescript
 * const measureId = generateMeasureId();
 * console.log(measureId); // "1634567890123-abc123def"
 * ```
 */
export const generateMeasureId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Создание пустой ноты (пауза)
 * 
 * @returns Нота с fret = null
 * 
 * @example
 * ```typescript
 * const emptyNote = createEmptyNote();
 * console.log(emptyNote.fret); // null
 * ```
 */
export const createEmptyNote = (): Note => ({ fret: null });

/**
 * Создание ноты с указанным ладом
 * 
 * @param fret - Номер лада
 * @returns Нота с заданным ладом
 * 
 * @example
 * ```typescript
 * const note = createNoteWithFret(5);
 * console.log(note.fret); // 5
 * ```
 */
export const createNoteWithFret = (fret: number): Note => ({ fret });

/**
 * Создание пустого такта с указанным количеством струн
 * 
 * @param stringsCount - Количество струн (по умолчанию 6)
 * @returns Пустой такт без нот
 * 
 * @example
 * ```typescript
 * const measure = createEmptyMeasure(6);
 * console.log(measure.strings.length); // 6
 * ```
 */
export const createEmptyMeasure = (stringsCount: number = 6): TabMeasure => ({
  id: generateMeasureId(),
  strings: Array.from({ length: stringsCount }, (_, i) => ({
    stringNumber: i + 1,
    notes: [],
  })),
});

/**
 * Стандартный строй 6-струнной гитары (EADGBE)
 * Струны перечислены от нижней (толстой) к верхней (тонкой)
 */
export const DEFAULT_TUNING_6_STRING = ['E', 'A', 'D', 'G', 'B', 'E'];

/**
 * Данные табулатуры по умолчанию
 * Используются для создания новой пустой табулатуры
 */
export const DEFAULT_TAB_DATA: Pick<TabData, 'title' | 'tuning' | 'measures' | 'isPublic'> = {
  title: 'Новая табулатура',
  tuning: DEFAULT_TUNING_6_STRING,
  measures: [createEmptyMeasure(6)],
  isPublic: false,
};