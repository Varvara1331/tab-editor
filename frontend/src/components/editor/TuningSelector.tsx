/**
 * @fileoverview Компонент выбора строя гитары.
 * Позволяет выбирать предустановленные строи и настраивать струны вручную.
 * 
 * @module components/editor/TuningSelector
 */

import React from 'react';
import { PRESET_TUNINGS, getTuningName } from '../../utils/tuningUtils';
import './TabEditor.css';

interface TuningSelectorProps {
  /** Текущий строй гитары */
  tuning: string[];
  /** Функция изменения строя */
  onTuningChange: (newTuning: string[]) => void;
}

/**
 * Компонент выбора строя гитары.
 * 
 * @component
 * @example
 * ```typescript
 * <TuningSelector
 *   tuning={['E4', 'B3', 'G3', 'D3', 'A2', 'E2']}
 *   onTuningChange={(newTuning) => setTuning(newTuning)}
 * />
 * ```
 */
const TuningSelector: React.FC<TuningSelectorProps> = ({ tuning, onTuningChange }) => {
  const currentTuningName = getTuningName(tuning);

  /**
   * Обработчик выбора предустановленного строя
   */
  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = event.target.value;
    if (presetName && PRESET_TUNINGS[presetName]) {
      onTuningChange([...PRESET_TUNINGS[presetName]]);
    }
  };

  /**
   * Обработчик изменения отдельной струны
   */
  const handleStringTuningChange = (index: number, value: string) => {
    const newTuning = [...tuning];
    newTuning[index] = value;
    onTuningChange(newTuning);
  };

  return (
    <div className="tuning-selector">
      <div className="tuning-preset">
        <label>Предустановленный строй:</label>
        <select 
          value={currentTuningName === 'Custom' ? '' : currentTuningName} 
          onChange={handlePresetChange}
        >
          <option value="">Выберите строй...</option>
          {Object.keys(PRESET_TUNINGS).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      
      <div className="tuning-custom">
        <label>Кастомный строй:</label>
        <div className="tuning-strings">
          {tuning.map((note, index) => (
            <div key={index} className="tuning-string">
              <span>Струна {index + 1}:</span>
              <input 
                type="text" 
                value={note} 
                onChange={(e) => handleStringTuningChange(index, e.target.value)} 
                placeholder="Например: E4" 
                className="tuning-input" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TuningSelector;