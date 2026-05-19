/**
 * @fileoverview Компонент выбора размера такта.
 * Позволяет переключаться между предустановленными размерами: 4/4, 8/8, 16/16.
 * 
 * @module components/editor/MeasureSizeSelector
 */

import React from 'react';
import './TabEditor.css';

/**
 * Свойства компонента MeasureSizeSelector
 */
interface MeasureSizeSelectorProps {
  /** Текущий размер такта (количество позиций) */
  notesPerMeasure: number;
  /** Функция обратного вызова при изменении размера */
  onNotesPerMeasureChange: (size: number) => void;
  /** Режим только для чтения (по умолчанию false) */
  isReadOnly?: boolean;
}

/** Доступные размеры такта */
const MEASURE_SIZES = [4, 8, 16];

/**
 * Компонент выбора размера такта.
 * Позволяет переключаться между предустановленными размерами: 4/4, 8/8, 16/16.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент выбора размера
 * 
 * @example
 * ```tsx
 * <MeasureSizeSelector
 *   notesPerMeasure={16}
 *   onNotesPerMeasureChange={(size) => setNotesPerMeasure(size)}
 *   isReadOnly={false}
 * />
 * ```
 */
const MeasureSizeSelector: React.FC<MeasureSizeSelectorProps> = ({
  notesPerMeasure,
  onNotesPerMeasureChange,
  isReadOnly = false,
}) => {
  /**
   * Обработчик изменения размера такта
   * 
   * @param size - Новый размер такта
   */
  const handleSizeChange = (size: number) => {
    if (!isReadOnly && size !== notesPerMeasure) {
      onNotesPerMeasureChange(size);
    }
  };

  /**
   * Получение отображаемого названия размера такта
   * 
   * @param size - Размер такта (4, 8 или 16)
   * @returns Название в формате X/X
   */
  const getSizeLabel = (size: number): string => {
    switch (size) {
      case 4: return '4/4';
      case 8: return '8/8';
      case 16: return '16/16';
      default: return `${size}/16`;
    }
  };

  return (
    <div className="measure-size-selector">
      <span className="measure-size-label">🎵 Размер такта:</span>
      <div className="measure-size-buttons">
        {MEASURE_SIZES.map(size => (
          <button
            key={size}
            className={`measure-size-btn ${notesPerMeasure === size ? 'active' : ''}`}
            onClick={() => handleSizeChange(size)}
            disabled={isReadOnly}
            title={`${size} позиций в такте (${getSizeLabel(size)})`}
            type="button"
          >
            {getSizeLabel(size)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MeasureSizeSelector;