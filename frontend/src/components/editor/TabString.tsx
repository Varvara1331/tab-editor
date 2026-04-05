/**
 * @fileoverview Компонент отдельной струны табулатуры.
 * Отображает ноты на одной струне с учётом эффектов и текущей позиции.
 * 
 * @module components/editor/TabString
 */

import React from 'react';
import { Note, CursorPosition } from '../../types/tab';

interface TabStringProps {
  /** Нота открытой струны */
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
  /** Функция обратного вызова при перетаскивании позиции */
  onPositionDrag?: (measureIndex: number, noteIndex: number) => void;
  /** Начальная ячейка слайда */
  slideStartCell?: number;
  /** Конечная ячейка слайда */
  slideEndCell?: number;
}

/**
 * Компонент отдельной струны табулатуры.
 * 
 * @component
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
}) => {
  /**
   * Получение символа для отображения ноты с учётом эффектов
   */
  const getNoteSymbol = (note: Note): string => {
    if (note.fret === null) return '-';
    let symbol = note.fret.toString();
    
    // Эффекты отображаются в определённом порядке
    if (note.bend) symbol = `(${symbol})`;
    if (note.hammer) symbol = `h${symbol}`;
    if (note.pull) symbol = `p${symbol}`;
    if (note.vibrato) symbol = `${symbol}~`;
    
    // Для слайда не меняем символ, так как он отображается в разделителе
    return symbol;
  };

  /**
   * Получение символа разделителя между нотами с учётом слайда
   */
  const getSeparatorSymbol = (currentNote: Note, nextNote: Note | undefined): string => {
    // Слайд от текущей ноты к следующей
    if (currentNote.slide === 'up') return '/';
    if (currentNote.slide === 'down') return '\\';
    if (currentNote.slide === 'both') return '↕';
    
    // Слайд от следующей ноты к текущей (обратный)
    if (nextNote?.slide === 'up') return '/';
    if (nextNote?.slide === 'down') return '\\';
    if (nextNote?.slide === 'both') return '↕';
    
    return '-';
  };

  /**
   * Проверка, является ли разделитель слайд-коннектором
   */
  const isSlideConnector = (separatorSymbol: string): boolean => {
    return separatorSymbol === '/' || separatorSymbol === '\\' || separatorSymbol === '↕';
  };

  /**
   * Проверка, играет ли нота в данный момент
   */
  const isPlayingNote = (noteIndex: number): boolean => {
    if (!playingPosition || playingPosition.measureIndex !== measureIndex) return false;
    return playingPosition.noteIndex === noteIndex;
  };

  /**
   * Проверка, является ли ячейка началом слайда
   */
  const isSlideStart = (noteIndex: number): boolean => 
    slideStartCell !== undefined && slideStartCell === noteIndex;

  /**
   * Проверка, является ли ячейка концом слайда
   */
  const isSlideEnd = (noteIndex: number): boolean => 
    slideEndCell !== undefined && slideEndCell === noteIndex;

  /**
   * Проверка, находится ли ячейка между началом и концом слайда
   */
  const isBetweenSlideCells = (noteIndex: number): boolean => {
    if (slideStartCell === undefined || slideEndCell === undefined) return false;
    const start = Math.min(slideStartCell, slideEndCell);
    const end = Math.max(slideStartCell, slideEndCell);
    return noteIndex > start && noteIndex < end;
  };

  /**
   * Обработчик начала перетаскивания позиции
   */
  const handleNoteMouseDown = (e: React.MouseEvent, noteIndex: number) => {
    e.stopPropagation();
    if (onPositionDrag && measureIndex !== undefined) {
      onPositionDrag(measureIndex, noteIndex);
    }
  };

  return (
    <div className={`tab-string ${isActive ? 'active' : ''}`}>
      <span className="string-label">{stringNote}│{stringNumber}</span>
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
                <span className="note-symbol">{getNoteSymbol(note)}</span>
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