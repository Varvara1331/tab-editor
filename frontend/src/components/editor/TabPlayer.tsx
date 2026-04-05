/**
 * @fileoverview Компонент плеера табулатур.
 * Обеспечивает MIDI-воспроизведение табулатур с поддержкой эффектов.
 * 
 * @module components/editor/TabPlayer
 */

import React, { useState, ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { TabData, CursorPosition } from '../../types/tab';
import { useGuitarPlayerSF2 } from '../../hooks/useGuitarPlayerSF2';

interface TabPlayerProps {
  /** Данные табулатуры для воспроизведения */
  tabData: TabData;
  /** Функция обратного вызова при изменении позиции воспроизведения */
  onPositionChange?: (position: CursorPosition) => void;
  /** Функция обратного вызова для позиции полоски воспроизведения */
  onPlayheadPosition?: (position: { left: number; measureIndex: number; noteIndex: number } | null) => void;
  /** Ref контейнера с тактами для позиционирования полоски */
  measuresContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Компонент плеера табулатур.
 * 
 * @component
 * @example
 * ```typescript
 * <TabPlayer
 *   tabData={tabData}
 *   onPositionChange={(pos) => setCurrentPosition(pos)}
 * />
 * ```
 */
const TabPlayer: React.FC<TabPlayerProps> = ({ 
  tabData, 
  onPositionChange,
  onPlayheadPosition,
  measuresContainerRef 
}) => {
  const [bpm, setBpm] = useState<number>(tabData.measures[0]?.tempo || 120);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);
  const isDraggingRef = useRef(false);

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

  /**
   * Обновление позиции полоски воспроизведения
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
      
      const leftPosition = noteRect.left - containerRect.left + scrollLeft + (noteRect.width / 2);
      
      if (onPlayheadPosition) {
        onPlayheadPosition({
          left: leftPosition,
          measureIndex: currentPosition.measureIndex,
          noteIndex: currentPosition.noteIndex
        });
      }
      
      // Авто-скролл только если играет и не перетаскивается
      if (isPlaying && !isDraggingRef) {
        const containerWidth = measuresContainerRef.current.clientWidth;
        const targetScroll = leftPosition - containerWidth / 2;
        if (targetScroll > 0) {
          measuresContainerRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentPosition, measuresContainerRef, onPlayheadPosition, isPlaying]);

  // Обновление полоски при изменении позиции
  useEffect(() => {
    updatePlayheadPosition();
  }, [currentPosition, updatePlayheadPosition]);

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
          {isLoading ? '⏳' : (isPlaying ? '⏸' : '▶')}
        </button>
        
        <button 
          className="control-btn" 
          title="Остановить"
          onClick={handleStopClick}
          disabled={!canPlay || isLoading}
          type="button"
        >
          ⏹
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
          ⏳ Загрузка гитарных звуков...
        </div>
      )}

      {error && (
        <div className="error-indicator" style={{ color: 'red' }}>
          ❌ {error}
        </div>
      )}
      
      {!isInitialized && !isLoading && !error && (
        <div className="loading-indicator">
          🎸 Инициализация аудио...
        </div>
      )}
    </div>
  );
};

export default TabPlayer;