// src/components/theory/LeftHandExercise.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import Soundfont from 'soundfont-player';

interface LeftHandExerciseProps {
  onComplete?: () => void;
}

export const LeftHandExercise: React.FC<LeftHandExerciseProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentString, setCurrentString] = useState(0);
  const [currentFinger, setCurrentFinger] = useState(0);
  const [exercisePhase, setExercisePhase] = useState<'ascending' | 'descending'>('ascending');
  const [completed, setCompleted] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const instrumentRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const stringNotes = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  const stringNames = ['1-я струна (тонкая)', '2-я струна', '3-я струна', '4-я струна', '5-я струна', '6-я струна (толстая)'];
  
  const fretByFinger: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };

  const initializeInstrument = useCallback(async () => {
    if (instrumentRef.current) return;
    
    if (!isMountedRef.current) return;
    setIsLoading(true);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const instrument = await Soundfont.instrument(audioContext, 'acoustic_guitar_steel', {
        gain: 0.5,
        destination: audioContext.destination
      });
      
      instrumentRef.current = instrument;
    } catch (error) {
      console.error('Failed to load instrument:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const getMidiFromNote = useCallback((noteName: string): number => {
    const noteMap: Record<string, number> = {
      'E2': 40, 'F2': 41, 'F#2': 42, 'G2': 43, 'G#2': 44, 'A2': 45, 'A#2': 46, 'B2': 47,
      'C3': 48, 'C#3': 49, 'D3': 50, 'D#3': 51, 'E3': 52, 'F3': 53, 'F#3': 54, 'G3': 55,
      'G#3': 56, 'A3': 57, 'A#3': 58, 'B3': 59, 'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63,
      'E4': 64, 'F4': 65, 'F#4': 66, 'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71
    };
    return noteMap[noteName] || 64;
  }, []);

  const getNoteNameFromMidi = useCallback((midi: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return `${notes[noteIndex]}${octave}`;
  }, []);

  const playNote = useCallback(async (stringIndex: number, fret: number) => {
    if (!isSoundEnabled) return;
    
    await initializeInstrument();
    
    if (instrumentRef.current && audioContextRef.current && isMountedRef.current) {
      const noteName = stringNotes[stringIndex];
      const midiNumber = getMidiFromNote(noteName) + fret;
      const finalNote = getNoteNameFromMidi(midiNumber);
      
      try {
        instrumentRef.current.play(finalNote, audioContextRef.current.currentTime, {
          duration: 0.8,
          gain: 0.4
        });
      } catch (err) {
        console.warn('Failed to play note:', err);
      }
    }
  }, [isSoundEnabled, initializeInstrument, getMidiFromNote, getNoteNameFromMidi]);

  const playExerciseNote = useCallback(async () => {
    const fret = fretByFinger[currentFinger + 1];
    await playNote(currentString, fret);
  }, [currentString, currentFinger, playNote]);

  const nextStep = useCallback(() => {
    if (exercisePhase === 'ascending') {
      if (currentFinger < 3) {
        setCurrentFinger(prev => prev + 1);
      } else {
        setExercisePhase('descending');
        setCurrentFinger(2);
      }
    } else {
      if (currentFinger > 0) {
        setCurrentFinger(prev => prev - 1);
      } else {
        if (currentString < 5) {
          setCurrentString(prev => prev + 1);
          setCurrentFinger(0);
          setExercisePhase('ascending');
        } else {
          setCompleted(true);
          setIsPlaying(false);
          if (onComplete && isMountedRef.current) onComplete();
        }
      }
    }
  }, [exercisePhase, currentFinger, currentString, onComplete]);

  useEffect(() => {
    if (isPlaying && !completed && isMountedRef.current) {
      const playAndAdvance = async () => {
        await playExerciseNote();
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            nextStep();
          }
        }, 600);
      };
      
      playAndAdvance();
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, currentString, currentFinger, exercisePhase, completed, playExerciseNote, nextStep]);

  const startExercise = useCallback(async () => {
    await initializeInstrument();
    if (isMountedRef.current) {
      setCurrentString(0);
      setCurrentFinger(0);
      setExercisePhase('ascending');
      setCompleted(false);
      setIsPlaying(true);
    }
  }, [initializeInstrument]);

  const stopExercise = useCallback(() => {
    if (isMountedRef.current) {
      setIsPlaying(false);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetExercise = useCallback(() => {
    stopExercise();
    if (isMountedRef.current) {
      setCurrentString(0);
      setCurrentFinger(0);
      setExercisePhase('ascending');
      setCompleted(false);
    }
  }, [stopExercise]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (instrumentRef.current) {
        instrumentRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.warn);
      }
      audioContextRef.current = null;
    };
  }, []);

  const getPositionDescription = () => {
    const stringName = stringNames[currentString];
    const fingerNames = ['', 'указательный', 'средний', 'безымянный', 'мизинец'];
    const fretNumber = fretByFinger[currentFinger + 1];
    
    if (exercisePhase === 'ascending') {
      return `Зажмите ${fingerNames[currentFinger + 1]} (${currentFinger + 1}) пальцем ${fretNumber}-й лад на ${stringName}`;
    } else {
      return `Отпустите ${fingerNames[currentFinger + 1]} (${currentFinger + 1}) палец с ${fretNumber}-го лада на ${stringName}`;
    }
  };

  return (
    <div className="left-hand-exercise">
      <div className="exercise-header">
        <h4>Интерактивное упражнение для левой руки</h4>
        
        <div className="playback-controls">
          <button 
            className="control-btn sound-btn"
            onClick={toggleSound}
            title={isSoundEnabled ? 'Выключить звук' : 'Включить звук'}
            type="button"
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          {!isPlaying && !completed && (
            <button 
              className="play-btn" 
              onClick={startExercise} 
              disabled={isLoading}
              type="button"
              title="Начать упражнение"
            >
              <Play size={20} />
            </button>
          )}
          
          {isPlaying && (
            <button 
              className="play-btn playing" 
              onClick={stopExercise}
              type="button"
              title="Пауза"
            >
              <Pause size={20} />
            </button>
          )}
          
          <button 
            className="control-btn" 
            onClick={resetExercise}
            type="button"
            title="Сброс"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="exercise-visual">
        <div className="guitar-fretboard-simple">
          {[0, 1, 2, 3, 4, 5].map(stringIndex => {
            const stringNumber = stringIndex + 1;
            const isActiveString = currentString === stringIndex;
            return (
              <div key={stringNumber} className={`fretboard-string ${isActiveString ? 'active-string' : ''}`}>
                <span className="string-label-simple">{stringNumber}─</span>
                {[1, 2, 3, 4].map(fret => {
                  const isActive = isActiveString && currentFinger + 1 === fret;
                  return (
                    <div key={fret} className={`fret-position ${isActive ? 'active-fret' : ''}`}>
                      {isActive && (
                        <div className="finger-circle">
                          {currentFinger + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="exercise-instruction">
        <div className="current-step">
          <span className="step-text">{getPositionDescription()}</span>
        </div>
        <div className="progress-info">
          <span>Струна: {currentString + 1}/6</span>
          <span>Палец: {currentFinger + 1}/4</span>
          <span>Фаза: {exercisePhase === 'ascending' ? 'Постановка ↑' : 'Снятие ↓'}</span>
        </div>
      </div>

      {completed && (
        <div className="exercise-complete">
          <p>🎉 Вы выполнили упражнение на всех струнах! 🎉</p>
          <button className="exercise-btn restart-btn" onClick={resetExercise}>
            <RotateCcw size={16} /> Выполнить снова
          </button>
        </div>
      )}

      {isLoading && (
        <div className="exercise-loading">
          <div className="loading-spinner-small"></div>
          <p>Загрузка звуков...</p>
        </div>
      )}
    </div>
  );
};