/**
 * @fileoverview Компонент ввода лада.
 * Предоставляет интерфейс для ввода номера лада при нажатии цифровых клавиш.
 * 
 * @module components/editor/FretInput
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import './TabEditor.css';

/**
 * Свойства компонента FretInput
 */
interface FretInputProps {
  /** Функция обратного вызова при отправке лада */
  onFretSubmit: (fret: number) => void;
  /** Максимальный номер лада (по умолчанию 24) */
  maxFret?: number;
  /** Доступен ли ввод (по умолчанию true) */
  enabled?: boolean;
}

/**
 * Компонент ввода лада.
 * Появляется при нажатии цифровых клавиш и позволяет ввести двузначный лад.
 * Поддерживает ввод через клавиатуру (цифры, Enter, Escape) и кнопки мыши.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент или null, если не активен
 * 
 * @example
 * ```tsx
 * <FretInput 
 *   onFretSubmit={(fret) => addNoteAtCursor(fret)}
 *   maxFret={24}
 *   enabled={!isReadOnly}
 * />
 * ```
 */
const FretInput: React.FC<FretInputProps> = memo(({ onFretSubmit, maxFret = 24, enabled = true }) => {
  /** Текущее введённое значение лада */
  const [fretValue, setFretValue] = useState<string>('');
  /** Флаг активности компонента (отображения) */
  const [isActive, setIsActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key >= '0' && e.key <= '9' && !isActive) {
        e.preventDefault();
        setIsActive(true);
        setFretValue(e.key);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isActive, enabled]);

  /** Отправка введённого лада и закрытие компонента */
  const handleSubmit = useCallback(() => {
    if (fretValue) {
      const fret = parseInt(fretValue, 10);
      if (!isNaN(fret) && fret >= 0 && fret <= maxFret) {
        onFretSubmit(fret);
      }
    }
    setIsActive(false);
    setFretValue('');
  }, [fretValue, maxFret, onFretSubmit]);

  /**
   * Обработчик клавиш в поле ввода
   * 
   * @param e - Событие клавиатуры
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsActive(false);
      setFretValue('');
    }
  }, [handleSubmit]);

  /** Обработчик потери фокуса - отправляет значение или закрывает */
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (fretValue) handleSubmit();
      else setIsActive(false);
    }, 200);
  }, [fretValue, handleSubmit]);

  if (!isActive) return null;

  return (
    <div className="fret-input-overlay">
      <div className="fret-input-container">
        <span className="fret-input-label">Введите лад (0-{maxFret}):</span>
        <input
          ref={inputRef}
          type="number"
          min="0"
          max={maxFret}
          value={fretValue}
          onChange={(e) => setFretValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="fret-input-field"
          autoFocus
        />
        <button onClick={handleSubmit} className="fret-input-btn" type="button">OK</button>
        <button onClick={() => setIsActive(false)} className="fret-input-btn cancel" type="button">Отмена</button>
      </div>
    </div>
  );
});

FretInput.displayName = 'FretInput';
export default FretInput;