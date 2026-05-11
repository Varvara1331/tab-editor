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
import { saveToLibrary, updateInLibrary } from '../../services/libraryService';
import { getCurrentUser } from '../../services/authService';
import './TabEditor.css';
import { 
  Guitar, 
  Save, 
  Rocket,
  Download, 
  Globe, 
  Eye, 
  Plus,
  Minus,
  Grid2X2,
  Grid3X3,
  Loader2
} from 'lucide-react';

// ==================== КОНСТАНТЫ ====================

/** Стандартный строй 6-струнной гитары (EADGBE) */
const DEFAULT_TUNING = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

/** Количество тактов по умолчанию для новой табулатуры */
const DEFAULT_MEASURE_COUNT = 1;

/** Максимальный номер лада (24 лада - стандарт для большинства гитар) */
const MAX_FRET = 24;

// ==================== ИНТЕРФЕЙСЫ ====================

interface TabEditorProps {
  initialTabData?: TabData;
  onTabDataChange?: () => void;
  onTabSaved?: () => void;
  onNewTabRequest?: () => void;
  onStateChange?: (state: any) => void;
  restoredState?: any;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

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

const TabEditor: React.FC<TabEditorProps> = ({ 
  initialTabData, 
  onTabSaved, 
  onNewTabRequest, 
  onStateChange, 
  restoredState 
}) => {
  const currentUser = getCurrentUser();
  const hasRestoredRef = useRef<boolean>(false);
  
  // Refs
  const measuresContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const tabPlayerRef = useRef<any>(null); // Ссылка на компонент плеера
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null); // Для автопрокрутки
  const lastMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // Для хранения последней позиции мыши

  // ==================== СОСТОЯНИЯ ====================

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

