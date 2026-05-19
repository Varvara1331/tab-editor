/**
 * @fileoverview Панель управления редактором табулатур.
 * Содержит инструменты для редактирования (эффекты), настройку строя и выбор размера такта.
 * 
 * @module components/editor/TabControls
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { 
  Type, Grip, Hash, Waves, ArrowUpDown, Sliders, Settings, ChevronDown, Music
} from 'lucide-react';
import { PRESET_TUNINGS } from '../../utils/tuningConstants';
import './TabEditor.css';

/**
 * Свойства компонента TabControls
 */
interface TabControlsProps {
  /** Выбранный инструмент редактирования */
  selectedTool: string;
  /** Функция выбора инструмента */
  onToolSelect: (tool: 'note' | 'bend' | 'hammer' | 'vibrato' | 'slide') => void;
  /** Размер такта (количество позиций) */
  notesPerMeasure?: number;
  /** Функция изменения размера такта */
  onNotesPerMeasureChange?: (size: number) => void;
  /** Режим только для чтения */
  isReadOnly?: boolean;
  /** Плеер для отображения в левой части панели */
  player?: ReactNode;
  /** Текущий строй гитары */
  tuning?: string[];
  /** Функция изменения строя */
  onTuningChange?: (newTuning: string[]) => void;
}

/** Доступные размеры такта для переключения */
const MEASURE_SIZES = [
  { value: 4, label: '4/4' },
  { value: 8, label: '8/8' },
  { value: 16, label: '16/16' }
];

/**
 * Панель управления редактором табулатур.
 * Включает выбор эффектов (нота, бенд, хаммер, вибрато, слайд),
 * настройку размера такта и конфигурацию строя гитары с предустановками.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованная панель управления
 */
