// components/tuner/GuitarTuner.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, CheckCircle, AlertCircle, Music, Volume2 } from 'lucide-react';
import './GuitarTuner.css';

/** Частоты нот для 6-струнной гитары (стандартный строй) */
const STANDARD_TUNING = {
  'E2': 82.41,  // 6 струна (ми)
  'A2': 110.00, // 5 струна (ля)
  'D3': 146.83, // 4 струна (ре)
  'G3': 196.00, // 3 струна (соль)
  'B3': 246.94, // 2 струна (си)
  'E4': 329.63  // 1 струна (ми)
};

/** Названия нот для отображения */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TunerProps {
  /** Текущий строй гитары (массив нот) */
  currentTuning?: string[];
  /** Колбэк при изменении строя */
  onTuningDetected?: (detectedTuning: Record<number, { note: string; frequency: number; cents: number }>) => void;
  /** Данные табулатуры для проверки строя */
  tabData?: any;
  /** Колбэк при несоответствии строя */
  onTuningMismatch?: (mismatches: Array<{ string: number; expected: string; detected: string; message: string }>) => void;
}

interface PitchResult {
  frequency: number;
  note: string;
  cents: number;
  octave: number;
}

const GuitarTuner: React.FC<TunerProps> = ({ 
  currentTuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  onTuningDetected,
  tabData,
  onTuningMismatch
}) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchResult | null>(null);
  const [detectedNotes, setDetectedNotes] = useState<Record<number, { note: string; frequency: number; cents: number }>>({});
  const [activeString, setActiveString] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Определение частоты с помощью автокорреляции (алгоритм YIN)
   */
  const autoCorrelate = useCallback((buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs((buffer[i] || 0) - (buffer[i + offset] || 0));
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        lastCorrelation = correlation;
      } else if (correlation < 0.9 && lastCorrelation > 0.9) {
        break;
      }
    }
    
    if (bestCorrelation > 0.5 && bestOffset > 0) {
      const frequency = sampleRate / bestOffset;
      return frequency;
    }
    return -1;
  }, []);

  /**
   * Определение ноты по частоте
   */
  const getNoteFromFrequency = useCallback((frequency: number): PitchResult | null => {
    if (frequency < 50 || frequency > 500) return null;
    
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(halfSteps / 12);
    const noteIndex = ((halfSteps % 12) + 12) % 12;
    
    const nearestFreq = C0 * Math.pow(2, halfSteps / 12);
    const cents = Math.round(1200 * Math.log2(frequency / nearestFreq));
    
    return {
      frequency,
      note: NOTE_NAMES[noteIndex],
      cents,
      octave
    };
  }, []);

  /**
   * Проверка соответствия струны
   */
  const checkStringMatch = useCallback((note: string, octave: number, cents: number): number | null => {
    const targetNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
    const targetOctaves = [2, 2, 3, 3, 3, 4];
    
    for (let i = 0; i < targetNotes.length; i++) {
      if (note === targetNotes[i] && octave === targetOctaves[i] && Math.abs(cents) < 50) {
        return i;
      }
    }
    return null;
  }, []);

  /**
   * Анализ аудиопотока
   */
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListening) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const frequency = autoCorrelate(buffer, audioContextRef.current?.sampleRate || 44100);
    
    if (frequency > 0) {
      const pitch = getNoteFromFrequency(frequency);
      if (pitch) {
        setCurrentPitch(pitch);
        
        const stringIndex = checkStringMatch(pitch.note, pitch.octave, pitch.cents);
        if (stringIndex !== null) {
          setActiveString(stringIndex);
          setDetectedNotes(prev => ({
            ...prev,
            [stringIndex]: { 
              note: `${pitch.note}${pitch.octave}`, 
              frequency: pitch.frequency, 
              cents: pitch.cents 
            }
          }));
          onTuningDetected?.(detectedNotes);
        } else {
          setActiveString(null);
        }
      }
    } else {
      setCurrentPitch(null);
    }

    // Анализ громкости
    if (analyserRef.current) {
      const volumeArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(volumeArray);
      let sum = 0;
      for (let i = 0; i < volumeArray.length; i++) {
        sum += volumeArray[i];
      }
      const avg = sum / volumeArray.length;
      setVolume(avg / 255);
    }

    animationRef.current = requestAnimationFrame(analyzeAudio);
  }, [isListening, autoCorrelate, getNoteFromFrequency, checkStringMatch, onTuningDetected, detectedNotes]);

  /**
   * Запуск прослушивания микрофона
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setIsListening(true);
      setHasPermission(true);
      analyzeAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setHasPermission(false);
      setError('Не удалось получить доступ к микрофону. Пожалуйста, разрешите доступ.');
    }
  }, [analyzeAudio]);

  /**
   * Остановка прослушивания
   */
  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
    setCurrentPitch(null);
    setActiveString(null);
    setVolume(0);
  }, []);

  /**
   * Проверка соответствия табулатуры стандартному строю
   */
  const checkTabTuning = useCallback(() => {
    if (!tabData || !tabData.tuning) return [];
    
    const mismatches: Array<{ string: number; expected: string; detected: string; message: string }> = [];
    const expectedTuning = STANDARD_TUNING;
    const actualTuning = tabData.tuning;
    
    actualTuning.forEach((actualNote: string, index: number) => {
      const stringNumber = actualTuning.length - index;
      const expectedNote = Object.keys(expectedTuning)[stringNumber - 1] || 
                          (stringNumber === 6 ? 'E2' : stringNumber === 5 ? 'A2' : stringNumber === 4 ? 'D3' : stringNumber === 3 ? 'G3' : stringNumber === 2 ? 'B3' : 'E4');
      
      if (actualNote !== expectedNote) {
        mismatches.push({
          string: stringNumber,
          expected: expectedNote,
          detected: actualNote,
          message: `${stringNumber} струна должна быть ${expectedNote}, но в табулатуре указана ${actualNote}`
        });
      }
    });
    
    if (mismatches.length > 0 && onTuningMismatch) {
      onTuningMismatch(mismatches);
    }
    
    return mismatches;
  }, [tabData, onTuningMismatch]);

  /**
   * Получение цвета отклонения для стрелки тюнера
   */
  const getTunerColor = (cents: number): string => {
    const abs = Math.abs(cents);
    if (abs < 5) return '#4caf50';
    if (abs < 15) return '#ff9800';
    return '#f44336';
  };

  /**
   * Получение отклонения для отображения
   */
  const getDeviation = (cents: number): number => {
    return Math.max(-50, Math.min(50, cents));
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const mismatches = checkTabTuning();
  const hasMismatch = mismatches.length > 0;

  return (
    <div className="guitar-tuner">
      <div className="tuner-header">
        <h3><Music size={20} /> Гитарный тюнер</h3>
        {!isListening ? (
          <button 
            className="tuner-btn tuner-btn-primary"
            onClick={startListening}
          >
            <Mic size={18} /> Включить тюнер
          </button>
        ) : (
          <button 
            className="tuner-btn tuner-btn-danger"
            onClick={stopListening}
          >
            <MicOff size={18} /> Выключить
          </button>
        )}
      </div>

      {error && (
        <div className="tuner-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {hasPermission === false && !error && (
        <div className="tuner-error">
          <AlertCircle size={16} /> Нет доступа к микрофону. Разрешите доступ в настройках браузера.
        </div>
      )}

      {isListening && (
        <div className="tuner-content">
          {/* Визуализация громкости */}
          <div className="volume-meter">
            <div 
              className="volume-fill" 
              style={{ width: `${volume * 100}%` }}
            />
            <Volume2 size={14} />
          </div>

          {/* Текущая определяемая нота */}
          {currentPitch && (
            <div className="current-note">
              <div className="note-name">
                {currentPitch.note}{currentPitch.octave}
              </div>
              <div className="note-frequency">
                {currentPitch.frequency.toFixed(1)} Hz
              </div>
              
              {/* Стрелка отклонения */}
              <div className="tuner-needle-container">
                <div className="tuner-scale">
                  <span>-50</span>
                  <span>0</span>
                  <span>+50</span>
                </div>
                <div className="needle-track">
                  <div 
                    className="needle"
                    style={{ 
                      left: `${50 + getDeviation(currentPitch.cents)}%`,
                      backgroundColor: getTunerColor(currentPitch.cents)
                    }}
                  />
                  <div className="center-mark" />
                </div>
                <div className="cents-value" style={{ color: getTunerColor(currentPitch.cents) }}>
                  {currentPitch.cents > 0 ? `+${currentPitch.cents}` : currentPitch.cents} центов
                </div>
              </div>
            </div>
          )}

          {/* Визуализация струн */}
          <div className="strings-visualization">
            <h4>Строй гитары</h4>
            <div className="strings-grid">
              {Object.entries(STANDARD_TUNING).reverse().map(([note, freq], idx) => {
                const stringNumber = 6 - idx;
                const detected = detectedNotes[stringNumber - 1];
                const isActive = activeString === (stringNumber - 1);
                const isTuned = detected && Math.abs(detected.cents) < 5;
                
                return (
                  <div 
                    key={stringNumber}
                    className={`string-item ${isActive ? 'active' : ''} ${isTuned ? 'tuned' : ''}`}
                  >
                    <div className="string-number">{stringNumber}</div>
                    <div className="string-note">{note}</div>
                    {detected && (
                      <div className={`string-detected ${Math.abs(detected.cents) < 10 ? 'good' : ''}`}>
                        {detected.note}
                        <span className="cents-badge" style={{ color: getTunerColor(detected.cents) }}>
                          {detected.cents > 0 ? `+${detected.cents}` : detected.cents}
                        </span>
                      </div>
                    )}
                    <div className="string-visual">
                      <div className="string-line" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Проверка строя табулатуры */}
          {hasMismatch && (
            <div className="tuning-mismatch-warning">
              <AlertCircle size={16} />
              <div>
                <strong>Несоответствие строя!</strong>
                {mismatches.map(m => (
                  <div key={m.string} className="mismatch-item">
                    {m.message}
                  </div>
                ))}
                <small>Рекомендуется настроить табулатуру под стандартный строй для корректного воспроизведения.</small>
              </div>
            </div>
          )}

          {!hasMismatch && tabData && (
            <div className="tuning-match-success">
              <CheckCircle size={16} />
              <span>Строй табулатуры соответствует стандартному EADGBE ✓</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuitarTuner;