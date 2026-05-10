/**
 * @fileoverview Компонент плеера табулатур.
 * Обеспечивает MIDI-воспроизведение табулатур с поддержкой эффектов.
 * 
 * @module components/editor/TabPlayer
 */

import React, { useState, ChangeEvent, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { TabData, CursorPosition } from '../../types/tab';
import { useGuitarPlayerSF2 } from '../../hooks/useGuitarPlayerSF2';
import './TabEditor.css';
import { 
  Play, 
  Pause, 
  Square, 
  Sliders,
  Loader2,
  AlertCircle,
  Music
} from 'lucide-react';

interface TabPlayerProps {
  /** Данные табулатуры для воспроизведения */
  tabData: TabData;
  /** Функция обратного вызова при изменении позиции воспроизведения */
  onPositionChange?: (position: CursorPosition) => void;
  /** Функция обратного вызова для позиции полоски воспроизведения */
  onPlayheadPosition?: (position: { left: number; top: number; measureIndex: number; noteIndex: number; height?: number } | null) => void;
  /** Ref контейнера с тактами для позиционирования полоски */
  measuresContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Компонент плеера табулатур.
 * 
 * @component
 */
const TabPlayer = forwardRef<any, TabPlayerProps>(({ 
  tabData, 
  onPositionChange,
  onPlayheadPosition,
  measuresContainerRef 
}, ref) => {
  const [bpm, setBpm] = useState<number>(tabData.measures[0]?.tempo || 120);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);
  const isDraggingRef = useRef(false);
  const lastScrolledPositionRef = useRef<{ measureIndex: number; noteIndex: number } | null>(null);

  const { 
    isPlaying, 
    play, 
    stop, 
    pause, 
    currentPosition, 
    setTempo, 
    isReady,
    isLoading,
    error,
    initializePlayer,
    loadTab,
    seekToPosition
  } = useGuitarPlayerSF2();

  // Отслеживание монтирования компонента
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Инициализация плеера
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!initializationPromiseRef.current) {
        initializationPromiseRef.current = initializePlayer();
      }
      try {
        await initializationPromiseRef.current;
        if (mounted && isMountedRef.current) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize player:', err);
        if (mounted && isMountedRef.current) {
          setIsInitialized(false);
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [initializePlayer]);

  // Загрузка табулатуры - при каждом изменении tabData перезагружаем
  useEffect(() => {
    if (isReady && tabData && isMountedRef.current) {
      loadTab(tabData);
      setBpm(tabData.measures[0]?.tempo || 120);
    }
  }, [isReady, tabData, loadTab]);

  // Установка темпа
  useEffect(() => {
    setTempo(bpm);
  }, [bpm, setTempo]);

  // Отправка позиции при изменении
  useEffect(() => {
    if (currentPosition && onPositionChange && isMountedRef.current) {
      onPositionChange(currentPosition);
    }
  }, [currentPosition, onPositionChange]);

  // Добавляем методы, которые будут доступны через ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (!isReady && isInitialized) {
        // Ждем готовности плеера
        await new Promise(resolve => {
          const checkReady = setInterval(() => {
            if (isReady) {
              clearInterval(checkReady);
              resolve(null);
            }
          }, 50);
        });
      }
      await play();
    },
    pause: () => {
      pause();
    },
    stop: () => {
      stop();
    },
    toggle: async () => {
      if (isPlaying) {
        pause();
      } else {
        if (!isReady && isInitialized) {
          await new Promise(resolve => {
            const checkReady = setInterval(() => {
              if (isReady) {
                clearInterval(checkReady);
                resolve(null);
              }
            }, 50);
          });
        }
        await play();
      }
    },
    getIsPlaying: () => isPlaying,
    seekTo: (measureIndex: number, noteIndex: number) => {
      if (seekToPosition) {
        seekToPosition({
          measureIndex,
          stringIndex: 0,
          noteIndex
        });
      }
    }
  }), [isPlaying, isReady, isInitialized, play, pause, stop, seekToPosition]);

  /**
   * Прокрутка контейнера к текущей позиции воспроизведения
   * @param force - Принудительная прокрутка (игнорирует флаг перетаскивания)
   */
  const scrollToCurrentPosition = useCallback((force: boolean = false) => {
    if (!currentPosition || !measuresContainerRef?.current) return;
    
    // Проверяем, нужно ли прокручивать
    if (!force && isDraggingRef.current) return;
    
    // Проверяем, не была ли уже прокрутка к этой позиции
    const positionKey = `${currentPosition.measureIndex}:${currentPosition.noteIndex}`;
    if (lastScrolledPositionRef.current && 
        lastScrolledPositionRef.current.measureIndex === currentPosition.measureIndex &&
        lastScrolledPositionRef.current.noteIndex === currentPosition.noteIndex &&
        !force) {
      return;
    }
    
    const noteElements = document.querySelectorAll(
      `.note-cell[data-measure="${currentPosition.measureIndex}"][data-note="${currentPosition.noteIndex}"]`
    );
    
    if (noteElements.length > 0 && measuresContainerRef.current) {
      const noteElement = noteElements[0] as HTMLElement;
      const containerRect = measuresContainerRef.current.getBoundingClientRect();
      const scrollTop = measuresContainerRef.current.scrollTop;
      
      // Определяем раскладку
      const measuresContainerDiv = measuresContainerRef.current.querySelector('.measures-container');
      const isVerticalLayout = measuresContainerDiv?.classList.contains('vertical') || false;
      
      if (isVerticalLayout) {
        // Вертикальная прокрутка - прокручиваем к верхнему краю tab-canvas
        const measureElement = noteElement.closest('.measure');
        if (measureElement) {
          const measureRect = measureElement.getBoundingClientRect();
          
          // Целевая позиция прокрутки: позиция такта относительно контейнера + текущий скролл
          // Прокручиваем так, чтобы такт оказался у верхнего края tab-canvas
          const targetScroll = measureRect.top - containerRect.top + scrollTop - 10;
          
          // Всегда прокручиваем, так как нужно, чтобы текущий такт был вверху
          measuresContainerRef.current.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: force ? 'auto' : 'smooth'
          });
        } else {
          // Fallback: прокрутка к ноте
          const noteRect = noteElement.getBoundingClientRect();
          const targetScroll = noteRect.top - containerRect.top + scrollTop - 10;
          
          measuresContainerRef.current.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: force ? 'auto' : 'smooth'
          });
        }
        
        lastScrolledPositionRef.current = {
          measureIndex: currentPosition.measureIndex,
          noteIndex: currentPosition.noteIndex
        };
      } else {
        // Горизонтальная прокрутка - прокручиваем к левому краю такта
        const measureElement = noteElement.closest('.measure');
        if (measureElement) {
          const measureRect = measureElement.getBoundingClientRect();
          const scrollLeft = measuresContainerRef.current.scrollLeft;
          
          // Прокручиваем так, чтобы такт оказался у левого края контейнера
          const targetScroll = measureRect.left - containerRect.left + scrollLeft - 10;
          
          // Проверяем, виден ли такт полностью
          const isFullyVisible = (measureRect.left - containerRect.left) >= 0 && 
                                 (measureRect.right - containerRect.left) <= measuresContainerRef.current.clientWidth;
          
          if (!isFullyVisible || force) {
            measuresContainerRef.current.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: force ? 'auto' : 'smooth'
            });
          }
        } else {
          // Fallback: прокрутка к ноте
          const noteRect = noteElement.getBoundingClientRect();
          const scrollLeft = measuresContainerRef.current.scrollLeft;
          const targetScroll = noteRect.left - containerRect.left + scrollLeft - 10;
          const isFullyVisible = (noteRect.left - containerRect.left) >= 0 && 
                                 (noteRect.right - containerRect.left) <= measuresContainerRef.current.clientWidth;
          
          if (!isFullyVisible || force) {
            measuresContainerRef.current.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: force ? 'auto' : 'smooth'
            });
          }
        }
        
        lastScrolledPositionRef.current = {
          measureIndex: currentPosition.measureIndex,
          noteIndex: currentPosition.noteIndex
        };
      }
    }
  }, [currentPosition, measuresContainerRef]);

  /**
   * Обновление позиции полоски воспроизведения
   */
  const updatePlayheadPosition = useCallback(() => {
    if (!currentPosition || !measuresContainerRef?.current) return;
    
    // Находим все элементы нот с нужным тактом и позицией
    const noteElements = document.querySelectorAll(
      `.note-cell[data-measure="${currentPosition.measureIndex}"][data-note="${currentPosition.noteIndex}"]`
    );
    
    if (noteElements.length > 0 && measuresContainerRef.current) {
      const noteElement = noteElements[0] as HTMLElement;
      const containerRect = measuresContainerRef.current.getBoundingClientRect();
      const noteRect = noteElement.getBoundingClientRect();
      const scrollLeft = measuresContainerRef.current.scrollLeft;
      const scrollTop = measuresContainerRef.current.scrollTop;
      
      // Определяем раскладку по классу measures-container
      const measuresContainerDiv = measuresContainerRef.current.querySelector('.measures-container');
      const isVerticalLayout = measuresContainerDiv?.classList.contains('vertical') || false;
      
      let position;
      if (isVerticalLayout) {
        // Для вертикальной раскладки: находим родительский такт
        const measureElement = noteElement.closest('.measure');
        if (measureElement) {
          const measureRect = measureElement.getBoundingClientRect();
          const topPosition = measureRect.top - containerRect.top + scrollTop;
          const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
          const height = measureRect.height;
          
          position = {
            left: leftPosition,
            top: topPosition,
            height: height,
            measureIndex: currentPosition.measureIndex,
            noteIndex: currentPosition.noteIndex
          };
        } else {
          // Fallback
          const topPosition = noteRect.top - containerRect.top + scrollTop;
          const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
          position = {
            left: leftPosition,
            top: topPosition,
            measureIndex: currentPosition.measureIndex,
            noteIndex: currentPosition.noteIndex
          };
        }
      } else {
        // Для горизонтальной раскладки: позиция по горизонтали
        const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
        const topPosition = noteRect.top - containerRect.top + scrollTop;
        position = {
          left: leftPosition,
          top: topPosition,
          measureIndex: currentPosition.measureIndex,
          noteIndex: currentPosition.noteIndex
        };
      }
      
      if (onPlayheadPosition) {
        onPlayheadPosition(position);
      }
      
      // Авто-скролл: прокручиваем, если позиция не видна
      scrollToCurrentPosition(false);
    }
  }, [currentPosition, measuresContainerRef, onPlayheadPosition, scrollToCurrentPosition]);
  
  // Обновление полоски при изменении позиции
  useEffect(() => {
    updatePlayheadPosition();
  }, [currentPosition, updatePlayheadPosition]);

  // Отслеживание изменения раскладки
  useEffect(() => {
    if (!measuresContainerRef?.current) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // При смене класса обновляем позицию
          setTimeout(() => updatePlayheadPosition(), 50);
        }
      });
    });
    
    const measuresContainer = measuresContainerRef.current.querySelector('.measures-container');
    if (measuresContainer) {
      observer.observe(measuresContainer, { attributes: true });
    }
    
    return () => observer.disconnect();
  }, [measuresContainerRef, updatePlayheadPosition]);

  // Обработка события перетаскивания из редактора
  useEffect(() => {
    const handleSeekToPosition = (e: CustomEvent) => {
      const { measureIndex, noteIndex } = e.detail;
      if (seekToPosition && isMountedRef.current) {
        // Останавливаем воспроизведение при перетаскивании
        if (isPlaying) {
          pause();
        }
        seekToPosition({
          measureIndex,
          stringIndex: 0,
          noteIndex
        });
      }
    };
    
    window.addEventListener('seekToPosition' as any, handleSeekToPosition);
    return () => {
      window.removeEventListener('seekToPosition' as any, handleSeekToPosition);
    };
  }, [seekToPosition, isPlaying, pause]);

  /**
   * Обработчик начала перетаскивания полоски
   * Устанавливает флаг, чтобы отключить автоскролл во время перетаскивания
   */
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  /**
   * Обработчик окончания перетаскивания полоски
   * Сбрасывает флаг и выполняет принудительную прокрутку к текущей позиции
   */
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    // Принудительно прокручиваем к текущей позиции после перетаскивания
    setTimeout(() => {
      scrollToCurrentPosition(true);
    }, 50);
  }, [scrollToCurrentPosition]);

  /**
   * Обработчик кнопки Play/Pause
   */
  const handlePlayClick = async () => {
    if (!isMountedRef.current) return;
    
    if (!isInitialized && !isReady) {
      if (initializationPromiseRef.current) {
        try {
          await initializationPromiseRef.current;
        } catch (err) {
          console.error('Failed to initialize on play click:', err);
          return;
        }
      } else {
        try {
          await initializePlayer();
          if (isMountedRef.current) setIsInitialized(true);
        } catch (err) {
          console.error('Failed to initialize on play click:', err);
          return;
        }
      }
    }
    
    if (!isReady && isInitialized && isMountedRef.current) {
      console.warn('Player not ready after initialization');
      return;
    }
    
    if (isPlaying && isMountedRef.current) {
      pause();
    } else {
      await play();
      // При начале воспроизведения принудительно прокручиваем к текущей позиции
      setTimeout(() => {
        scrollToCurrentPosition(true);
      }, 100);
    }
  };

  /**
   * Обработчик кнопки Stop
   */
  const handleStopClick = () => {
    if (isMountedRef.current) stop();
  };

  /**
   * Обработчик изменения темпа
   */
  const handleBpmChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isMountedRef.current) setBpm(parseInt(e.target.value));
  };

  const canPlay = isReady && isInitialized;

  // Получение отображаемого названия размера такта
  const getMeasureSizeLabel = (): string => {
    const size = tabData.notesPerMeasure || 16;
    switch (size) {
      case 4: return '4/4';
      case 8: return '8/8';
      case 16: return '16/16';
      default: return `${size}/16`;
    }
  };

  return (
    <div className="player-controls-panel">
      <div ref={containerRef} style={{ display: 'none' }} />
      
      <div className="playback-controls">
        <button
          onClick={handlePlayClick}
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          title={isPlaying ? 'Пауза' : 'Играть'}
          disabled={isLoading || !canPlay}
          type="button"
        >
          {isLoading ? (
            <Loader2 size={20} className="spinner" />
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>
        
        <button 
          className="control-btn" 
          title="Остановить"
          onClick={handleStopClick}
          disabled={!canPlay || isLoading}
          type="button"
        >
          <Square size={20} />
        </button>
      </div>

      <div className="tempo-control">
        <label>Темп</label>
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={handleBpmChange}
          disabled={!canPlay}
        />
        <span>{bpm} BPM</span>
      </div>

      {currentPosition && canPlay && (
        <div className="position-indicator">
          Такт {currentPosition.measureIndex + 1}, 
          Позиция {currentPosition.noteIndex + 1}/{getMeasureSizeLabel()}
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
           <Loader2 size={14} className="spinner" /> Загрузка гитарных звуков...
        </div>
      )}

      {error && (
        <div className="error-indicator" style={{ color: 'red' }}>
           <AlertCircle size={14} /> {error}
        </div>
      )}
      
      {!isInitialized && !isLoading && !error && (
        <div className="loading-indicator">
          <Music size={14} /> Инициализация аудио...
        </div>
      )}
    </div>
  );
});

export default TabPlayer;