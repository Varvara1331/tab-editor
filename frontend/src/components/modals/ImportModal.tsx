/**
 * @fileoverview Модальное окно для импорта табулатуры.
 * Поддерживает drag-and-drop и выбор файла из файловой системы.
 * 
 * @module components/modals/ImportModal
 */

import React, { useState, useCallback, memo } from 'react';
import { TabData } from '../../types/tab';
import { importTabFromFile, canImportFile } from '../../utils/import/importUtils';
import { saveToLibrary } from '../../services/libraryService';

/**
 * Свойства компонента ImportModal
 */
interface ImportModalProps {
  /** Флаг открытия модального окна */
  isOpen: boolean;
  /** Функция закрытия модального окна */
  onClose: () => void;
  /** Функция обратного вызова при успешном импорте */
  onImportSuccess: (tabData: TabData) => void;
}

/**
 * Компонент модального окна импорта табулатуры.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованное модальное окно или null
 * 
 * @example
 * ```typescript
 * <ImportModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onImportSuccess={(tabData) => openEditor(tabData)}
 * />
 * ```
 */
const ImportModal: React.FC<ImportModalProps> = memo(({ isOpen, onClose, onImportSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Обработка импортированного файла
   * 
   * @param file - Файл для импорта
   */
  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Валидация файла
    if (!canImportFile(file)) {
      setError('Поддерживаются только файлы .json, .gp.json и .musicxml');
      setIsLoading(false);
      return;
    }

    try {
      const result = await importTabFromFile(file);
      
      if (result.success && result.tabData) {
        const saved = await saveToLibrary(result.tabData);
        
        if (saved) {
          setSuccessMessage(`Файл "${file.name}" успешно импортирован!`);
          onImportSuccess(result.tabData);
          
          // Автоматическое закрытие через 1.5 секунды после успешного импорта
          setTimeout(() => {
            onClose();
            setSuccessMessage(null);
          }, 1500);
        } else {
          setError('Не удалось сохранить табулатуру в библиотеку');
        }
      } else {
        setError(result.error || 'Ошибка при импорте файла');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при импорте');
    } finally {
      setIsLoading(false);
    }
  }, [onImportSuccess, onClose]);

  /**
   * Обработчик drop события (перетаскивание файла)
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * Обработчик drag over события (подсветка зоны при перетаскивании)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Обработчик drag leave события (снятие подсветки)
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Обработчик выбора файла через диалоговое окно
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * Обработчик клика по оверлею (закрытие при клике вне модального окна)
   */
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="modal-header">
          <h3>📁 Импорт табулатуры</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          {/* Зона drag-and-drop */}
          <div
            className={`import-dropzone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="import-icon" aria-hidden="true">📂</div>
            <p className="import-title">
              {isDragging ? 'Отпустите файл для импорта' : 'Перетащите файл сюда'}
            </p>
            <p className="import-subtitle">или</p>
            <label className="import-button">
              <input
                type="file"
                accept=".json,.gp.json,.musicxml,.xml"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
              Выберите файл на компьютере
            </label>
          </div>

          {/* Информация о поддерживаемых форматах */}
          <div className="import-info">
            <h4>Поддерживаемые форматы:</h4>
            <ul>
              <li>
                <strong>JSON (.json)</strong> — внутренний формат редактора
                <br />
                <small>Содержит полную структуру табулатуры</small>
              </li>
              <li>
                <strong>Guitar Pro JSON (.gp.json)</strong> — экспорт из Guitar Pro
                <br />
                <small>Совместимый формат с Guitar Pro (бета)</small>
              </li>
              <li>
                <strong>MusicXML (.musicxml, .xml)</strong> — стандартный нотный формат
                <br />
                <small>Поддерживается многими нотными редакторами</small>
              </li>
            </ul>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="import-error" role="alert">
              <span className="error-icon" aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Сообщение об успехе */}
          {successMessage && (
            <div className="import-success" role="status">
              <span className="success-icon" aria-hidden="true">✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Индикатор загрузки */}
          {isLoading && (
            <div className="import-loading">
              <div className="spinner"></div>
              <p>Импорт файла...</p>
            </div>
          )}
        </div>

        {/* Кнопка отмены */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading} type="button">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
});

ImportModal.displayName = 'ImportModal';

export default ImportModal;