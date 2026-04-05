/**
 * @fileoverview Модальное окно для экспорта табулатуры.
 * Позволяет выбрать формат экспорта и имя файла.
 * 
 * @module components/modals/ExportModal
 */

import React, { useState, useCallback, memo, useMemo } from 'react';
import { TabData } from '../../types/tab';
import { downloadTab, ExportFormat } from '../../utils/export/exportUtils';
import { sanitizeFilename } from '../../utils/stringUtils';

/**
 * Свойства компонента ExportModal
 */
interface ExportModalProps {
  /** Данные табулатуры для экспорта */
  tabData: TabData;
  /** Флаг открытия модального окна */
  isOpen: boolean;
  /** Функция закрытия модального окна */
  onClose: () => void;
}

/**
 * Доступные форматы экспорта
 */
const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string; description: string }> = [
  { value: 'pdf', label: 'PDF документ (.pdf)', description: 'Профессиональный формат для печати и обмена' },
  { value: 'json', label: 'JSON (.json)', description: 'Внутренний формат для повторной загрузки' },
  { value: 'gp', label: 'Guitar Pro (.gp.json)', description: 'Совместимый с Guitar Pro формат (бета)' },
  { value: 'xml', label: 'MusicXML (.musicxml)', description: 'Стандартный нотный формат' },
];

/**
 * Компонент модального окна экспорта табулатуры.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованное модальное окно или null
 * 
 * @example
 * ```typescript
 * <ExportModal
 *   tabData={tabData}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 * />
 * ```
 */
const ExportModal: React.FC<ExportModalProps> = memo(({ tabData, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [filename, setFilename] = useState<string>(() => sanitizeFilename(tabData.title || 'tab'));

  /**
   * Обработчик экспорта табулатуры
   */
  const handleExport = useCallback(async () => {
    await downloadTab(tabData, selectedFormat, filename);
    onClose();
  }, [tabData, selectedFormat, filename, onClose]);

  /**
   * Обработчик изменения формата
   */
  const handleFormatChange = useCallback((format: ExportFormat) => {
    setSelectedFormat(format);
  }, []);

  /**
   * Обработчик изменения имени файла
   */
  const handleFilenameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(sanitizeFilename(e.target.value));
  }, []);

  /**
   * Обработчик клика по оверлею (закрытие при клике вне модального окна)
   */
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  /**
   * Информация для предпросмотра
   */
  const previewInfo = useMemo(() => ({
    title: tabData.title,
    artist: tabData.artist || 'Не указан',
    measuresCount: tabData.measures.length,
    stringsCount: tabData.tuning.length,
    tuning: tabData.tuning.join(' '),
  }), [tabData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="modal-header">
          <h3>Экспорт табулатуры</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          {/* Поле ввода имени файла */}
          <div className="form-group">
            <label htmlFor="filename">Имя файла:</label>
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={handleFilenameChange}
              placeholder="имя_файла"
              className="filename-input"
              aria-label="Имя файла для экспорта"
            />
          </div>

          {/* Выбор формата */}
          <div className="form-group">
            <label>Формат файла:</label>
            <div className="format-options">
              {EXPORT_FORMATS.map((format) => (
                <label
                  key={format.value}
                  className={`format-option ${selectedFormat === format.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={() => handleFormatChange(format.value)}
                  />
                  <div className="format-info">
                    <span className="format-label">{format.label}</span>
                    <span className="format-description">{format.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Информация о файле */}
          <div className="preview-info">
            <h4>Информация о файле:</h4>
            <ul>
              <li>Название: {previewInfo.title}</li>
              <li>Исполнитель: {previewInfo.artist}</li>
              <li>Тактов: {previewInfo.measuresCount}</li>
              <li>Струн: {previewInfo.stringsCount}</li>
              <li>Строй: {previewInfo.tuning}</li>
            </ul>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleExport} type="button">
            Скачать
          </button>
        </div>
      </div>
    </div>
  );
});

ExportModal.displayName = 'ExportModal';

export default ExportModal;