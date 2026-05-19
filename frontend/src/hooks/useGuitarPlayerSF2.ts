/**
 * @fileoverview Хук для воспроизведения табулатур с использованием SoundFont.
 * Поддерживает MIDI ноты, эффекты (бенд, слайд, вибрато, хаммер, пулл) и управление воспроизведением.
 * 
 * @module hooks/useGuitarPlayerSF2
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import Soundfont from 'soundfont-player';
import { TabData, CursorPosition, Note } from '../types/tab';

/** Маппинг нот в MIDI семитоны */
const NOTE_TO_MIDI: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

/**
 * Парсинг ноты строя в MIDI номер
 * 
 * @param tuningNote - Нота с октавой (например, 'E4')
 * @returns MIDI номер
 * @private
 */
const parseTuningNote = (tuningNote: string): number => {
  const match = tuningNote.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) {
    const noteMatch = tuningNote.match(/^([A-Ga-g][#b]?)/);
    if (noteMatch) {
      const note = noteMatch[1].toUpperCase();
      const noteValue = NOTE_TO_MIDI[note] || 0;
      const octave = (note === 'E' || note === 'A' || note === 'D') ? 2 : 3;
      return (octave + 1) * 12 + noteValue;
    }
    return 40;
  }
  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr);
  const noteValue = NOTE_TO_MIDI[note.toUpperCase()] || 0;
  return (octave + 1) * 12 + noteValue;
};

/**
 * Получение MIDI номера для струны и лада
 * 
 * @param tuningNote - Нота открытой струны
 * @param fret - Номер лада
 * @returns MIDI номер
 * @private
 */
const getMidiFromTuning = (tuningNote: string, fret: number): number => {
  return parseTuningNote(tuningNote) + fret;
};

/**
 * Преобразование MIDI номера в название ноты
 * 
 * @param midiNumber - MIDI номер
 * @returns Название ноты с октавой (например, 'E4')
 * @private
 */
const getNoteNameFromMidi = (midiNumber: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${noteNames[noteIndex]}${octave}`;
};

/**
 * Применение эффекта бенд к ноте (повышение на полутон)
 * 
 * @param noteName - Название ноты
 * @returns Название ноты после бенда
 * @private
 */
const applyBendToNote = (noteName: string): string => {
  const match = noteName.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) return noteName;
  
  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr);
  
  const bendMap: { [key: string]: string } = {
    'C': 'C#', 'C#': 'D', 'Db': 'D',
    'D': 'D#', 'D#': 'E', 'Eb': 'E',
    'E': 'F', 'F': 'F#', 'F#': 'G', 'Gb': 'G',
    'G': 'G#', 'G#': 'A', 'Ab': 'A',
    'A': 'A#', 'A#': 'B', 'Bb': 'B',
    'B': 'C'
  };
  
  const bentNoteName = bendMap[note] || note;
  const newOctave = (note === 'B' || note === 'B#') ? octave + 1 : octave;
  
  return `${bentNoteName}${newOctave}`;
};

/**
 * Применение эффекта слайд (плавный переход между нотами)
 * 
 * @param instrument - Инструмент SoundFont
 * @param fromNote - Начальная нота
 * @param toNote - Конечная нота
 * @param duration - Длительность эффекта в секундах
 * @param time - Время начала
 * @param direction - Направление слайда ('up' или 'down')
 * @private
 */
const applySlide = (
  instrument: any,
  fromNote: string,
  toNote: string,
  duration: number,
  time: number,
  direction: 'up' | 'down' = 'up'
) => {
  const steps = 30;
  const stepDuration = duration / steps;
  
  const fromMidi = getMidiFromNoteName(fromNote);
  const toMidi = getMidiFromNoteName(toNote);
  const midiDiff = toMidi - fromMidi;
  
  const midiSteps: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const midi = fromMidi + (midiDiff * progress);
    midiSteps.push(Math.round(midi));
  }
  
  const uniqueSteps: number[] = [];
  for (let i = 0; i < midiSteps.length; i++) {
    if (i === 0 || midiSteps[i] !== midiSteps[i - 1]) {
      uniqueSteps.push(midiSteps[i]);
    }
  }
  
  for (let i = 0; i < uniqueSteps.length; i++) {
    const stepMidi = uniqueSteps[i];
    const stepNoteName = getNoteNameFromMidi(stepMidi);
    const stepTime = time + (i * stepDuration);
    const progress = i / (uniqueSteps.length - 1);
    const gain = 0.8 * (1 - progress * 0.3);
    
    setTimeout(() => {
      try {
        instrument.play(stepNoteName, stepTime, {
          duration: stepDuration * 1.2,
          gain: gain
        });
      } catch (err) {
        // Игнорируем ошибки
      }
    }, (stepTime - time) * 1000);
  }
};

/**
 * Получение MIDI номера из названия ноты
 * 
 * @param noteName - Название ноты (например, 'E4')
 * @returns MIDI номер
 * @private
 */
const getMidiFromNoteName = (noteName: string): number => {
  const match = noteName.match(/^([A-Ga-g][#b]?)(\d+)$/);
  if (!match) return 64;
  
  const note = match[1].toUpperCase();
  const octave = parseInt(match[2]);
  const semitone = NOTE_TO_MIDI[note] || 0;
  return (octave + 1) * 12 + semitone;
};

/**
 * Применение эффекта вибрато
 * 
 * @param instrument - Инструмент SoundFont
 * @param noteName - Название ноты
 * @param duration - Длительность
 * @param time - Время начала
 * @private
 */
const applyVibrato = (
  instrument: any,
  noteName: string,
  duration: number,
  time: number
) => {
  const vibratoRate = 6;
  const numPulses = Math.floor(duration * vibratoRate);
  
  for (let i = 0; i <= numPulses; i++) {
    const pulseTime = time + (i / vibratoRate);
    if (pulseTime - time < duration) {
      const gain = 0.8 + (i % 2) * 0.2;
      setTimeout(() => {
        try {
          instrument.play(noteName, pulseTime, {
            duration: 1 / vibratoRate,
            gain: gain
          });
        } catch (err) {
          // Игнорируем ошибки
        }
      }, (pulseTime - time) * 1000);
    }
  }
};

/**
 * Событие ноты (одна позиция в табулатуре)
 */
interface NoteEvent {
  /** Названия нот на каждой струне */
  noteNames: string[];
  /** MIDI номера */
  midiNumbers: number[];
  /** Названия следующих нот (для слайда) */
  nextNoteNames?: string[];
  /** Время начала в секундах */
  startTime: number;
  /** Длительность в секундах */
  duration: number;
  /** Позиция в табулатуре */
  position: CursorPosition;
  /** Эффекты для каждой ноты */
  effects: Note[];
  /** Есть ли хотя бы одна нота */
  hasNotes: boolean;
}

/**
 * Возвращаемое значение хука useGuitarPlayerSF2
 */
interface UseGuitarPlayerSF2Return {
  /** Флаг воспроизведения */
  isPlaying: boolean;
  /** Начать воспроизведение */
  play: () => Promise<void>;
  /** Остановить воспроизведение */
  stop: () => void;
  /** Приостановить воспроизведение */
  pause: () => void;
  /** Текущая позиция воспроизведения */
  currentPosition: CursorPosition | null;
  /** Установить темп (BPM) */
  setTempo: (bpm: number) => void;
  /** Готов ли плеер к воспроизведению */
  isReady: boolean;
  /** Идёт ли загрузка */
  isLoading: boolean;
  /** Ошибка инициализации/воспроизведения */
  error: string | null;
  /** Загрузить табулатуру */
  loadTab: (tabData: TabData) => void;
  /** Инициализировать плеер */
  initializePlayer: () => Promise<void>;
  /** Перейти к позиции */
  seekToPosition?: (position: CursorPosition | number) => void;
}

/**
 * Хук для воспроизведения табулатур с использованием SoundFont.
 * Поддерживает MIDI ноты, различные эффекты (бенд, слайд, вибрато, хаммер, пулл)
 * и управление воспроизведением (play/pause/stop/seek).
 * Использует библиотеки Tone.js и soundfont-player для качественного звучания гитары.
 * 
 * @returns Объект с состоянием плеера и методами управления
 * 
 * @example
 * ```tsx
 * const Player = () => {
 *   const { 
 *     isPlaying, play, pause, stop, 
 *     setTempo, isReady, error, loadTab 
 *   } = useGuitarPlayerSF2();
 * 
 *   useEffect(() => {
 *     if (tabData) loadTab(tabData);
 *   }, [tabData]);
 * 
 *   return (
 *     <div>
 *       <button onClick={play} disabled={!isReady}>Play</button>
 *       <button onClick={pause}>Pause</button>
 *       <button onClick={stop}>Stop</button>
 *       <input type="range" onChange={(e) => setTempo(Number(e.target.value))} />
 *       {error && <div className="error">{error}</div>}
 *     </div>
 *   );
 * };
 * ```
 */
export const useGuitarPlayerSF2 = (): UseGuitarPlayerSF2Return => {
  /** Флаг воспроизведения */
  const [isPlaying, setIsPlaying] = useState(false);
  /** Текущая позиция воспроизведения */
  const [currentPosition, setCurrentPosition] = useState<CursorPosition | null>(null);
  /** Готов ли плеер к воспроизведению */
  const [isReady, setIsReady] = useState(false);
  /** Флаг загрузки инструмента */
  const [isLoading, setIsLoading] = useState(false);
  /** Текст ошибки */
  const [error, setError] = useState<string | null>(null);

  const instrumentRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTabRef = useRef<TabData | null>(null);
  const currentTuningRef = useRef<string[]>(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
  const scheduledNotesRef = useRef<NodeJS.Timeout[]>([]);
  const tempoRef = useRef<number>(120);
  const isPausedRef = useRef(false);
  const isClosedRef = useRef<boolean>(false);

  const MAX_VOLUME = 1.0;

  /**
   * Получение названия ноты для струны и лада
   * 
   * @param stringIndex - Индекс струны
   * @param fret - Номер лада
   * @returns Название ноты
   */
  const getNoteName = useCallback((stringIndex: number, fret: number): string => {
    const tuningNote = currentTuningRef.current[stringIndex];
    const midiNumber = getMidiFromTuning(tuningNote, fret);
    return getNoteNameFromMidi(midiNumber);
  }, []);

  /**
   * Получение MIDI номера для струны и лада
   * 
   * @param stringIndex - Индекс струны
   * @param fret - Номер лада
   * @returns MIDI номер
   */
  const getMidiNumber = useCallback((stringIndex: number, fret: number): number => {
    const tuningNote = currentTuningRef.current[stringIndex];
    return getMidiFromTuning(tuningNote, fret);
  }, []);

  /** Очистка всех запланированных таймеров */
  const clearScheduledNotes = useCallback(() => {
    scheduledNotesRef.current.forEach(timeout => clearTimeout(timeout));
    scheduledNotesRef.current = [];
  }, []);

  /**
   * Извлечение нот из табулатуры в виде событий
   * 
   * @param tabData - Данные табулатуры
   * @returns Массив событий нот
   */
  const extractNotesFromTab = useCallback((tabData: TabData): NoteEvent[] => {
    const events: NoteEvent[] = [];
    let currentTime = 0;
    if (tabData.tuning?.length) currentTuningRef.current = tabData.tuning;

    for (let measureIndex = 0; measureIndex < tabData.measures.length; measureIndex++) {
      const measure = tabData.measures[measureIndex];
      const measureTempo = measure.tempo || tempoRef.current;
      
      const quarterNoteDuration = 60000 / measureTempo;
      const measureDuration = quarterNoteDuration * 4;
      const notesInMeasure = tabData.notesPerMeasure || 
                            measure.strings[0]?.notes.length || 
                            16;
      const noteDuration = measureDuration / notesInMeasure;

      for (let noteIndex = 0; noteIndex < notesInMeasure; noteIndex++) {
        const noteNamesAtTime: string[] = [];
        const midiNumbersAtTime: number[] = [];
        const effectsAtTime: Note[] = [];
        const nextNoteNamesAtTime: string[] = [];

        for (let stringIndex = 0; stringIndex < measure.strings.length; stringIndex++) {
          const tabString = measure.strings[stringIndex];
          const note = tabString.notes[noteIndex];
          if (note?.fret !== null && note?.fret !== undefined && note.fret >= 0) {
            noteNamesAtTime.push(getNoteName(stringIndex, note.fret));
            midiNumbersAtTime.push(getMidiNumber(stringIndex, note.fret));
            effectsAtTime.push(note);
            
            const nextNote = tabString.notes[noteIndex + 1];
            if (note.slide && nextNote?.fret !== null && nextNote?.fret !== undefined) {
              nextNoteNamesAtTime.push(getNoteName(stringIndex, nextNote.fret));
            } else {
              nextNoteNamesAtTime.push('');
            }
          } else {
            nextNoteNamesAtTime.push('');
          }
        }

        events.push({
          noteNames: noteNamesAtTime,
          midiNumbers: midiNumbersAtTime,
          nextNoteNames: nextNoteNamesAtTime,
          startTime: currentTime / 1000,
          duration: noteDuration / 1000,
          position: { measureIndex, stringIndex: 0, noteIndex },
          effects: effectsAtTime,
          hasNotes: noteNamesAtTime.length > 0,
        });
        currentTime += noteDuration;
      }
    }
    return events;
  }, [getNoteName, getMidiNumber]);

  /**
   * Воспроизведение одной ноты с учётом эффектов
   * 
   * @param noteName - Название ноты
   * @param duration - Длительность
   * @param effect - Эффекты ноты
   * @param time - Время начала
   * @param nextNoteName - Следующая нота (для слайда)
   */
  const playNoteWithEffects = useCallback((
    noteName: string,
    duration: number,
    effect?: Note,
    time?: number,
    nextNoteName?: string
  ) => {
    if (!instrumentRef.current || isClosedRef.current) return;
    
    const playTime = time ?? audioContextRef.current?.currentTime ?? Tone.now();
    let finalNoteName = noteName;
    let finalDuration = duration;
    
    if (effect) {
      if (effect.bend === true) {
        finalNoteName = applyBendToNote(noteName);
      }
      
      if (effect.hammer === true || effect.pull === true) {
        finalDuration = duration * 0.85;
      }
      
      if (effect.slide && nextNoteName) {
        const direction = effect.slide === 'up' ? 'up' : 
                         effect.slide === 'down' ? 'down' : 'up';
        applySlide(instrumentRef.current, noteName, nextNoteName, duration, playTime, direction);
        return;
      }
    }
    
    try {
      instrumentRef.current.play(finalNoteName, playTime, { 
        duration: finalDuration, 
        gain: MAX_VOLUME 
      });
      
      if (effect?.vibrato === true) {
        applyVibrato(instrumentRef.current, finalNoteName, finalDuration, playTime);
      }
    } catch (err) {
      console.warn(`Failed to play note ${finalNoteName}:`, err);
    }
  }, []);

  /**
   * Воспроизведение аккорда (нескольких нот одновременно)
   * 
   * @param noteNames - Массив названий нот
   * @param duration - Длительность
   * @param effects - Массив эффектов для каждой ноты
   * @param time - Время начала
   * @param nextNoteNames - Массив следующих нот (для слайда)
   */
  const playChordWithEffects = useCallback((
    noteNames: string[],
    duration: number,
    effects: Note[],
    time?: number,
    nextNoteNames?: string[]
  ) => {
    if (!instrumentRef.current || isClosedRef.current) return;
    
    noteNames.forEach((noteName, index) => {
      const effect = effects[index];
      const nextNoteName = nextNoteNames?.[index];
      playNoteWithEffects(noteName, duration, effect, time, nextNoteName);
    });
  }, [playNoteWithEffects]);

  /** Инициализация плеера и загрузка звукового инструмента */
  const initializePlayer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      isClosedRef.current = false;
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          await audioContextRef.current.close();
        } catch (err) {
          console.warn('Error closing old AudioContext:', err);
        }
      }
      
      audioContextRef.current = null;
      instrumentRef.current = null;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const instrument = await Soundfont.instrument(audioContextRef.current, 'acoustic_guitar_steel', {
        gain: MAX_VOLUME,
        destination: audioContextRef.current.destination
      });
      
      instrumentRef.current = instrument;
      setIsReady(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка инициализации: ${errorMsg}`);
      console.error('Initialization error:', err);
      isClosedRef.current = true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Начать воспроизведение текущей загруженной табулатуры */
  const play = useCallback(async () => {
    if (isClosedRef.current) {
      await initializePlayer();
    }
    
    if (!audioContextRef.current || !instrumentRef.current) {
      setError('Плеер не инициализирован');
      return;
    }
    
    if (!currentTabRef.current) {
      setError('Нет загруженной табулатуры');
      return;
    }
    
    if (audioContextRef.current.state === 'closed') {
      await initializePlayer();
      if (!audioContextRef.current) return;
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (!isReady) { 
      setError('Инструмент не загружен'); 
      return; 
    }

    const allEvents = extractNotesFromTab(currentTabRef.current);
    if (allEvents.length === 0) { 
      setError('Нет нот для воспроизведения'); 
      return; 
    }

    clearScheduledNotes();
    let startOffset = 0, startIndex = 0;
    
    if (isPausedRef.current && currentPosition) {
      const foundIndex = allEvents.findIndex(event =>
        event.position.measureIndex === currentPosition?.measureIndex &&
        event.position.noteIndex === currentPosition?.noteIndex
      );
      if (foundIndex !== -1) { 
        startIndex = foundIndex; 
        startOffset = allEvents[foundIndex].startTime; 
      }
    }

    for (let i = startIndex; i < allEvents.length; i++) {
      const event = allEvents[i];
      const timeout = setTimeout(() => {
        if (isClosedRef.current) return;
        
        if (event.hasNotes && event.noteNames.length > 0) {
          playChordWithEffects(
            event.noteNames, 
            event.duration, 
            event.effects, 
            audioContextRef.current?.currentTime,
            event.nextNoteNames
          );
        }
        
        setCurrentPosition(event.position);
      }, (event.startTime - startOffset) * 1000);
      scheduledNotesRef.current.push(timeout);
    }

    const totalDuration = (allEvents[allEvents.length - 1].startTime - startOffset) + 
                          allEvents[allEvents.length - 1].duration;
    scheduledNotesRef.current.push(setTimeout(() => stop(), totalDuration * 1000));
    
    setIsPlaying(true);
    isPausedRef.current = false;
  }, [initializePlayer, isReady, extractNotesFromTab, playChordWithEffects, clearScheduledNotes, currentPosition]);

  /** Остановка воспроизведения и сброс позиции */
  const stop = useCallback(() => { 
    clearScheduledNotes(); 
    setIsPlaying(false); 
    setCurrentPosition(null); 
    isPausedRef.current = false; 
  }, [clearScheduledNotes]);

  /** Приостановка воспроизведения (сохраняет позицию) */
  const pause = useCallback(() => { 
    if (isPlaying) { 
      clearScheduledNotes(); 
      setIsPlaying(false); 
      isPausedRef.current = true; 
    } 
  }, [isPlaying, clearScheduledNotes]);

  /**
   * Установка темпа воспроизведения
   * 
   * @param bpm - Темп в ударах в минуту
   */
  const setTempo = useCallback((bpm: number) => { 
    tempoRef.current = bpm; 
  }, []);

  /**
   * Загрузка табулатуры в плеер
   * 
   * @param tabData - Данные табулатуры
   */
  const loadTab = useCallback((tabData: TabData) => {
    if (tabData.tuning?.length) currentTuningRef.current = tabData.tuning;
    currentTabRef.current = tabData;
    stop();
    setCurrentPosition(null);
    isPausedRef.current = false;
  }, [stop]);

  /**
   * Переход к указанной позиции в табулатуре
   * 
   * @param position - Позиция курсора или процент (0-100)
   */
  const seekToPosition = useCallback((position: CursorPosition | number) => {
    if (!currentTabRef.current) return;
    if (isPlaying) pause();
    
    let targetPosition: CursorPosition | undefined;
    
    if (typeof position === 'number') {
      const totalNotes = currentTabRef.current.measures.reduce((total, measure) => {
        const maxNotes = Math.max(...measure.strings.map(s => s.notes.length), 0);
        return total + maxNotes;
      }, 0);
      
      const targetNoteIndex = Math.floor((position / 100) * totalNotes);
      let accumulatedNotes = 0;
      
      for (let measureIndex = 0; measureIndex < currentTabRef.current.measures.length; measureIndex++) {
        const maxNotes = Math.max(...currentTabRef.current.measures[measureIndex].strings.map(s => s.notes.length), 0);
        if (targetNoteIndex < accumulatedNotes + maxNotes) {
          const noteIndex = targetNoteIndex - accumulatedNotes;
          targetPosition = { 
            measureIndex, 
            stringIndex: 0, 
            noteIndex: Math.min(noteIndex, maxNotes - 1) 
          };
          break;
        }
        accumulatedNotes += maxNotes;
      }
    } else {
      targetPosition = position;
    }
    
    if (targetPosition) { 
      setCurrentPosition(targetPosition); 
      isPausedRef.current = true; 
    }
  }, [isPlaying, pause]);

  useEffect(() => {
    return () => {
      isClosedRef.current = true;
      clearScheduledNotes();
      if (instrumentRef.current) {
        instrumentRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.warn);
      }
      audioContextRef.current = null;
    };
  }, [clearScheduledNotes]);

  return {
    isPlaying,
    play,
    stop,
    pause,
    currentPosition,
    setTempo,
    isReady,
    isLoading,
    error,
    loadTab,
    initializePlayer,
    seekToPosition
  };
};

export default useGuitarPlayerSF2;