const TabControls: React.FC<TabControlsProps> = ({
  selectedTool, onToolSelect,
  notesPerMeasure = 16, onNotesPerMeasureChange,
  isReadOnly = false,
  player,
  tuning: externalTuning,
  onTuningChange
}) => {
  /** Флаг отображения выпадающего списка предустановок строя */
  const [showTuningPresets, setShowTuningPresets] = useState(false);
  
  /** Локальное состояние строя гитары */
  const [localTuning, setLocalTuning] = useState<string[]>(externalTuning || ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);

  useEffect(() => {
    if (externalTuning && JSON.stringify(externalTuning) !== JSON.stringify(localTuning)) {
      setLocalTuning(externalTuning);
    }
  }, [externalTuning]);

  useEffect(() => {
    if (isReadOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (selectedTool !== 'note') onToolSelect('note');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (selectedTool !== 'bend') onToolSelect('bend');
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        if (selectedTool !== 'hammer') onToolSelect('hammer');
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (selectedTool !== 'vibrato') onToolSelect('vibrato');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (selectedTool !== 'slide') onToolSelect('slide');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly, selectedTool, onToolSelect]);

  /**
   * Изменение настройки отдельной струны
   * 
   * @param index - Индекс струны
   * @param value - Новое значение настройки
   */
  const handleTuningChange = (index: number, value: string) => {
    if (isReadOnly) return;
    const newTuning = [...localTuning];
    newTuning[index] = value.toUpperCase();
    setLocalTuning(newTuning);
    onTuningChange?.(newTuning);
  };

  /**
   * Применение предустановленного строя
   * 
   * @param presetName - Название предустановки
   */
  const applyPresetTuning = (presetName: string) => {
    if (isReadOnly) return;
    const preset = PRESET_TUNINGS[presetName];
    if (preset) {
      setLocalTuning([...preset]);
      onTuningChange?.([...preset]);
      setShowTuningPresets(false);
    }
  };

  /**
   * Получение названия текущего предустановленного строя
   * 
   * @returns Название предустановки или null, если строй кастомный
   */
  const getCurrentPresetName = () => {
    for (const [name, preset] of Object.entries(PRESET_TUNINGS)) {
      if (localTuning.length === preset.length && localTuning.every((note, i) => note === preset[i])) {
        return name;
      }
    }
    return null;
  };

  /**
   * Изменение размера такта
   * 
   * @param size - Новый размер такта (4, 8 или 16)
   */
  const handleSizeChange = (size: number) => {
    if (!isReadOnly && size !== notesPerMeasure && onNotesPerMeasureChange) {
      onNotesPerMeasureChange(size);
    }
  };

  const currentPreset = getCurrentPresetName();

  return (
    <div className="tools-panel">
      {player && (
        <div className="tools-left">
          {player}
        </div>
      )}

      <div className="tools-right">
        <div className="tools-row">
          <div className="tools-group">
            <span className="tools-label">Эффекты</span>
            <button 
              className={`tool-btn ${selectedTool === 'note' ? 'active' : ''}`} 
              onClick={() => onToolSelect('note')} 
              title="Нота (N)" 
              disabled={isReadOnly}
              type="button"
            >
              ♩
            </button>
            <button 
              className={`tool-btn ${selectedTool === 'bend' ? 'active' : ''}`} 
              onClick={() => onToolSelect('bend')} 
              title="Бенд (B)" 
              disabled={isReadOnly}
              type="button"
            >
              ⤴
            </button>
            <button 
              className={`tool-btn ${selectedTool === 'hammer' ? 'active' : ''}`} 
              onClick={() => onToolSelect('hammer')} 
              title="Хаммер (H)" 
              disabled={isReadOnly}
              type="button"
            >
              h
            </button>
            <button 
              className={`tool-btn ${selectedTool === 'vibrato' ? 'active' : ''}`} 
              onClick={() => onToolSelect('vibrato')} 
              title="Вибрато (V)" 
              disabled={isReadOnly}
              type="button"
            >
              ~
            </button>
            <button 
              className={`tool-btn ${selectedTool === 'slide' ? 'active' : ''}`} 
              onClick={() => onToolSelect('slide')} 
              title="Слайд (S)" 
              disabled={isReadOnly}
              type="button"
            >
              /
            </button>
          </div>

          {onNotesPerMeasureChange && (
            <div className="tools-group measure-size-group">
              <span className="tools-label">Размер</span>
              <div className="measure-size-buttons">
                {MEASURE_SIZES.map(size => (
                  <button
                    key={size.value}
                    className={`measure-size-btn ${notesPerMeasure === size.value ? 'active' : ''}`}
                    onClick={() => handleSizeChange(size.value)}
                    disabled={isReadOnly}
                    title={`${size.label} (${size.value} позиций)`}
                    type="button"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="tools-row">
          <div className="tools-group tuning-group">
            <span className="tools-label">Строй гитары</span>
            <div className="tuning-preset">
              <button 
                className="preset-btn" 
                onClick={() => setShowTuningPresets(!showTuningPresets)} 
                title="Выбрать предустановленный строй" 
                disabled={isReadOnly}
                type="button"
              >
                {currentPreset ? currentPreset : 'Выбрать строй'}
                <ChevronDown size={10} className="dropdown-arrow" />
              </button>
              {showTuningPresets && !isReadOnly && (
                <div className="preset-dropdown">
                  {Object.keys(PRESET_TUNINGS).map(presetName => (
                    <button 
                      key={presetName} 
                      className={`preset-option ${currentPreset === presetName ? 'active' : ''}`} 
                      onClick={() => applyPresetTuning(presetName)}
                      type="button"
                    >
                      {presetName}{currentPreset === presetName && ' ✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="tuning-inputs">
              {localTuning.map((note, index) => (
                <div key={index} className="tuning-input-wrapper">
                  <span className="string-number">{index + 1}</span>
                  <input 
                    type="text" 
                    value={note} 
                    onChange={(e) => handleTuningChange(index, e.target.value)} 
                    placeholder="E2" 
                    maxLength={3} 
                    className="tuning-input" 
                    title={`Струна ${index + 1}: ${note}`} 
                    disabled={isReadOnly} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabControls;