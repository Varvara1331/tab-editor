/**
 * @fileoverview Панель управления редактором табулатур.
 * Содержит инструменты для редактирования, настройку строя и управление тактами.
 * 
 * @module components/editor/TabControls
 */

import React, { useState, useEffect } from 'react';
import { PRESET_TUNINGS } from '../../utils/tuningConstants';

interface TabControlsProps {
  /** Выбранный инструмент */
  selectedTool: string;
  /** Функция выбора инструмента */
  onToolSelect: (tool: 'note' | 'bend' | 'hammer' | 'vibrato' | 'slide') => void;
  /** Функция добавления такта */
  onAddMeasure: () => void;
  /** Текущий строй гитары */
  tuning: string[];
  /** Функция изменения строя */
  onTuningChange: (tuning: string[]) => void;
  /** Функция увеличения масштаба */
  onZoomIn?: () => void;
  /** Функция уменьшения масштаба */
  onZoomOut?: () => void;
  /** Режим только для чтения */
  isReadOnly?: boolean;
  /** Раскладка табулатуры */
  layout?: 'horizontal' | 'vertical';
  /** Функция изменения раскладки */
  onLayoutChange?: (layout: 'horizontal' | 'vertical') => void;
}

/**
 * Панель управления редактором табулатур.
 * 
 * @component
 */
const TabControls: React.FC<TabControlsProps> = ({
  selectedTool, onToolSelect, onAddMeasure, tuning, onTuningChange,
  onZoomIn, onZoomOut, isReadOnly = false,
  layout = 'horizontal', onLayoutChange,
}) => {
  const [showTuningPresets, setShowTuningPresets] = useState(false);

  // Обработчик клавиш для переключения инструментов
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
   */
  const handleTuningChange = (index: number, value: string) => {
    if (isReadOnly) return;
    const newTuning = [...tuning];
    newTuning[index] = value.toUpperCase();
    onTuningChange(newTuning);
  };

  /**
   * Применение предустановленного строя
   */
  const applyPresetTuning = (presetName: string) => {
    if (isReadOnly) return;
    const preset = PRESET_TUNINGS[presetName];
    if (preset) {
      onTuningChange([...preset]);
      setShowTuningPresets(false);
    }
  };

  /**
   * Получение названия текущего предустановленного строя
   */
  const getCurrentPresetName = () => {
    for (const [name, preset] of Object.entries(PRESET_TUNINGS)) {
      if (tuning.length === preset.length && tuning.every((note, i) => note === preset[i])) {
        return name;
      }
    }
    return null;
  };

  const currentPreset = getCurrentPresetName();

  return (
    <div className="tools-panel">
      {/* Инструменты */}
      <div className="tools-group">
        <button 
          className={`tool-btn ${selectedTool === 'note' ? 'active' : ''}`} 
          onClick={() => onToolSelect('note')} 
          title="Нота (цифры 0-9 или N)" 
          disabled={isReadOnly}
          type="button"
        >
          <span>♩</span> Нота
        </button>
        <button 
          className={`tool-btn ${selectedTool === 'bend' ? 'active' : ''}`} 
          onClick={() => onToolSelect('bend')} 
          title="Бенд (B)" 
          disabled={isReadOnly}
          type="button"
        >
          <span>⤴</span> Бенд
        </button>
        <button 
          className={`tool-btn ${selectedTool === 'hammer' ? 'active' : ''}`} 
          onClick={() => onToolSelect('hammer')} 
          title="Хаммер (H)" 
          disabled={isReadOnly}
          type="button"
        >
          <span>h</span> Хаммер
        </button>
        <button 
          className={`tool-btn ${selectedTool === 'vibrato' ? 'active' : ''}`} 
          onClick={() => onToolSelect('vibrato')} 
          title="Вибрато (V)" 
          disabled={isReadOnly}
          type="button"
        >
          <span>~</span> Вибрато
        </button>
        <button 
          className={`tool-btn ${selectedTool === 'slide' ? 'active' : ''}`} 
          onClick={() => onToolSelect('slide')} 
          title="Слайд (S)" 
          disabled={isReadOnly}
          type="button"
        >
          <span>↕</span> Слайд
        </button>
      </div>

      {/* Переключатель раскладки */}
      {onLayoutChange && (
        <div className="tools-group">
          <div className="layout-toggle">
            <button 
              className={`layout-btn ${layout === 'horizontal' ? 'active' : ''}`}
              onClick={() => onLayoutChange('horizontal')}
              title="Горизонтальный вид (все такты в строку)"
              disabled={isReadOnly}
              type="button"
            >
              <span>↔️</span> Гориз.
            </button>
            <button 
              className={`layout-btn ${layout === 'vertical' ? 'active' : ''}`}
              onClick={() => onLayoutChange('vertical')}
              title="Вертикальный вид (такты в столбец)"
              disabled={isReadOnly}
              type="button"
            >
              <span>↕️</span> Верт.
            </button>
          </div>
        </div>
      )}

      {/* Масштаб */}
      <div className="tools-group">
        <button className="tool-btn icon-only" onClick={onZoomOut} title="Уменьшить" type="button">
          <span>−</span>
        </button>
        <button className="tool-btn icon-only" onClick={onZoomIn} title="Увеличить" type="button">
          <span>+</span>
        </button>
      </div>

      {/* Настройка строя */}
      <div className="tuning-section">
        <h4>Строй</h4>
        <div className="tuning-controls">
          <div className="tuning-preset">
            <button 
              className="preset-btn" 
              onClick={() => setShowTuningPresets(!showTuningPresets)} 
              title="Выбрать предустановленный строй" 
              disabled={isReadOnly}
              type="button"
            >
              {currentPreset ? `📌 ${currentPreset}` : '📌 Выбрать строй'}
              <span className="dropdown-arrow">▼</span>
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
            {tuning.map((note, index) => (
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

      {/* Добавление такта */}
      <div className="tools-group">
        <button className="tool-btn" onClick={onAddMeasure} disabled={isReadOnly} type="button">
          <span>+</span> Добавить такт
        </button>
      </div>
    </div>
  );
};

export default TabControls;