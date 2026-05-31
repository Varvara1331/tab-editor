// src/components/theory/TabViewer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { TabData, CursorPosition } from '../../types/tab';
import { useGuitarPlayerSF2 } from '../../hooks/useGuitarPlayerSF2';

interface TabViewerProps {
  tabData: TabData;
  title: string;
  artist: string;
  onComplete?: () => void;
}

export const TabViewer: React.FC<TabViewerProps> = ({ tabData, title, artist, onComplete }) => {
  const [playingPosition, setPlayingPosition] = useState<CursorPosition | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const measuresContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
  const { 
    play, 
    stop, 
    pause, 
    currentPosition, 
    setTempo, 
    isReady, 
    isLoading, 
    error,
    loadTab,
    initializePlayer
  } = useGuitarPlayerSF2();

  useEffect(() => {
    if (tabData && isMountedRef.current) {
      loadTab(tabData);
      setTempo(100);
    }
    
    return () => {
      if (isMountedRef.current) {
        stop();
      }
    };
  }, [tabData, loadTab, setTempo, stop]);

  useEffect(() => {
    if (currentPosition && isMountedRef.current) {
      setPlayingPosition(currentPosition);
      
      if (measuresContainerRef.current) {
        const noteElements = document.querySelectorAll(
          `.single-string-note[data-measure="${currentPosition.measureIndex}"][data-note="${currentPosition.noteIndex}"]`
        );
        
        if (noteElements.length > 0) {
          const noteElement = noteElements[0] as HTMLElement;
          const containerRect = measuresContainerRef.current.getBoundingClientRect();
          const noteRect = noteElement.getBoundingClientRect();
          const scrollLeft = measuresContainerRef.current.scrollLeft;
          
          const targetScroll = noteRect.left - containerRect.left + scrollLeft - 200;
          if (targetScroll > 0) {
            measuresContainerRef.current.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }, [currentPosition]);

  const handlePlay = useCallback(async () => {
    if (!isSoundEnabled) {
      console.warn('Sound is disabled');
      return;
    }
    
    if (isPlaying) {
      pause();
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    } else {
      await initializePlayer();
      await play();
      if (isMountedRef.current) {
        setIsPlaying(true);
      }
    }
  }, [isSoundEnabled, isPlaying, pause, initializePlayer, play]);

  const handleStop = useCallback(() => {
    stop();
    if (isMountedRef.current) {
      setIsPlaying(false);
    }
  }, [stop]);

  const handleReset = useCallback(() => {
    stop();
    if (isMountedRef.current) {
      setIsPlaying(false);
    }
    if (measuresContainerRef.current) {
      measuresContainerRef.current.scrollLeft = 0;
    }
  }, [stop]);

  const toggleSound = useCallback(() => {
    if (isSoundEnabled && isPlaying) {
      stop();
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    }
    if (isMountedRef.current) {
      setIsSoundEnabled(prev => !prev);
    }
  }, [isSoundEnabled, isPlaying, stop]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [stop]);

  const notesPerMeasure = tabData?.notesPerMeasure || 
    (tabData?.measures[0]?.strings[0]?.notes?.length) || 4;

  const stringIndex = 4; // 5-я струна
  const stringName = tabData?.tuning?.[stringIndex] || 'A2';
  const stringNumber = 5;

  const allNotes: { fret: number | null; measureIndex: number; noteIndex: number }[] = [];
  
  if (tabData && tabData.measures) {
    for (let measureIndex = 0; measureIndex < tabData.measures.length; measureIndex++) {
      const measure = tabData.measures[measureIndex];
      const stringData = measure.strings?.[stringIndex];
      if (stringData && stringData.notes) {
        for (let noteIndex = 0; noteIndex < notesPerMeasure; noteIndex++) {
          const note = stringData.notes[noteIndex];
          allNotes.push({
            fret: note?.fret !== undefined && note.fret !== null ? note.fret : null,
            measureIndex,
            noteIndex
          });
        }
      }
    }
  }

  return (
    <div className="tab-viewer">
      <div className="tab-viewer-header">
        <div className="tab-viewer-info">
          <h4>🎸 {title}</h4>
          <span className="tab-viewer-artist">{artist}</span>
        </div>
        
        <div className="playback-controls">
          <button 
            className="control-btn sound-btn"
            onClick={toggleSound}
            title={isSoundEnabled ? 'Выключить звук' : 'Включить звук'}
            type="button"
            disabled={isLoading}
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          {!isPlaying ? (
            <button 
              className="play-btn" 
              onClick={handlePlay} 
              disabled={!isSoundEnabled || isLoading || !isReady}
              type="button"
              title="Проиграть"
            >
              <Play size={20} />
            </button>
          ) : (
            <button 
              className="play-btn playing" 
              onClick={handlePlay}
              type="button"
              title="Пауза"
            >
              <Pause size={20} />
            </button>
          )}
          
          <button 
            className="control-btn reset-btn" 
            onClick={handleReset}
            type="button"
            title="Сброс"
            disabled={isLoading}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="single-string-tab">
        <div className="string-label-compact">
          <span className="string-name">{stringName}│{stringNumber}</span>
          <span className="string-description">(5-я струна, A)</span>
        </div>
        <div className="string-notes-container" ref={measuresContainerRef}>
          <div className="string-notes-row">
            {allNotes.map((note, idx) => {
              const isCurrentPlaying = currentPosition && 
                currentPosition.measureIndex === note.measureIndex && 
                currentPosition.noteIndex === note.noteIndex;
              
              return (
                <div 
                  key={`note-${note.measureIndex}-${note.noteIndex}`}
                  className={`single-string-note ${isCurrentPlaying ? 'playing' : ''}`}
                  data-measure={note.measureIndex}
                  data-note={note.noteIndex}
                >
                  <div className={`fret-value ${note.fret !== null ? 'has-fret' : 'no-fret'}`}>
                    {note.fret !== null ? note.fret : '─'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tab-viewer-footer">
        <div className="tab-viewer-status">
          {currentPosition && (
            <span>📍 Такт {currentPosition.measureIndex + 1}, нота {currentPosition.noteIndex + 1}</span>
          )}
          {!isSoundEnabled && (
            <span className="sound-off-warning">🔇 Звук отключён</span>
          )}
          {error && (
            <span className="error-message">⚠️ {error}</span>
          )}
          {!isReady && !isLoading && !error && (
            <span className="loading-status">⏳ Инициализация плеера...</span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="tab-viewer-loading">
          <div className="loading-spinner-small"></div>
          <p>Загрузка звуков...</p>
        </div>
      )}
    </div>
  );
};