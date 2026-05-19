/**
 * @fileoverview Модальное окно для импорта табулатуры.
 * Поддерживает drag-and-drop и выбор файла из файловой системы.
 * 
 * @module components/modals/ImportModal
 */

import React, { useState, useCallback, memo } from 'react';
import { Upload, FileJson, Music, FileCode, AlertCircle, CheckCircle } from 'lucide-react';
import { TabData } from '../../types/tab';
import { importTabFromFile, canImportFile } from '../../utils/import/importUtils';
import { saveToLibrary } from '../../services/libraryService';
import './Modal.css';

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
 * Поддерживает drag-and-drop и выбор файла через диалоговое окно.
 * Обрабатывает файлы форматов JSON, Guitar Pro JSON и MusicXML.
 * Автоматически сохраняет импортированную табулатуру в библиотеку.
 * 
 * @component
 * @param props - Свойства компонента
 * @param props.isOpen - Флаг открытия модального окна
 * @param props.onClose - Функция закрытия модального окна
 * @param props.onImportSuccess - Колбэк при успешном импорте (получает импортированные данные)
 * @returns Отрисованное модальное окно или null, если isOpen = false
 * 
 * @example
 * ```tsx
 * const [isModalOpen, setIsModalOpen] = useState(false);
 * 
 * <ImportModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onImportSuccess={(tabData) => {
 *     setCurrentTab(tabData);
 *     setIsModalOpen(false);
 *   }}
 * />
 * ```
 */
const ImportModal: React.FC<ImportModalProps> = memo(({ isOpen, onClose, onImportSuccess }) => {
  /** Флаг активного перетаскивания файла (для подсветки зоны) */
  const [isDragging, setIsDragging] = useState(false);
  /** Флаг выполнения операции импорта */
  const [isLoading, setIsLoading] = useState(false);
  /** Текст сообщения об ошибке */
  const [error, setError] = useState<string | null>(null);
  /** Текст сообщения об успешном импорте */
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Обработка импортированного файла.
   * Валидирует, импортирует и сохраняет табулатуру в библиотеку.
   * 
   * @param file - Файл для импорта
   */
  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

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
   * Обработчик события drop (перетаскивание файла в зону импорта)
   * 
   * @param e - Событие перетаскивания
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
   * Обработчик события drag over (подсветка зоны при перетаскивании)
   * 
   * @param e - Событие перетаскивания
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * Обработчик события drag leave (снятие подсветки зоны)
   * 
   * @param e - Событие перетаскивания
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Обработчик выбора файла через диалоговое окно
   * 
   * @param e - Событие изменения поля ввода
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * Обработчик клика по оверлею.
   * Закрывает модальное окно при клике на фон.
   * 
   * @param e - Событие клика
   */
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Upload size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Импорт табулатуры
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <div className="modal-body">
          <div
            className={`import-dropzone ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="import-icon">
              <Upload size={48} />
            </div>
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

          <div className="import-info">
            <h4>Поддерживаемые форматы:</h4>
            <ul>
              <li>
                <strong>JSON (.json)</strong> — внутренний формат редактора
                <br />
                <small>Содержит полную структуру табулатуры</small>
              </li>
              <li>
                <strong>MusicXML (.musicxml, .xml)</strong> — стандартный нотный формат
                <br />
                <small>Поддерживается многими нотными редакторами</small>
              </li>
            </ul>
          </div>

          {error && (
            <div className="import-error" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="import-success" role="status">
              <CheckCircle size={18} className="success-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoading && (
            <div className="import-loading">
              <div className="spinner"></div>
              <p>Импорт файла...</p>
            </div>
          )}
        </div>

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