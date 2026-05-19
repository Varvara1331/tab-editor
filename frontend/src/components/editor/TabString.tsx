/**
 * @fileoverview Компонент отдельной струны табулатуры.
 * Отображает ноты на одной струне с учётом эффектов и текущей позиции.
 * 
 * @module components/editor/TabString
 */

import React from 'react';
import { Note, CursorPosition } from '../../types/tab';
import './TabEditor.css';

/**
 * Свойства компонента TabString
 */
interface TabStringProps {
  /** Нота открытой струны (настройка) */
  stringNote: string;
  /** Номер струны (1-6) */
  stringNumber: number;
  /** Массив нот на струне */
  notes: Note[];
  /** Активна ли струна (под курсором) */
  isActive: boolean;
  /** Позиция курсора на струне */
  cursorPosition: number;
  /** Функция обратного вызова при клике на ноту */
  onClick: (noteIndex: number) => void;
  /** Текущая позиция воспроизведения */
  playingPosition?: CursorPosition | null;
  /** Индекс такта */
  measureIndex?: number;
  /** Режим только для чтения */
  isReadOnly?: boolean;
  /** Функция обратного вызова при перетаскивании позиции воспроизведения */
  onPositionDrag?: (measureIndex: number, noteIndex: number) => void;
  /** Индекс начальной ячейки слайда */
  slideStartCell?: number;
  /** Индекс конечной ячейки слайда */
  slideEndCell?: number;
  /** Показывать ли название струны/строя (только для первого такта) */
  showStringLabel?: boolean;
}

/**
 * Компонент отдельной струны табулатуры.
 * Отображает последовательность нот на одной струне, поддерживает подсветку
 * текущей позиции курсора, позиции воспроизведения и эффекты (бенд, хаммер, слайд, вибрато).
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованная строка табулатуры с нотами
 */
const TabString: React.FC<TabStringProps> = ({
  stringNote, 
  stringNumber, 
  notes, 
  isActive, 
  cursorPosition, 
  onClick,
  playingPosition, 
  measureIndex, 
  onPositionDrag, 
  slideStartCell, 
  slideEndCell,
  showStringLabel = true,
}) => {
  /**
   * Получение символа для отображения ноты с учётом эффектов
   * 
   * @param note - Объект ноты
   * @returns Строковое представление ноты с эффектами
   */
  const getNoteSymbol = (note: Note): string => {
    if (note.fret === null) return '-';
    let symbol = note.fret.toString();
    
    if (note.bend) symbol = `(${symbol})`;
    
    if (note.hammer && typeof note.hammer === 'object') {
      return `${note.hammer.fromFret}h${note.hammer.toFret}`;
    }
    if (note.hammer === true) {
      symbol = `h${symbol}`;
    }
    
    if (note.pull) symbol = `p${symbol}`;
    if (note.vibrato) symbol = `${symbol}~`;
    
    return symbol;
  };

  /**
   * Получение символа разделителя между нотами с учётом слайда
   * 
   * @param currentNote - Текущая нота
   * @param nextNote - Следующая нота
   * @returns Символ разделителя ('/', '\\', '↕' или '-')
   */
  const getSeparatorSymbol = (currentNote: Note, nextNote: Note | undefined): string => {
    if (currentNote.slide === 'up') return '/';
    if (currentNote.slide === 'down') return '\\';
    if (currentNote.slide === 'both') return '↕';
    
    return '-';
  };

  const isSlideConnector = (separatorSymbol: string): boolean => {
    return separatorSymbol === '/' || separatorSymbol === '\\' || separatorSymbol === '↕';
  };

  /**
   * Проверка, играет ли нота в данный момент
   * 
   * @param noteIndex - Индекс ноты
   * @returns true, если нота воспроизводится
   */
  const isPlayingNote = (noteIndex: number): boolean => {
    if (!playingPosition || playingPosition.measureIndex !== measureIndex) return false;
    return playingPosition.noteIndex === noteIndex;
  };

  const isSlideStart = (noteIndex: number): boolean => 
    slideStartCell !== undefined && slideStartCell === noteIndex;

  const isSlideEnd = (noteIndex: number): boolean => 
    slideEndCell !== undefined && slideEndCell === noteIndex;

  const isBetweenSlideCells = (noteIndex: number): boolean => {
    if (slideStartCell === undefined || slideEndCell === undefined) return false;
    const start = Math.min(slideStartCell, slideEndCell);
    const end = Math.max(slideStartCell, slideEndCell);
    return noteIndex > start && noteIndex < end;
  };

  /**
   * Обработчик начала перетаскивания позиции воспроизведения
   * 
   * @param e - Событие мыши
   * @param noteIndex - Индекс ноты
   */
  const handleNoteMouseDown = (e: React.MouseEvent, noteIndex: number) => {
    e.stopPropagation();
    if (onPositionDrag && measureIndex !== undefined) {
      onPositionDrag(measureIndex, noteIndex);
    }
  };

  return (
    <div className={`tab-string ${isActive ? 'active' : ''}`}>
      {showStringLabel && (
        <span className="string-label">{stringNote}│{stringNumber}</span>
      )}
      {!showStringLabel && (
        <span className="string-label string-label-empty"></span>
      )}
      <div className="notes-container">
        {notes.map((note, index) => {
          const nextNote = notes[index + 1];
          const separatorSymbol = getSeparatorSymbol(note, nextNote);
          const isPlaying = isPlayingNote(index);
          const isSlideConn = isSlideConnector(separatorSymbol);
          
          let slideHighlightClass = '';
          if (isSlideStart(index)) slideHighlightClass = 'slide-start';
          else if (isSlideEnd(index)) slideHighlightClass = 'slide-end';
          else if (isBetweenSlideCells(index)) slideHighlightClass = 'slide-between';

          const noteSymbol = getNoteSymbol(note);
          
          return (
            <React.Fragment key={`note-${index}`}>
              <div 
                className={`note-cell ${index === cursorPosition && isActive ? 'cursor' : ''} ${isPlaying ? 'playing' : ''} ${slideHighlightClass}`}
                onClick={() => onClick(index)} 
                onMouseDown={(e) => handleNoteMouseDown(e, index)} 
                data-measure={measureIndex} 
                data-note={index}
                role="button"
                tabIndex={0}
                style={{ position: 'relative' }}
              >
                <span className="note-symbol">{noteSymbol}</span>
                {isPlaying && (
                  <div className="playing-indicator">
                    <div className="playing-wave"></div>
                  </div>
                )}
              </div>
              {index < notes.length - 1 && (
                <span className={`separator ${isSlideConn ? 'slide-connector' : ''}`}>
                  {separatorSymbol}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TabString;