  const [tabData, setTabData] = useState<TabData>(() => {
    if (restoredState?.tabData && !hasRestoredRef.current) { 
      hasRestoredRef.current = true; 
      return restoredState.tabData; 
    }
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

  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => {
    if (restoredState?.isReadOnly !== undefined && !hasRestoredRef.current) {
      return restoredState.isReadOnly;
    }
    return tabData.isOwn === false;
  });

  const [isPublic, setIsPublic] = useState<boolean>(() => {
    if (restoredState?.isPublic !== undefined && !hasRestoredRef.current) {
      return restoredState.isPublic;
    }
    return tabData.isPublic || false;
  });

  const [isNewTab, setIsNewTab] = useState<boolean>(() => {
    if (restoredState?.isNewTab !== undefined && !hasRestoredRef.current) {
      return restoredState.isNewTab;
    }
    return !tabData.id;
  });

  const [cursor, setCursor] = useState<CursorPosition>(() => 
    restoredState?.cursor && !hasRestoredRef.current 
      ? restoredState.cursor 
      : { measureIndex: 0, stringIndex: 0, noteIndex: 0 }
  );
  
  const [selectedTool, setSelectedTool] = useState<'note' | 'bend' | 'hammer' | 'vibrato' | 'slide'>(() => 
    restoredState?.selectedTool && !hasRestoredRef.current 
      ? restoredState.selectedTool 
      : 'note'
  );
  
  const [playingPosition, setPlayingPosition] = useState<CursorPosition | null>(null);
  const [playheadLeft, setPlayheadLeft] = useState<number | null>(null);
  const [playheadTop, setPlayheadTop] = useState<number | null>(null);
  const [currentMeasureHeight, setCurrentMeasureHeight] = useState<number>(100);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState<boolean>(false);
  const [pendingFret, setPendingFret] = useState<string>('');
  const [pendingHammerInput, setPendingHammerInput] = useState<string>('');
  const [pendingSlideInput, setPendingSlideInput] = useState<string>('');
  const [zoom, setZoom] = useState<number>(() => restoredState?.zoom || 100);
  const [fileName] = useState<string>(() => restoredState?.fileName || 'Без названия.gp');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [tabLayout, setTabLayout] = useState<'horizontal' | 'vertical'>(() => 
    restoredState?.tabLayout || 'horizontal'
  );

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  const clearFretTimeout = useCallback(() => { 
    if (timeoutRef.current) { 
      clearTimeout(timeoutRef.current); 
      timeoutRef.current = null; 
    } 
  }, []);

  const handleNotesPerMeasureChange = useCallback((newSize: number) => {
    if (isReadOnly) return;
    
    setTabData(prev => {
      const newMeasures = prev.measures.map(measure => {
        const newStrings = measure.strings.map(string => {
          const currentNotes = string.notes;
          let newNotes;
          
          if (newSize > currentNotes.length) {
            newNotes = [
              ...currentNotes,
              ...Array.from({ length: newSize - currentNotes.length }, () => ({ fret: null }))
            ];
          } else if (newSize < currentNotes.length) {
            newNotes = currentNotes.slice(0, newSize);
          } else {
            newNotes = currentNotes;
          }
          
          return { ...string, notes: newNotes };
        });
        const newTimeSignature: [number, number] = 
          newSize === 4 ? [4, 4] : newSize === 8 ? [8, 8] : [16, 16];
        
        return { ...measure, strings: newStrings, timeSignature: newTimeSignature };
      });
      
      return { 
        ...prev, 
        measures: newMeasures,
        notesPerMeasure: newSize
      };
    });
    
    setNotesPerMeasure(newSize);
    
    setCursor(prev => ({
      ...prev,
      noteIndex: Math.min(prev.noteIndex, newSize - 1)
    }));
  }, [isReadOnly]);

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
      
      if (selectedTool === 'bend') {
        noteData.bend = true;
      } else if (selectedTool === 'vibrato') {
        noteData.vibrato = true;
      }
      
      notes[cursor.noteIndex] = { ...notes[cursor.noteIndex], ...noteData };
      string.notes = notes;
      strings[cursor.stringIndex] = string;
      measure.strings = strings;
      newMeasures[cursor.measureIndex] = measure;
      
      return { ...prev, measures: newMeasures };
    });

    setCursor(prev => ({ 
      ...prev, 
      noteIndex: Math.min(prev.noteIndex + 1, notesPerMeasure - 1) 
    }));

    setTimeout(() => { 
      isProcessingRef.current = false; 
    }, 100);
  }, [cursor, selectedTool, isReadOnly, notesPerMeasure]);

  const addHammerAtCursor = useCallback((fromFret: number, toFret: number) => {
    if (isReadOnly || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setTabData(prev => {
      const newMeasures = [...prev.measures];
      const measure = { ...newMeasures[cursor.measureIndex] };
      const strings = [...measure.strings];
      const string = { ...strings[cursor.stringIndex] };
      const notes = [...string.notes];
      
      const noteData: any = { 
        fret: fromFret,
        hammer: {
          fromFret: fromFret,
          toFret: toFret
        }
      };
      
      notes[cursor.noteIndex] = { ...notes[cursor.noteIndex], ...noteData };
      string.notes = notes;
      strings[cursor.stringIndex] = string;
      measure.strings = strings;
      newMeasures[cursor.measureIndex] = measure;
      
      return { ...prev, measures: newMeasures };
    });

    setCursor(prev => ({ 
      ...prev, 
      noteIndex: Math.min(prev.noteIndex + 1, notesPerMeasure - 1) 
    }));

    setTimeout(() => { 
      isProcessingRef.current = false; 
    }, 100);
  }, [cursor, isReadOnly, notesPerMeasure]);

  const addSlideAtCursor = useCallback((fromFret: number, toFret: number) => {
    if (isReadOnly || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    const direction: 'up' | 'down' = toFret > fromFret ? 'up' : 'down';
    
    setTabData(prev => {
      const newMeasures = [...prev.measures];
      const measure = { ...newMeasures[cursor.measureIndex] };
      const strings = [...measure.strings];
      const string = { ...strings[cursor.stringIndex] };
      const notes = [...string.notes];
      
      const noteData: any = { 
        fret: fromFret,
        slide: direction
      };
      
      notes[cursor.noteIndex] = { ...notes[cursor.noteIndex], ...noteData };
      
      if (cursor.noteIndex + 1 < notesPerMeasure) {
        const nextNoteData: any = { fret: toFret };
        notes[cursor.noteIndex + 1] = { ...notes[cursor.noteIndex + 1], ...nextNoteData };
      }
      
      string.notes = notes;
      strings[cursor.stringIndex] = string;
      measure.strings = strings;
      newMeasures[cursor.measureIndex] = measure;
      
      return { ...prev, measures: newMeasures };
    });

    setCursor(prev => ({ 
      ...prev, 
      noteIndex: Math.min(prev.noteIndex + 2, notesPerMeasure - 1) 
    }));

    setTimeout(() => { 
      isProcessingRef.current = false; 
    }, 100);
  }, [cursor, isReadOnly, notesPerMeasure]);

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

  const handleNoteClick = useCallback((measureIndex: number, stringIndex: number, noteIndex: number) => {
    if (isReadOnly) return;
    
    setCursor({ measureIndex, stringIndex, noteIndex });
    setPendingFret('');
    setPendingHammerInput('');
    setPendingSlideInput('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [isReadOnly]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isReadOnly) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      if (isProcessingRef.current) return;
      
      if (selectedTool === 'hammer') {
        setPendingHammerInput(prev => {
          const newInput = prev + e.key;
          const parts = newInput.trim().split(/\s+/);
          
          if (parts.length === 2) {
            const fromFret = parseInt(parts[0], 10);
            const toFret = parseInt(parts[1], 10);
            
            if (fromFret >= 0 && fromFret <= MAX_FRET && toFret >= 0 && toFret <= MAX_FRET) {
              addHammerAtCursor(fromFret, toFret);
            }
            clearFretTimeout();
            return '';
          }
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setPendingHammerInput(current => {
              if (current.trim().length > 0 && !current.includes(' ')) {
                return current + ' ';
              }
              return current;
            });
            clearFretTimeout();
          }, 500);
          
          return newInput;
        });
      } else if (selectedTool === 'slide') {
        setPendingSlideInput(prev => {
          const newInput = prev + e.key;
          const parts = newInput.trim().split(/\s+/);
          
          if (parts.length === 2) {
            const fromFret = parseInt(parts[0], 10);
            const toFret = parseInt(parts[1], 10);
            
            if (fromFret >= 0 && fromFret <= MAX_FRET && toFret >= 0 && toFret <= MAX_FRET) {
              addSlideAtCursor(fromFret, toFret);
            }
            clearFretTimeout();
            return '';
          }
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setPendingSlideInput(current => {
              if (current.trim().length > 0 && !current.includes(' ')) {
                return current + ' ';
              }
              return current;
            });
            clearFretTimeout();
          }, 500);
          
          return newInput;
        });
      } else {
        setPendingFret(prev => {
          const newPending = prev + e.key;
          
          if (newPending.length === 2) {
            const fretValue = parseInt(newPending, 10);
            if (fretValue >= 0 && fretValue <= MAX_FRET) {
              addNoteAtCursor(fretValue);
            }
            clearFretTimeout();
            return '';
          }
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          
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
      }
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (selectedTool === 'hammer') {
        if (pendingHammerInput.trim().length > 0 && !pendingHammerInput.includes(' ')) {
          setPendingHammerInput(prev => prev + ' ');
        }
      } else if (selectedTool === 'slide') {
        if (pendingSlideInput.trim().length > 0 && !pendingSlideInput.includes(' ')) {
          setPendingSlideInput(prev => prev + ' ');
        }
      }
      return;
    }

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
        setPendingHammerInput('');
        setPendingSlideInput('');
        clearFretTimeout();
        break;
      default:
        if (e.key === 'b') setSelectedTool('bend');
        else if (e.key === 'h') setSelectedTool('hammer');
        else if (e.key === 'v') setSelectedTool('vibrato');
        else if (e.key === 's') setSelectedTool('slide');
        break;
    }
  }, [addNoteAtCursor, addHammerAtCursor, addSlideAtCursor, clearFretTimeout, cursor, isReadOnly, handleDeleteNote, notesPerMeasure, selectedTool, pendingHammerInput, pendingSlideInput]);

  // ==================== ЭФФЕКТ ДЛЯ УПРАВЛЕНИЯ ПЛЕЕРОМ ====================
  
  // Обработчик клавиш для управления плеером (пробел и enter)
  useEffect(() => {
    if (isReadOnly) return;

    const handlePlayerKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        if (tabPlayerRef.current) {
          tabPlayerRef.current.toggle();
        }
      }
    };

    window.addEventListener('keydown', handlePlayerKeys);
    return () => window.removeEventListener('keydown', handlePlayerKeys);
  }, [isReadOnly]);

  // ==================== ОБРАБОТЧИКИ ПЕРЕТАСКИВАНИЯ ПОЛОСКИ С АВТОПРОКРУТКОЙ ====================

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    isDraggingRef.current = true;
    
    // Сохраняем позицию мыши
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    
    document.body.style.cursor = tabLayout === 'horizontal' ? 'ew-resize' : 'ns-resize';
    
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const noteCell = element?.closest('.note-cell');
    if (noteCell) {
      const measureIndex = parseInt(noteCell.getAttribute('data-measure') || '-1');
      const noteIndex = parseInt(noteCell.getAttribute('data-note') || '-1');
      
      if (measureIndex >= 0 && noteIndex >= 0) {
        const containerRect = measuresContainerRef.current?.getBoundingClientRect();
        const noteRect = noteCell.getBoundingClientRect();
        const scrollLeft = measuresContainerRef.current?.scrollLeft || 0;
        const scrollTop = measuresContainerRef.current?.scrollTop || 0;
        
        if (containerRect) {
          if (tabLayout === 'horizontal') {
            const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
            setPlayheadLeft(leftPosition);
          } else {
            const measureElement = noteCell.closest('.measure');
            if (measureElement) {
              const measureRect = measureElement.getBoundingClientRect();
              const topPosition = measureRect.top - containerRect.top + scrollTop;
              const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
              setPlayheadTop(topPosition);
              setPlayheadLeft(leftPosition);
              setCurrentMeasureHeight(measureRect.height);
            } else {
              const topPosition = noteRect.top - containerRect.top + scrollTop;
              const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
              setPlayheadTop(topPosition);
              setPlayheadLeft(leftPosition);
            }
          }
          
          const event = new CustomEvent('seekToPosition', {
            detail: { measureIndex, noteIndex }
          });
          window.dispatchEvent(event);
        }
      }
    }
  }, [tabLayout]);

  // Функция для поиска ноты под курсором с учетом скролла
  const findNoteAtPosition = useCallback((clientX: number, clientY: number) => {
    // Сначала проверяем элемент под курсором
    let element = document.elementFromPoint(clientX, clientY);
    let noteCell = element?.closest('.note-cell');
    
    // Если не нашли ноту, возможно курсор за пределами контейнера
    // В этом случае ищем ближайшую ноту по направлению
    if (!noteCell && measuresContainerRef.current) {
      const containerRect = measuresContainerRef.current.getBoundingClientRect();
      const scrollLeft = measuresContainerRef.current.scrollLeft;
      const scrollTop = measuresContainerRef.current.scrollTop;
      
      // Ищем все ноты в контейнере
      const allNotes = measuresContainerRef.current.querySelectorAll('.note-cell');
      let closestNote: Element | null = null;
      let minDistance = Infinity;
      
      allNotes.forEach((note) => {
        const rect = note.getBoundingClientRect();
        // Вычисляем расстояние от курсора до центра ноты
        const distance = Math.sqrt(
          Math.pow(clientX - (rect.left + rect.width / 2), 2) +
          Math.pow(clientY - (rect.top + rect.height / 2), 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestNote = note;
        }
      });
      
      noteCell = closestNote;
    }
    
    return noteCell;
  }, []);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !measuresContainerRef.current) return;
    
    const container = measuresContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Сохраняем позицию мыши для автопрокрутки
    lastMousePositionRef.current = { x: mouseX, y: mouseY };
    
    // Настройки автопрокрутки
    const SCROLL_THRESHOLD = 30; // Порог в пикселях от края
    const SCROLL_SPEED = 12; // Скорость прокрутки
    
    let shouldAutoScroll = false;
    let scrollDeltaX = 0;
    let scrollDeltaY = 0;
    
    if (tabLayout === 'horizontal') {
      // Горизонтальная прокрутка
      if (mouseX < containerRect.left + SCROLL_THRESHOLD && container.scrollLeft > 0) {
        shouldAutoScroll = true;
        scrollDeltaX = -SCROLL_SPEED;
      } else if (mouseX > containerRect.right - SCROLL_THRESHOLD && 
                 container.scrollLeft < container.scrollWidth - container.clientWidth) {
        shouldAutoScroll = true;
        scrollDeltaX = SCROLL_SPEED;
      }
    } else {
      // Вертикальная прокрутка
      if (mouseY < containerRect.top + SCROLL_THRESHOLD && container.scrollTop > 0) {
        shouldAutoScroll = true;
        scrollDeltaY = -SCROLL_SPEED;
      } else if (mouseY > containerRect.bottom - SCROLL_THRESHOLD && 
                 container.scrollTop < container.scrollHeight - container.clientHeight) {
        shouldAutoScroll = true;
        scrollDeltaY = SCROLL_SPEED;
      }
    }
    
    // Останавливаем предыдущий интервал автопрокрутки
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    if (shouldAutoScroll) {
      // Запускаем автопрокрутку
      autoScrollIntervalRef.current = setInterval(() => {
        if (!isDraggingRef.current || !measuresContainerRef.current) {
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
          return;
        }
        
        const currentContainer = measuresContainerRef.current;
        if (tabLayout === 'horizontal') {
          currentContainer.scrollLeft += scrollDeltaX;
        } else {
          currentContainer.scrollTop += scrollDeltaY;
        }
        
        // После прокрутки обновляем позицию на основе сохраненной позиции мыши
        setTimeout(() => {
          if (isDraggingRef.current) {
            const noteCell = findNoteAtPosition(
              lastMousePositionRef.current.x,
              lastMousePositionRef.current.y
            );
            
            if (noteCell) {
              const measureIndex = parseInt(noteCell.getAttribute('data-measure') || '-1');
              const noteIndex = parseInt(noteCell.getAttribute('data-note') || '-1');
              
              if (measureIndex >= 0 && noteIndex >= 0) {
                const currentContainerRect = measuresContainerRef.current?.getBoundingClientRect();
                const noteRect = noteCell.getBoundingClientRect();
                const currentScrollLeft = measuresContainerRef.current?.scrollLeft || 0;
                const currentScrollTop = measuresContainerRef.current?.scrollTop || 0;
                
                if (currentContainerRect) {
                  const leftPosition = noteRect.left - currentContainerRect.left + currentScrollLeft + (noteRect.width / 2);
                  
                  if (tabLayout === 'horizontal') {
                    setPlayheadLeft(leftPosition);
                    setPlayheadTop(null);
                  } else {
                    const measureElement = noteCell.closest('.measure');
                    if (measureElement) {
                      const measureRect = measureElement.getBoundingClientRect();
                      const topPosition = measureRect.top - currentContainerRect.top + currentScrollTop;
                      setPlayheadTop(topPosition);
                      setPlayheadLeft(leftPosition);
                      setCurrentMeasureHeight(measureRect.height);
                    }
                  }
                  
                  const event = new CustomEvent('seekToPosition', {
                    detail: { measureIndex, noteIndex }
                  });
                  window.dispatchEvent(event);
                }
              }
            }
          }
        }, 10);
      }, 16); // ~60fps
    }
    
    // Находим ноту под курсором для обновления позиции
    const noteCell = findNoteAtPosition(mouseX, mouseY);
    
    if (noteCell) {
      const measureIndex = parseInt(noteCell.getAttribute('data-measure') || '-1');
      const noteIndex = parseInt(noteCell.getAttribute('data-note') || '-1');
      
      if (measureIndex >= 0 && noteIndex >= 0) {
        const noteRect = noteCell.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        
        const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
        
        if (tabLayout === 'horizontal') {
          setPlayheadLeft(leftPosition);
          setPlayheadTop(null);
        } else {
          const measureElement = noteCell.closest('.measure');
          if (measureElement) {
            const measureRect = measureElement.getBoundingClientRect();
            const topPosition = measureRect.top - containerRect.top + scrollTop;
            setPlayheadTop(topPosition);
            setPlayheadLeft(leftPosition);
            setCurrentMeasureHeight(measureRect.height);
          } else {
            const topPosition = noteRect.top - containerRect.top + scrollTop;
            setPlayheadTop(topPosition);
            setPlayheadLeft(leftPosition);
          }
        }
        
        const event = new CustomEvent('seekToPosition', {
          detail: { measureIndex, noteIndex }
        });
        window.dispatchEvent(event);
      }
    }
  }, [tabLayout, findNoteAtPosition]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    
    // Очищаем интервал автопрокрутки
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // ==================== ОСТАЛЬНЫЕ ОБРАБОТЧИКИ ====================

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

  const removeMeasure = (index: number) => {
    if (isReadOnly || tabData.measures.length <= 1) return;
    setTabData(prev => ({ ...prev, measures: prev.measures.filter((_, i) => i !== index) }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const handleSaveToLibrary = async () => {
    if (!tabData.isOwn) {
      alert('Нельзя сохранять чужие табулатуры');
      return;
    }
    
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const tabDataWithMeta = {
        ...tabData,
        notesPerMeasure: notesPerMeasure,
      };
      
      const success = await saveToLibrary(tabDataWithMeta);
      if (success) {
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

  const handleDownload = () => setIsExportModalOpen(true);
  
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (!isReadOnly) setTabData(prev => ({ ...prev, title: e.target.value })); 
  };
  
  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (!isReadOnly) setTabData(prev => ({ ...prev, artist: e.target.value })); 
  };
  
  const handleTuningChange = (newTuning: string[]) => { 
    if (!isReadOnly) setTabData(prev => ({ ...prev, tuning: newTuning })); 
  };
  
  const handlePlayingPositionChange = useCallback((position: CursorPosition) => {
    setPlayingPosition(position);
  }, []);

  const handlePlayheadPosition = useCallback((position: { left: number; top: number; measureIndex: number; noteIndex: number; height?: number } | null) => {
    if (position && !isDraggingRef.current) {
      if (tabLayout === 'horizontal') {
        setPlayheadLeft(position.left);
        setPlayheadTop(null);
      } else {
        setPlayheadTop(position.top);
        setPlayheadLeft(position.left);
        if (position.height) {
          setCurrentMeasureHeight(position.height);
        }
      }
    } else if (position === null) {
      setPlayheadLeft(null);
      setPlayheadTop(null);
    }
  }, [tabLayout]);

  // ==================== ЭФФЕКТЫ ====================

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

  useEffect(() => { 
    if (initialTabData) hasRestoredRef.current = false; 
  }, [initialTabData]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      if (timeoutRef.current) clearTimeout(timeoutRef.current); 
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isDraggingPlayhead, handleGlobalMouseMove, handleGlobalMouseUp]);

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
  }, [tabData, isReadOnly, isSaving]);

  useEffect(() => {
    if (tabData.measures && tabData.measures.length > 0) {
      const actualNotesPerMeasure = tabData.notesPerMeasure || tabData.measures[0]?.strings[0]?.notes?.length || 16;
      const targetNotesPerMeasure = tabData.notesPerMeasure || actualNotesPerMeasure;
      
      if (targetNotesPerMeasure !== notesPerMeasure) {
        setNotesPerMeasure(targetNotesPerMeasure);
      }
    }
  }, [tabData.measures, tabData.notesPerMeasure]);

  // ==================== РЕНДЕР ====================
  
  return (
    <div 
  className={`tab-editor ${tabLayout}`}
  data-grid-cols={
    tabLayout === 'vertical' 
      ? (notesPerMeasure === 4 ? 4 : notesPerMeasure === 8 ? 2 : 1)
      : undefined
  }
>
      {isReadOnly && (
        <div className="readonly-banner">
          ⚠️ Режим просмотра. Вы не можете изменять эту табулатуру.
        </div>
      )}
      
      <div className="editor-header">
        <div className="file-info">
          <div className="file-icon"><Guitar size={32} /></div>
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
              {tabData.artist}
              <input 
                type="text" 
                value={tabData.artist || ''} 
                onChange={handleArtistChange} 
                className="artist-input-inline" 
                placeholder=" Исполнитель" 
                disabled={isReadOnly} 
              />
              • {fileName} • {tabData.measures.length} тактов • {tabData.tuning.length} струн 
            </p>
          </div>
        </div>
        <div className="file-actions">
          <button className="btn btn-secondary" title="Новая табулатура" onClick={onNewTabRequest}>
            <Plus size={16} />
          </button>
          {!isReadOnly && tabData.isOwn && (
            <button 
              className={`btn btn-publish ${isPublic ? 'published' : ''}`} 
              onClick={handlePublish} 
              disabled={isSaving}
              title={isPublic ? 'Скрыть публикацию' : 'Опубликовать'}
            >
              {isPublic ? <Globe size={16} /> : <Rocket size={16} />}
            </button>
          )}
          {tabData.isOwn && (
            <button 
              className={`btn btn-save ${!isNewTab && tabData.id ? 'saved' : ''}`} 
              onClick={handleSaveToLibrary} 
              disabled={isSaving}
              title={isSaving ? 'Сохранение...' : 'Сохранить в библиотеку'}
            >
              {isSaving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            </button>
          )}
          <button className="btn btn-secondary" title="Скачать" onClick={handleDownload}>
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Панель инструментов с плеером внутри */}
      <TabControls 
        selectedTool={selectedTool} 
        onToolSelect={setSelectedTool} 
        notesPerMeasure={notesPerMeasure}
        onNotesPerMeasureChange={handleNotesPerMeasureChange}
        isReadOnly={isReadOnly}
        tuning={tabData.tuning}
        onTuningChange={handleTuningChange}
        player={
          <TabPlayer 
            ref={tabPlayerRef}
            tabData={tabData} 
            onPositionChange={handlePlayingPositionChange}
            onPlayheadPosition={handlePlayheadPosition}
            measuresContainerRef={measuresContainerRef}
          />
        }
      />

      {/* Индикатор ввода лада */}
      {selectedTool === 'hammer' && pendingHammerInput && (
        <div className="fret-indicator hammer-input-indicator">
          Хаммер: {pendingHammerInput}
          {!pendingHammerInput.includes(' ') && <span className="hint"> (нажмите пробел для разделения)</span>}
        </div>
      )}
      {selectedTool === 'slide' && pendingSlideInput && (
        <div className="fret-indicator slide-input-indicator">
          Слайд: {pendingSlideInput}
          {!pendingSlideInput.includes(' ') && <span className="hint"> (лад пробел)</span>}
        </div>
      )}
      {selectedTool !== 'hammer' && selectedTool !== 'slide' && pendingFret && !isReadOnly && (
        <div className="fret-indicator">
          Лад: {pendingFret}
        </div>
      )}

      <div className="canvas-toolbar">
          <div className="canvas-toolbar-group">
            <span className="canvas-toolbar-label">Масштаб</span>
            <button className="canvas-toolbar-btn" onClick={handleZoomOut} title="Уменьшить" type="button">
              <Minus size={16} />
            </button>
            <span className="canvas-zoom-value">{zoom}%</span>
            <button className="canvas-toolbar-btn" onClick={handleZoomIn} title="Увеличить" type="button">
              <Plus size={16} />
            </button>
          </div>

          <div className="canvas-toolbar-group">
            <span className="canvas-toolbar-label">Вид</span>
            <div className="canvas-layout-toggle">
              <button 
                className={`canvas-layout-btn ${tabLayout === 'horizontal' ? 'active' : ''}`}
                onClick={() => setTabLayout('horizontal')}
                title="Горизонтальный (в строку)"
                type="button"
              >
                <Grid2X2 size={14} />
              </button>
              <button 
                className={`canvas-layout-btn ${tabLayout === 'vertical' ? 'active' : ''}`}
                onClick={() => setTabLayout('vertical')}
                title="Вертикальный (в столбец)"
                type="button"
              >
                <Grid3X3 size={14} />
              </button>
            </div>
          </div>

          <div className="canvas-toolbar-group">
            <button className="canvas-add-measure-btn" onClick={addMeasure} disabled={isReadOnly} type="button">
              <Plus size={14} /> Добавить такт
            </button>
          </div>
        </div>

      {/* Холст с табулатурой */}
      <div className="tab-canvas" ref={measuresContainerRef}>
        <div 
          className={`measures-container ${tabLayout}`}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: '0 0' }}
        >
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
                  showStringLabel={measureIndex === 0}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Полоска воспроизведения */}
        <div 
          className="tab-playhead" 
          style={{ 
            display: (tabLayout === 'horizontal' ? playheadLeft !== null : playheadTop !== null) && playingPosition ? 'block' : 'none',
            position: 'absolute',
            ...(tabLayout === 'horizontal' ? {
              top: 0,
              bottom: 0,
              left: playheadLeft !== null ? `${playheadLeft}px` : '0',
              width: '3px',
              cursor: 'ew-resize',
            } : {
              left: playheadLeft !== null ? `${playheadLeft}px` : '30px',
              top: playheadTop !== null ? `${playheadTop}px` : '0',
              width: '3px',
              height: `${currentMeasureHeight}px`,
              cursor: 'ns-resize',
            }),
            backgroundColor: '#ff4444',
            zIndex: 100,
            transform: tabLayout === 'horizontal' ? 'translateX(-50%)' : 'translateX(-50%)',
            pointerEvents: 'auto'
          }}
          onMouseDown={handlePlayheadMouseDown}
        >
          <div className="playhead-line" style={{ height: '100%', width: '100%', backgroundColor: '#ff4444' }} />
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
            onMouseDown={handlePlayheadMouseDown}
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
            selectedTool === 'hammer' ? 'Хаммер (5 пробел 7)' :
            selectedTool === 'vibrato' ? 'Вибрато' : 'Слайд (5 пробел 7)'
          }</span>
          {pendingFret && <span>Ввод лада: {pendingFret}</span>}
          {selectedTool === 'hammer' && pendingHammerInput && <span>Ввод хаммера: {pendingHammerInput}</span>}
          {selectedTool === 'slide' && pendingSlideInput && <span>Ввод слайда: {pendingSlideInput}</span>}
          {isReadOnly && <span><Eye size={12} /> Только чтение</span>}
          {isPublic && <span><Globe size={12} /> Опубликовано</span>}
        </div>
      </div>

      <ExportModal 
        tabData={tabData} 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </div>
  );
};

export default TabEditor;