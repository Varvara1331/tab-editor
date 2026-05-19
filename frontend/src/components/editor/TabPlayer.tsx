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

/**
 * Свойства компонента TabPlayer
 */
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
 * Обеспечивает MIDI-воспроизведение табулатур с использованием SoundFont 2.
 * Поддерживает управление воспроизведением (play/pause/stop), регулировку темпа,
 * отображение текущей позиции и синхронизацию с интерфейсом редактора.
 * 
 * @component
 * @param props - Свойства компонента
 * @param ref - Ref для доступа к методам плеера (play, pause, stop, toggle, seekTo)
 * @returns Отрисованный компонент панели управления плеером
 * 
 * @example
 * ```tsx
 * const playerRef = useRef();
 * 
 * <TabPlayer 
 *   ref={playerRef}
 *   tabData={tabData}
 *   onPositionChange={(pos) => setCurrentPosition(pos)}
 *   onPlayheadPosition={(pos) => setPlayheadPosition(pos)}
 * />
 * 
 * // Вызов методов через ref
 * playerRef.current?.play();
 * playerRef.current?.toggle();
 * playerRef.current?.seekTo(0, 4);
 * ```
 */
const TabPlayer = forwardRef<any, TabPlayerProps>(({ 
  tabData, 
  onPositionChange,
  onPlayheadPosition,
  measuresContainerRef 
}, ref) => {
  /** Текущий темп воспроизведения (ударов в минуту) */
  const [bpm, setBpm] = useState<number>(tabData.measures[0]?.tempo || 120);
  /** Флаг инициализации плеера */
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  useEffect(() => {
    if (isReady && tabData && isMountedRef.current) {
      loadTab(tabData);
      setBpm(tabData.measures[0]?.tempo || 120);
    }
  }, [isReady, tabData, loadTab]);

  useEffect(() => {
    setTempo(bpm);
  }, [bpm, setTempo]);

  useEffect(() => {
    if (currentPosition && onPositionChange && isMountedRef.current) {
      onPositionChange(currentPosition);
    }
  }, [currentPosition, onPositionChange]);

  /**
   * Экспонируемые методы для доступа через ref
   */
  useImperativeHandle(ref, () => ({
    /** Начать воспроизведение */
    play: async () => {
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
    },
    /** Поставить на паузу */
    pause: () => {
      pause();
    },
    /** Остановить воспроизведение и сбросить позицию */
    stop: () => {
      stop();
    },
    /** Переключить состояние (play/pause) */
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
    /** Получить статус воспроизведения */
    getIsPlaying: () => isPlaying,
    /** Перейти к указанной позиции */
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
   * 
   * @param force - Принудительная прокрутка (игнорирует флаг перетаскивания)
   */
  const scrollToCurrentPosition = useCallback((force: boolean = false) => {
    if (!currentPosition || !measuresContainerRef?.current) return;
    
    if (!force && isDraggingRef.current) return;
    
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
      
      const measuresContainerDiv = measuresContainerRef.current.querySelector('.measures-container');
      const isVerticalLayout = measuresContainerDiv?.classList.contains('vertical') || false;
      
      if (isVerticalLayout) {
        const measureElement = noteElement.closest('.measure');
        if (measureElement) {
          const measureRect = measureElement.getBoundingClientRect();
          const targetScroll = measureRect.top - containerRect.top + scrollTop - 10;
          
          measuresContainerRef.current.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: force ? 'auto' : 'smooth'
          });
        } else {
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
        const measureElement = noteElement.closest('.measure');
        if (measureElement) {
          const measureRect = measureElement.getBoundingClientRect();
          const scrollLeft = measuresContainerRef.current.scrollLeft;
          const targetScroll = measureRect.left - containerRect.left + scrollLeft - 10;
          const isFullyVisible = (measureRect.left - containerRect.left) >= 0 && 
                                 (measureRect.right - containerRect.left) <= measuresContainerRef.current.clientWidth;
          
          if (!isFullyVisible || force) {
            measuresContainerRef.current.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: force ? 'auto' : 'smooth'
            });
          }
        } else {
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
   * Обновление позиции полоски воспроизведения на холсте
   */
  const updatePlayheadPosition = useCallback(() => {
    if (!currentPosition || !measuresContainerRef?.current) return;
    
    const noteElements = document.querySelectorAll(
      `.note-cell[data-measure="${currentPosition.measureIndex}"][data-note="${currentPosition.noteIndex}"]`
    );
    
    if (noteElements.length > 0 && measuresContainerRef.current) {
      const noteElement = noteElements[0] as HTMLElement;
      const containerRect = measuresContainerRef.current.getBoundingClientRect();
      const noteRect = noteElement.getBoundingClientRect();
      const scrollLeft = measuresContainerRef.current.scrollLeft;
      const scrollTop = measuresContainerRef.current.scrollTop;
      
      const measuresContainerDiv = measuresContainerRef.current.querySelector('.measures-container');
      const isVerticalLayout = measuresContainerDiv?.classList.contains('vertical') || false;
      
      let position;
      if (isVerticalLayout) {
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
      
      scrollToCurrentPosition(false);
    }
  }, [currentPosition, measuresContainerRef, onPlayheadPosition, scrollToCurrentPosition]);
  
  useEffect(() => {
    updatePlayheadPosition();
  }, [currentPosition, updatePlayheadPosition]);

  useEffect(() => {
    if (!measuresContainerRef?.current) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
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

  useEffect(() => {
    const handleSeekToPosition = (e: CustomEvent) => {
      const { measureIndex, noteIndex } = e.detail;
      if (seekToPosition && isMountedRef.current) {
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
   * Отключает автоскролл во время перетаскивания
   */
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  /**
   * Обработчик окончания перетаскивания полоски
   * Включает автоскролл и выполняет принудительную прокрутку
   */
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    setTimeout(() => {
      scrollToCurrentPosition(true);
    }, 50);
  }, [scrollToCurrentPosition]);

  /**
   * Обработчик нажатия кнопки Play/Pause
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
      setTimeout(() => {
        scrollToCurrentPosition(true);
      }, 100);
    }
  };

  /**
   * Обработчик нажатия кнопки Stop
   */
  const handleStopClick = () => {
    if (isMountedRef.current) stop();
  };

  /**
   * Обработчик изменения темпа воспроизведения
   * 
   * @param e - Событие изменения ползунка
   */
  const handleBpmChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isMountedRef.current) setBpm(parseInt(e.target.value));
  };

  const canPlay = isReady && isInitialized;

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