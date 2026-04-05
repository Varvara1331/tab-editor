/**
 * @fileoverview Основной компонент редактора табулатур.
 * Предоставляет полный функционал для создания, редактирования и сохранения табулатур.
 * Поддерживает ввод нот, эффекты, навигацию, автосохранение и многое другое.
 * 
 * @module components/editor/TabEditor
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabData, TabMeasure, CursorPosition } from '../../types/tab';
import TabString from './TabString';
import TabControls from './TabControls';
import TabPlayer from './TabPlayer';
import ExportModal from '../modals/ExportModal';
import MeasureSizeSelector from './MeasureSizeSelector';
import { saveToLibrary, updateInLibrary } from '../../services/libraryService';
import { getCurrentUser } from '../../services/authService';
import './TabEditor.css';

// ==================== КОНСТАНТЫ ====================

/** Стандартный строй 6-струнной гитары (EADGBE) */
const DEFAULT_TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

/** Количество тактов по умолчанию для новой табулатуры */
const DEFAULT_MEASURE_COUNT = 1;

/** Максимальный номер лада (24 лада - стандарт для большинства гитар) */
const MAX_FRET = 24;

// ==================== ИНТЕРФЕЙСЫ ====================

/**
 * Свойства компонента TabEditor
 */
interface TabEditorProps {
  /** Начальные данные табулатуры (при редактировании существующей) */
  initialTabData?: TabData;
  /** Функция обратного вызова при изменении данных */
  onTabDataChange?: () => void;
  /** Функция обратного вызова при сохранении */
  onTabSaved?: () => void;
  /** Функция обратного вызова для создания новой табулатуры */
  onNewTabRequest?: () => void;
  /** Функция обратного вызова при изменении состояния (для сохранения в localStorage) */
  onStateChange?: (state: any) => void;
  /** Восстановленное состояние (из localStorage) */
  restoredState?: any;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Инициализация массива тактов с пустыми нотами
 * 
 * @param count - Количество тактов
 * @param notesCount - Количество нот в такте (по умолчанию 16)
 * @returns Массив пустых тактов
 */
const initializeMeasures = (count: number, notesCount: number = 16): TabMeasure[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `measure-${i}-${Date.now()}`,
    strings: DEFAULT_TUNING.map((_, stringIndex) => ({
      stringNumber: stringIndex,
      notes: Array.from({ length: notesCount }, () => ({ fret: null })),
    })),
    timeSignature: notesCount === 4 ? [4, 4] : notesCount === 8 ? [8, 8] : [16, 16],
  }));
};

/**
 * Главный компонент редактора табулатур
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный редактор табулатур
 */
