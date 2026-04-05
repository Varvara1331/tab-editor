/**
 * @fileoverview Компонент ввода лада.
 * Предоставляет интерфейс для ввода номера лада при нажатии цифровых клавиш.
 * 
 * @module components/editor/FretInput
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

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
 * 
 * @component
 */
const FretInput: React.FC<FretInputProps> = memo(({ onFretSubmit, maxFret = 24, enabled = true }) => {
  const [fretValue, setFretValue] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Глобальный обработчик клавиш для активации ввода
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

  /**
   * Отправка введённого лада
   */
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

  /**
   * Обработчик потери фокуса
   */
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