const TabEditor: React.FC<TabEditorProps> = ({ 
  initialTabData, 
  onTabDataChange, 
  onTabSaved, 
  onNewTabRequest, 
  onStateChange, 
  restoredState 
}) => {
  const currentUser = getCurrentUser();
  const hasRestoredRef = useRef<boolean>(false);

  // ==================== СОСТОЯНИЯ ====================

  /** Количество нот в такте (размер такта: 4, 8 или 16) */
  const [notesPerMeasure, setNotesPerMeasure] = useState<number>(() => {
    if (restoredState?.notesPerMeasure !== undefined && !hasRestoredRef.current) {
      return restoredState.notesPerMeasure;
    }
    if (initialTabData?.notesPerMeasure) {
      return initialTabData.notesPerMeasure;
    }
    if (initialTabData?.measures?.[0]?.strings?.[0]?.notes?.length) {
      return initialTabData.measures[0].strings[0].notes.length;
    }
    return 16;
  });

  /** Данные табулатуры */
  const [tabData, setTabData] = useState<TabData>(() => {
    // Восстановление сохранённого состояния
    if (restoredState?.tabData && !hasRestoredRef.current) { 
      hasRestoredRef.current = true; 
      return restoredState.tabData; 
    }
    // Редактирование существующей табулатуры
    if (initialTabData) {
      const loadedNotesPerMeasure = initialTabData.notesPerMeasure || 
                                    initialTabData.measures[0]?.strings[0]?.notes?.length || 
                                    16;
      
      if (loadedNotesPerMeasure !== notesPerMeasure) {
        setTimeout(() => setNotesPerMeasure(loadedNotesPerMeasure), 0);
      }
      return { 
        ...initialTabData,
        isOwn: initialTabData.userId === currentUser?.id || !initialTabData.userId,
        notesPerMeasure: loadedNotesPerMeasure
      };
    }
    // Новая табулатура
    return { 
      id: undefined, 
      userId: currentUser?.id, 
      title: 'Новая табулатура', 
      artist: '', 
      tuning: DEFAULT_TUNING, 
      measures: initializeMeasures(DEFAULT_MEASURE_COUNT, notesPerMeasure), 
      notesPerMeasure: notesPerMeasure,
      createdAt: new Date(), 
      updatedAt: new Date(), 
      isPublic: false, 
      isOwn: true 
    };
  });

  /** Режим только для чтения (просмотр чужой табулатуры) */
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => {
    if (restoredState?.isReadOnly !== undefined && !hasRestoredRef.current) {
      return restoredState.isReadOnly;
    }
    return tabData.isOwn === false;
  });

  /** Публичный статус табулатуры */
  const [isPublic, setIsPublic] = useState<boolean>(() => {
    if (restoredState?.isPublic !== undefined && !hasRestoredRef.current) {
      return restoredState.isPublic;
    }
    return tabData.isPublic || false;
  });

  /** Флаг новой табулатуры (ещё не сохранённой) */
  const [isNewTab, setIsNewTab] = useState<boolean>(() => {
    if (restoredState?.isNewTab !== undefined && !hasRestoredRef.current) {
      return restoredState.isNewTab;
    }
    return !tabData.id;
  });

  /** Текущая позиция курсора (такт, струна, нота) */
  const [cursor, setCursor] = useState<CursorPosition>(() => 
    restoredState?.cursor && !hasRestoredRef.current 
      ? restoredState.cursor 
      : { measureIndex: 0, stringIndex: 0, noteIndex: 0 }
  );
  
  /** Выбранный инструмент для редактирования */
  const [selectedTool, setSelectedTool] = useState<'note' | 'bend' | 'hammer' | 'vibrato' | 'slide'>(() => 
    restoredState?.selectedTool && !hasRestoredRef.current 
      ? restoredState.selectedTool 
      : 'note'
  );
  
  /** Текущая позиция воспроизведения (для плеера) */
  const [playingPosition, setPlayingPosition] = useState<CursorPosition | null>(null);
  
  /** Позиция полоски воспроизведения (в пикселях) */
  const [playheadLeft, setPlayheadLeft] = useState<number | null>(null);
  
  /** Флаг перетаскивания полоски воспроизведения */
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);
  
  /** Ожидаемый ввод лада (для двузначных чисел) */
  const [pendingFret, setPendingFret] = useState<string>('');
  
  /** Уровень масштабирования (50-200%) */
  const [zoom, setZoom] = useState<number>(() => 
    restoredState?.zoom !== undefined && !hasRestoredRef.current 
      ? restoredState.zoom 
      : 100
  );
  
  /** Имя файла для экспорта */
  const [fileName] = useState<string>(() => 
    restoredState?.fileName && !hasRestoredRef.current 
      ? restoredState.fileName 
      : 'Без названия.gp'
  );
  
  /** Флаг открытия модального окна экспорта */
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  
  /** Флаг сохранения (для предотвращения повторных сохранений) */
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  /** Раскладка табулатуры: горизонтальная (в строку) или вертикальная (в столбец) */
  const [tabLayout, setTabLayout] = useState<'horizontal' | 'vertical'>(() => 
    restoredState?.tabLayout && !hasRestoredRef.current 
      ? restoredState.tabLayout 
      : 'horizontal'
  );

  // ==================== REFS ====================
  
  /** Ref контейнера с тактами (для скролла и позиционирования) */
  const measuresContainerRef = useRef<HTMLDivElement>(null);
  
  /** Таймер для двузначного ввода лада */
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /** Флаг обработки (для предотвращения конфликтов) */
  const isProcessingRef = useRef<boolean>(false);
  
  /** Флаг перетаскивания (для глобальных обработчиков) */
  const isDraggingRef = useRef<boolean>(false);

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  /**
   * Очистка таймера ввода лада
   */
  const clearFretTimeout = useCallback(() => { 
    if (timeoutRef.current) { 
      clearTimeout(timeoutRef.current); 
      timeoutRef.current = null; 
    } 
  }, []);

  /**
   * Изменение размера такта (количества позиций)
   * При изменении размера все такты адаптируются (добавляются/удаляются пустые ноты)
   * 
   * @param newSize - Новый размер такта (4, 8 или 16)
   */
  const handleNotesPerMeasureChange = useCallback((newSize: number) => {
    if (isReadOnly) return;
    
    setTabData(prev => {
      const newMeasures = prev.measures.map(measure => {
        const newStrings = measure.strings.map(string => {
          const currentNotes = string.notes;
          let newNotes;
          
          if (newSize > currentNotes.length) {
            // Добавление пустых нот в конец
            newNotes = [
              ...currentNotes,
              ...Array.from({ length: newSize - currentNotes.length }, () => ({ fret: null }))
            ];
          } else if (newSize < currentNotes.length) {
            // Обрезание лишних нот
            newNotes = currentNotes.slice(0, newSize);
          } else {
            newNotes = currentNotes;
          }
          
          return { ...string, notes: newNotes };
        });
        
        return { ...measure, strings: newStrings };
      });
      
      // ВАЖНО: сохраняем notesPerMeasure в tabData
      return { 
        ...prev, 
        measures: newMeasures,
        notesPerMeasure: newSize
      };
    });
    
    setNotesPerMeasure(newSize);
    
    // Корректировка позиции курсора
    setCursor(prev => ({
      ...prev,
      noteIndex: Math.min(prev.noteIndex, newSize - 1)
    }));
  }, [isReadOnly]);

  /**
   * Добавление ноты на текущей позиции курсора
   * 
   * @param fretValue - Номер лада (0-24)
   */
  const addNoteAtCursor = useCallback((fretValue: number) => {
    if (isReadOnly || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setTabData(prev => {
      const newMeasures = [...prev.measures];
      const measure = { ...newMeasures[cursor.measureIndex] };
      const strings = [...measure.strings];
      const string = { ...strings[cursor.stringIndex] };
      const notes = [...string.notes];
      const noteData: any = { fret: fretValue };
      
      // Добавление эффекта в зависимости от выбранного инструмента
      if (selectedTool !== 'note') {
        if (selectedTool === 'slide') {
          noteData.slide = 'up';
        } else {
          noteData[selectedTool] = true;
        }
      }
      
      notes[cursor.noteIndex] = { ...notes[cursor.noteIndex], ...noteData };
      string.notes = notes;
      strings[cursor.stringIndex] = string;
      measure.strings = strings;
      newMeasures[cursor.measureIndex] = measure;
      
      return { ...prev, measures: newMeasures };
    });

    // Автоматическое перемещение курсора на следующую позицию
    setCursor(prev => ({ 
      ...prev, 
      noteIndex: Math.min(prev.noteIndex + 1, notesPerMeasure - 1) 
    }));

    setTimeout(() => { 
      isProcessingRef.current = false; 
    }, 100);
  }, [cursor, selectedTool, isReadOnly, notesPerMeasure]);

  /**
   * Удаление ноты на текущей позиции курсора
   */
  const handleDeleteNote = useCallback(() => {
    if (isReadOnly) return;
    
    setTabData(prev => {
      const newMeasures = [...prev.measures];
      const measure = { ...newMeasures[cursor.measureIndex] };
      const strings = [...measure.strings];
      const string = { ...strings[cursor.stringIndex] };
      const notes = [...string.notes];
      
      notes[cursor.noteIndex] = { fret: null };
      
      string.notes = notes;
      strings[cursor.stringIndex] = string;
      measure.strings = strings;
      newMeasures[cursor.measureIndex] = measure;
      
      return { ...prev, measures: newMeasures };
    });
  }, [cursor, isReadOnly]);

  /**
   * Обработчик клика по ноте для установки курсора
   * 
   * @param measureIndex - Индекс такта
   * @param stringIndex - Индекс струны
   * @param noteIndex - Индекс ноты в такте
   */
  const handleNoteClick = useCallback((measureIndex: number, stringIndex: number, noteIndex: number) => {
    if (isReadOnly) return;
    
    setCursor({ measureIndex, stringIndex, noteIndex });
    setPendingFret('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [isReadOnly]);

  /**
   * Глобальный обработчик клавиш для навигации и ввода нот
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isReadOnly) return;
    
    // Игнорирование ввода в полях ввода
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Ввод цифр для указания лада
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      if (isProcessingRef.current) return;
      
      setPendingFret(prev => {
        const newPending = prev + e.key;
        
        // Двузначный лад (10-24)
        if (newPending.length === 2) {
          const fretValue = parseInt(newPending, 10);
          if (fretValue >= 0 && fretValue <= MAX_FRET) {
            addNoteAtCursor(fretValue);
          }
          clearFretTimeout();
          return '';
        }
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Таймер для однозначного лада (0-9)
        timeoutRef.current = setTimeout(() => {
          const fretValue = parseInt(newPending, 10);
          if (!isNaN(fretValue) && fretValue >= 0 && fretValue <= 9) {
            addNoteAtCursor(fretValue);
          }
          setPendingFret('');
          clearFretTimeout();
        }, 500);
        
        return newPending;
      });
      return;
    }

    // Навигация по табулатуре
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setCursor(prev => ({ 
          ...prev, 
          noteIndex: Math.min(prev.noteIndex + 1, notesPerMeasure - 1)
        }));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setCursor(prev => ({ 
          ...prev, 
          noteIndex: Math.max(prev.noteIndex - 1, 0) 
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCursor(prev => ({ 
          ...prev, 
          stringIndex: Math.max(prev.stringIndex - 1, 0) 
        }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCursor(prev => ({ 
          ...prev, 
          stringIndex: Math.min(prev.stringIndex + 1, DEFAULT_TUNING.length - 1) 
        }));
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (!isProcessingRef.current) handleDeleteNote();
        break;
      case 'Escape':
        setPendingFret('');
        clearFretTimeout();
        break;
      default:
        // Выбор инструмента
        if (e.key === 'b') setSelectedTool('bend');
        else if (e.key === 'h') setSelectedTool('hammer');
        else if (e.key === 'v') setSelectedTool('vibrato');
        else if (e.key === 's') setSelectedTool('slide');
        break;
    }
  }, [addNoteAtCursor, clearFretTimeout, cursor, isReadOnly, handleDeleteNote, notesPerMeasure]);

  // ==================== ОБРАБОТЧИКИ ДЕЙСТВИЙ ====================

  /**
   * Добавление нового такта
   */
  const addMeasure = () => {
    if (isReadOnly) return;
    setTabData(prev => ({ 
      ...prev, 
      measures: [...prev.measures, { 
        id: `measure-${prev.measures.length}-${Date.now()}`, 
        strings: DEFAULT_TUNING.map((_, stringIndex) => ({ 
          stringNumber: stringIndex, 
          notes: Array.from({ length: notesPerMeasure }, () => ({ fret: null })) 
        })), 
        timeSignature: notesPerMeasure === 4 ? [4, 4] : notesPerMeasure === 8 ? [8, 8] : [16, 16]
      }],
      notesPerMeasure: notesPerMeasure
    }));
  };

  /**
   * Удаление такта
   * 
   * @param index - Индекс удаляемого такта
   */
  const removeMeasure = (index: number) => {
    if (isReadOnly || tabData.measures.length <= 1) return;
    setTabData(prev => ({ ...prev, measures: prev.measures.filter((_, i) => i !== index) }));
  };

  /** Увеличение масштаба (макс. 200%) */
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  
  /** Уменьшение масштаба (мин. 50%) */
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  /**
   * Сохранение табулатуры в библиотеку
   */
  const handleSaveToLibrary = async () => {
    if (!tabData.isOwn) {
      alert('Нельзя сохранять чужие табулатуры');
      return;
    }
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // Добавление метаданных о размере такта
      const tabDataWithMeta = {
        ...tabData,
        notesPerMeasure: notesPerMeasure,
      };
      
      const success = await saveToLibrary(tabDataWithMeta);
      if (success) {
        // Для новой табулатуры получаем ID от сервера
        if (isNewTab && tabData.id === undefined) {
          const { getLibrary } = await import('../../services/libraryService');
          const updatedTabs = await getLibrary();
          const savedTab = updatedTabs
            .filter(t => t.tabData.title === tabData.title)
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0];
          
          if (savedTab) { 
            setTabData(prev => ({ 
              ...prev, 
              id: savedTab.id, 
              updatedAt: new Date(savedTab.lastModified), 
              isOwn: true 
            })); 
            setIsNewTab(false); 
          }
        }
        alert('Табулатура сохранена в библиотеку');
        if (onTabSaved) onTabSaved();
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (error) { 
      console.error('Error saving tab:', error); 
      alert('Ошибка при сохранении');
    } finally { 
      setIsSaving(false); 
    }
  };

  /** Открытие модального окна экспорта */
  const handleDownload = () => setIsExportModalOpen(true);
  
  /**
   * Публикация/скрытие табулатуры
   */
  const handlePublish = async () => {
    if (!tabData.isOwn) {
      alert('Нельзя публиковать чужие табулатуры');
      return;
    }
    
    if (isReadOnly) { 
      alert('Нельзя изменять чужие табулатуры'); 
      return; 
    }
    
    try {
      const updatedTab = { ...tabData, isPublic: !isPublic };
      const success = await saveToLibrary(updatedTab);
      if (success) { 
        setIsPublic(!isPublic); 
        setTabData(updatedTab); 
        alert(isPublic ? 'Табулатура скрыта' : 'Табулатура опубликована'); 
        if (onTabSaved) onTabSaved(); 
      }
    } catch (error) { 
      console.error('Error publishing tab:', error); 
      alert('Ошибка при публикации'); 
    }
  };

  /**
   * Обработчик изменения названия
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (!isReadOnly) setTabData(prev => ({ ...prev, title: e.target.value })); 
  };
  
  /**
   * Обработчик изменения исполнителя
   */
  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (!isReadOnly) setTabData(prev => ({ ...prev, artist: e.target.value })); 
  };
  
  /**
   * Обработчик изменения строя
   */
  const handleTuningChange = (newTuning: string[]) => { 
    if (!isReadOnly) setTabData({ ...tabData, tuning: newTuning }); 
  };
  
  /**
   * Обработчик изменения позиции воспроизведения
   */
  const handlePlayingPositionChange = useCallback((position: CursorPosition) => {
    setPlayingPosition(position);
  }, []);

  // ==================== ОБРАБОТЧИКИ ПОЛОСКИ ВОСПРОИЗВЕДЕНИЯ ====================

  /**
   * Обработчик позиции полоски от плеера
   */
  const handlePlayheadPosition = useCallback((position: { left: number; measureIndex: number; noteIndex: number } | null) => {
    if (position && !isDraggingRef.current) {
      setPlayheadLeft(position.left);
    } else if (position === null) {
      setPlayheadLeft(null);
    }
  }, []);

  /**
   * Начало перетаскивания полоски
   */
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    isDraggingRef.current = true;
    
    // Меняем курсор на время перетаскивания
    document.body.style.cursor = 'ew-resize';
    
    // Сразу обрабатываем позицию под курсором
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const noteCell = element?.closest('.note-cell');
    if (noteCell) {
      const measureIndex = parseInt(noteCell.getAttribute('data-measure') || '-1');
      const noteIndex = parseInt(noteCell.getAttribute('data-note') || '-1');
      
      if (measureIndex >= 0 && noteIndex >= 0) {
        const containerRect = measuresContainerRef.current?.getBoundingClientRect();
        const noteRect = noteCell.getBoundingClientRect();
        const scrollLeft = measuresContainerRef.current?.scrollLeft || 0;
        if (containerRect) {
          const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
          setPlayheadLeft(leftPosition);
          
          // Отправляем событие для плеера
          const event = new CustomEvent('seekToPosition', {
            detail: { measureIndex, noteIndex }
          });
          window.dispatchEvent(event);
        }
      }
    }
  }, []);

  /**
   * Глобальный обработчик движения мыши (для перетаскивания полоски)
   */
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !measuresContainerRef.current) return;
    
    // Находим элемент под курсором
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const noteCell = element?.closest('.note-cell');
    
    if (noteCell) {
      const measureIndex = parseInt(noteCell.getAttribute('data-measure') || '-1');
      const noteIndex = parseInt(noteCell.getAttribute('data-note') || '-1');
      
      if (measureIndex >= 0 && noteIndex >= 0) {
        const containerRect = measuresContainerRef.current.getBoundingClientRect();
        const noteRect = noteCell.getBoundingClientRect();
        const scrollLeft = measuresContainerRef.current.scrollLeft;
        const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
        
        // Обновляем позицию полоски во время перетаскивания
        setPlayheadLeft(leftPosition);
        
        // Отправляем событие для плеера
        const event = new CustomEvent('seekToPosition', {
          detail: { measureIndex, noteIndex }
        });
        window.dispatchEvent(event);
      }
    }
  }, []);

  /**
   * Глобальный обработчик отпускания мыши (окончание перетаскивания)
   */
  const handleGlobalMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
    isDraggingRef.current = false;
    document.body.style.cursor = '';
  }, []);

  // ==================== ЭФФЕКТЫ ====================

  /**
   * Сохранение состояния для восстановления (при переключении вкладок)
   */
  useEffect(() => {
    if (onStateChange && !initialTabData) {
      onStateChange({ 
        tabData, 
        isReadOnly, 
        isPublic, 
        isNewTab, 
        cursor, 
        selectedTool, 
        zoom, 
        fileName,
        tabLayout,
        notesPerMeasure
      });
    }
  }, [tabData, isReadOnly, isPublic, isNewTab, cursor, selectedTool, zoom, fileName, tabLayout, notesPerMeasure, onStateChange, initialTabData]);

  /**
   * Сброс флага восстановления при новой загрузке
   */
  useEffect(() => { 
    if (initialTabData) hasRestoredRef.current = false; 
  }, [initialTabData]);

  /**
   * Регистрация глобального обработчика клавиш
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      if (timeoutRef.current) clearTimeout(timeoutRef.current); 
    };
  }, [handleKeyDown]);

  /**
   * Регистрация глобальных обработчиков для перетаскивания полоски
   */
  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingPlayhead, handleGlobalMouseMove, handleGlobalMouseUp]);

  /**
   * Автосохранение при изменениях (с задержкой 2 секунды)
   */
  useEffect(() => {
    if (!tabData.isOwn || !tabData.id || isSaving || isReadOnly) {
      return;
    }
    
    const timeoutId = setTimeout(() => { 
      if (tabData.id && tabData.isOwn && !isSaving && !isReadOnly) {
        updateInLibrary(tabData.id, tabData).catch(console.error);
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [tabData, isReadOnly, isSaving, tabData.isOwn]);

  /**
   * Синхронизация размера такта с загруженными данными
   */
  useEffect(() => {
    if (tabData.measures && tabData.measures.length > 0) {
      // Получаем реальную длину массива нот из первого такта первой струны
      const actualNotesPerMeasure = tabData.measures[0]?.strings[0]?.notes?.length || 16;
      
      // Используем notesPerMeasure из tabData или фактическую длину
      const targetNotesPerMeasure = tabData.notesPerMeasure || actualNotesPerMeasure;
      
      if (targetNotesPerMeasure !== notesPerMeasure) {
        setNotesPerMeasure(targetNotesPerMeasure);
      }
    }
  }, [tabData.measures, tabData.notesPerMeasure]);

  // ==================== РЕНДЕР ====================
  
  return (
    <div className={`tab-editor ${tabLayout}`}>
      {/* Баннер режима только для чтения */}
      {isReadOnly && (
        <div className="readonly-banner">
          ⚠️ Режим просмотра. Вы не можете изменять эту табулатуру.
        </div>
      )}
      
      {/* Верхняя панель с информацией о файле и действиями */}
      <div className="editor-header">
        <div className="file-info">
          <div className="file-icon">🎸</div>
          <div className="file-details">
            <input 
              type="text" 
              value={tabData.title} 
              onChange={handleTitleChange} 
              className="title-input" 
              placeholder="Название композиции" 
              disabled={isReadOnly} 
            />
            <p>
              {fileName} • {tabData.measures.length} тактов • {tabData.tuning.length} струн
              {tabData.artist && ` • `}
              <input 
                type="text" 
                value={tabData.artist || ''} 
                onChange={handleArtistChange} 
                className="artist-input-inline" 
                placeholder="Исполнитель" 
                disabled={isReadOnly} 
              />
            </p>
          </div>
        </div>
        <div className="file-actions">
          <button className="btn btn-secondary" onClick={onNewTabRequest}>✨ Новая</button>
          {!isReadOnly && tabData.isOwn && (
            <button 
              className={`btn ${isPublic ? 'btn-success' : 'btn-secondary'}`} 
              onClick={handlePublish} 
              disabled={isSaving}
            >
              {isPublic ? '🌍 Опубликовано' : '🚀 Опубликовать'}
            </button>
          )}
          {tabData.isOwn && (
            <button 
              className="btn btn-primary" 
              onClick={handleSaveToLibrary} 
              disabled={isSaving}
            >
              {isSaving ? '⏳ Сохранение...' : '💾 Сохранить'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleDownload}>⬇️ Скачать</button>
        </div>
      </div>

      {/* Плеер для воспроизведения */}
      <TabPlayer 
        tabData={tabData} 
        onPositionChange={handlePlayingPositionChange}
        onPlayheadPosition={handlePlayheadPosition}
        measuresContainerRef={measuresContainerRef}
      />

      {/* Панель инструментов */}
      <TabControls 
        selectedTool={selectedTool} 
        onToolSelect={setSelectedTool} 
        onAddMeasure={addMeasure} 
        tuning={tabData.tuning} 
        onTuningChange={handleTuningChange} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        isReadOnly={isReadOnly}
        layout={tabLayout}
        onLayoutChange={setTabLayout}
      />

      {/* Селектор размера такта */}
      <div className="tools-panel" style={{ justifyContent: 'space-between' }}>
        <MeasureSizeSelector
          notesPerMeasure={notesPerMeasure}
          onNotesPerMeasureChange={handleNotesPerMeasureChange}
          isReadOnly={isReadOnly}
        />
      </div>

      {/* Индикатор ввода лада */}
      {pendingFret && !isReadOnly && (
        <div className="fret-indicator">
          Лад: {pendingFret}
        </div>
      )}

      {/* Холст с табулатурой */}
      <div 
        className="tab-canvas" 
        ref={measuresContainerRef} 
        style={{ 
          position: 'relative', 
          overflow: tabLayout === 'horizontal' ? 'auto' : 'visible',
          maxHeight: tabLayout === 'vertical' ? 'calc(100vh - 300px)' : 'none'
        }}
      >
        <div 
          className={`measures-container ${tabLayout}`}
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: '0 0',
            display: tabLayout === 'horizontal' ? 'flex' : 'block',
            flexDirection: tabLayout === 'horizontal' ? 'row' : 'column',
            gap: tabLayout === 'horizontal' ? '20px' : '0',
            minWidth: tabLayout === 'horizontal' ? 'max-content' : 'auto'
          }}
        >
          {/* Отображение каждого такта */}
          {tabData.measures.map((measure, measureIndex) => (
            <div 
              key={measure.id} 
              className={`measure ${tabLayout}`}
              style={{
                marginBottom: tabLayout === 'vertical' ? '20px' : '0',
                borderBottom: tabLayout === 'vertical' ? '1px solid #444' : 'none',
                paddingBottom: tabLayout === 'vertical' ? '10px' : '0'
              }}
            >
              <div className="measure-header">
                <span className="measure-number">Такт {measureIndex + 1}</span>
                <div className="measure-controls">
                  {measureIndex > 0 && !isReadOnly && (
                    <button
                      className="measure-btn"
                      onClick={() => removeMeasure(measureIndex)}
                      title="Удалить такт"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              {/* Отображение каждой струны */}
              {tabData.tuning.map((note, stringIndex) => (
                <TabString 
                  key={`${measure.id}-string-${stringIndex}`} 
                  stringNote={note} 
                  stringNumber={stringIndex + 1}
                  notes={measure.strings[stringIndex]?.notes || []} 
                  isActive={cursor.measureIndex === measureIndex && cursor.stringIndex === stringIndex}
                  cursorPosition={cursor.noteIndex} 
                  onClick={(noteIndex) => handleNoteClick(measureIndex, stringIndex, noteIndex)}
                  playingPosition={playingPosition}
                  measureIndex={measureIndex} 
                  isReadOnly={isReadOnly} 
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Полоска воспроизведения */}
        <div 
          className="tab-playhead" 
          style={{ 
            display: playheadLeft !== null && playingPosition ? 'block' : 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: playheadLeft !== null ? `${playheadLeft}px` : '0',
            width: '3px',
            backgroundColor: '#ff4444',
            zIndex: 100,
            cursor: 'ew-resize',
            transform: 'translateX(-50%)'
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div 
            className="playhead-line" 
            style={{ 
              height: '100%', 
              width: '100%', 
              backgroundColor: '#ff4444' 
            }}
          />
          <div 
            className="playhead-handle" 
            style={{ 
              position: 'absolute', 
              top: -6, 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '12px', 
              height: '12px', 
              backgroundColor: '#ff4444', 
              borderRadius: '50%',
              cursor: 'grab'
            }}
          >
            <div className="playhead-dot" />
          </div>
        </div>
      </div>
      
      {/* Нижняя панель со статусом */}
      <div className="editor-footer">
        <div className="status-bar">
          <span>Такт {cursor.measureIndex + 1}/{tabData.measures.length}</span>
          <span>Струна {cursor.stringIndex + 1}/{tabData.tuning.length}</span>
          <span>Позиция {cursor.noteIndex + 1}/{notesPerMeasure}</span>
          <span>Инструмент: {
            selectedTool === 'note' ? 'Нота' :
            selectedTool === 'bend' ? 'Бенд' :
            selectedTool === 'hammer' ? 'Хаммер' :
            selectedTool === 'vibrato' ? 'Вибрато' : 'Слайд'
          }</span>
          <span>Масштаб: {zoom}%</span>
          <span>Вид: {tabLayout === 'horizontal' ? '↔️ Горизонтальный' : '↕️ Вертикальный'}</span>
          <span>Размер: {notesPerMeasure === 4 ? '4/4' : notesPerMeasure === 8 ? '8/8' : '16/16'}</span>
          {pendingFret && <span>Ввод лада: {pendingFret}</span>}
          {isReadOnly && <span>🔒 Только чтение</span>}
          {isPublic && <span>🌍 Опубликовано</span>}
        </div>
      </div>

      {/* Модальное окно экспорта */}
      <ExportModal 
        tabData={tabData} 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </div>
  );
};

export default TabEditor;