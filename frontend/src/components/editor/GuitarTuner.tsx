// src/components/tuner/GuitarTuner.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Music, Activity } from 'lucide-react';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import './GuitarTuner.css';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteFromFrequency = (freq: number): { note: string; cents: number } => {
  if (freq <= 0) return { note: '-', cents: 0 };
  
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const halfSteps = Math.round(12 * Math.log2(freq / C0));
  const noteIndex = ((halfSteps % 12) + 12) % 12;
  const detectedFreq = C0 * Math.pow(2, halfSteps / 12);
  const centsDiff = Math.round(1200 * Math.log2(freq / detectedFreq));
  
  return {
    note: NOTES[noteIndex],
    cents: centsDiff
  };
};

const GuitarTuner: React.FC = () => {
  const { isListening, error, pitch, start, stop } = usePitchDetection();
  
  // Сглаженные значения
  const [smoothFrequency, setSmoothFrequency] = useState<number | null>(null);
  const [smoothCents, setSmoothCents] = useState<number>(0);
  const [displayNote, setDisplayNote] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Refs для плавной интерполяции
  const targetFreqRef = useRef<number | null>(null);
  const currentFreqRef = useRef<number | null>(null);
  const targetCentsRef = useRef<number>(0);
  const currentCentsRef = useRef<number>(0);
  const targetNoteRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Константы для плавности (чем меньше число, тем плавнее)
  const SMOOTHING_FACTOR = 0.03; // Очень сильное сглаживание
  const UPDATE_THRESHOLD = 0.5; // Минимальное изменение для обновления UI

  // Плавная анимация
  useEffect(() => {
    if (!isListening) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Плавно затухаем
      const fadeOut = () => {
        if (currentFreqRef.current !== null) {
          currentFreqRef.current = currentFreqRef.current * 0.95;
          currentCentsRef.current = currentCentsRef.current * 0.95;
          
          if (Math.abs(currentFreqRef.current) < 1) {
            currentFreqRef.current = null;
            currentCentsRef.current = 0;
            setSmoothFrequency(null);
            setSmoothCents(0);
            setDisplayNote(null);
            setIsActive(false);
          } else {
            setSmoothFrequency(Math.round(currentFreqRef.current));
            setSmoothCents(Math.round(currentCentsRef.current));
            requestAnimationFrame(fadeOut);
          }
        }
      };
      fadeOut();
      return;
    }

    const animate = () => {
      const now = Date.now();
      
      // Обновляем целевые значения из питч-детектора (не каждый кадр, чтобы уменьшить дерганье)
      if (pitch && pitch.clarity > 0.7 && pitch.frequency > 70 && pitch.frequency < 500) {
        const noteData = getNoteFromFrequency(pitch.frequency);
        
        // Обновляем цели
        targetFreqRef.current = pitch.frequency;
        targetCentsRef.current = noteData.cents;
        targetNoteRef.current = noteData.note;
        setIsActive(true);
      } else if (targetFreqRef.current !== null) {
        // Если звук пропал, начинаем затухание через 300мс
        if (now - lastUpdateRef.current > 300) {
          targetFreqRef.current = null;
          targetNoteRef.current = null;
          setIsActive(false);
        }
      }
      
      // Плавно двигаем текущие значения к целевым
      if (targetFreqRef.current !== null && currentFreqRef.current !== null) {
        // Медленно двигаем частоту
        currentFreqRef.current = currentFreqRef.current + 
          (targetFreqRef.current - currentFreqRef.current) * SMOOTHING_FACTOR;
        
        // Двигаем центы
        currentCentsRef.current = currentCentsRef.current + 
          (targetCentsRef.current - currentCentsRef.current) * SMOOTHING_FACTOR;
        
      } else if (targetFreqRef.current !== null && currentFreqRef.current === null) {
        // Первое значение
        currentFreqRef.current = targetFreqRef.current;
        currentCentsRef.current = targetCentsRef.current;
      } else if (targetFreqRef.current === null && currentFreqRef.current !== null) {
        // Затухаем
        currentFreqRef.current = currentFreqRef.current * 0.98;
        currentCentsRef.current = currentCentsRef.current * 0.98;
        
        if (Math.abs(currentFreqRef.current) < 70) {
          currentFreqRef.current = null;
          currentCentsRef.current = 0;
        }
      }
      
      // Обновляем UI только при значительных изменениях
      if (currentFreqRef.current !== null) {
        const roundedFreq = Math.round(currentFreqRef.current);
        const roundedCents = Math.round(currentCentsRef.current);
        
        setSmoothFrequency(roundedFreq);
        setSmoothCents(roundedCents);
        setDisplayNote(targetNoteRef.current);
      } else {
        setSmoothFrequency(null);
        setSmoothCents(0);
        setDisplayNote(null);
      }
      
      lastUpdateRef.current = now;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Инициализация
    if (pitch && pitch.frequency) {
      targetFreqRef.current = pitch.frequency;
      currentFreqRef.current = pitch.frequency;
      const noteData = getNoteFromFrequency(pitch.frequency);
      targetCentsRef.current = noteData.cents;
      currentCentsRef.current = noteData.cents;
      targetNoteRef.current = noteData.note;
      setIsActive(true);
    }
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isListening, pitch]);

  const getCentsColor = () => {
    if (!isActive) return '#666';
    const absCents = Math.abs(smoothCents);
    if (absCents < 5) return '#4caf50';
    if (absCents < 15) return '#ff9800';
    if (absCents < 30) return '#f44336';
    return '#d32f2f';
  };

  const getCentsMessage = () => {
    if (!isActive) return '🎸 Сыграйте на гитаре';
    const absCents = Math.abs(smoothCents);
    if (absCents < 3) return '✓ Идеально!';
    if (absCents < 8) return '👍 Отлично';
    if (absCents < 15) return '🎵 Хорошо';
    if (absCents < 25) return '⚠️ Нужно подстроить';
    return '🔴 Сильно расстроена';
  };

  // Вычисляем позицию маркера с ограничением
  const markerPosition = () => {
    if (!isActive) return 50;
    const position = 50 + Math.min(45, Math.max(-45, smoothCents));
    return position;
  };

  return (
    <div className="guitar-tuner">
      <div className="tuner-header">
        <h3><Music size={20} /> Гитарный тюнер</h3>
        <button 
          onClick={isListening ? stop : start}
          className={isListening ? 'listening' : ''}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening ? 'Выключить' : 'Включить тюнер'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Note Display - главный блок */}
      <div className={`note-display ${isActive ? 'active' : 'inactive'}`}>
        <div className="frequency-section">
          <Activity size={16} />
          <span className="frequency-label">Частота</span>
          <span className="frequency-value">
            {smoothFrequency ? `${smoothFrequency} Гц` : '--- Гц'}
          </span>
        </div>
        
        <div className="note-section">
          <div className="note-label">Нота</div>
          <div 
            className={`note-value ${isActive ? 'active' : ''}`} 
            style={{ color: getCentsColor() }}
          >
            {displayNote || '-'}
          </div>
        </div>
        
        <div className="cents-section">
          <div className="cents-label">Отклонение</div>
        </div>
        
        <div className="cents-indicator">
          <div className="cents-bar">
            <div className="cents-track">
              <div 
                className="cents-marker" 
                style={{ 
                  left: `${markerPosition()}%`,
                  backgroundColor: getCentsColor(),
                  opacity: isActive ? 1 : 0.3,
                  transition: 'left 0.1s cubic-bezier(0.2, 0.9, 0.4, 1.1)'
                }}
              />
            </div>
            <div className="cents-labels">
              <span>-50¢</span>
              <span>-25¢</span>
              <span>0¢</span>
              <span>+25¢</span>
              <span>+50¢</span>
            </div>
          </div>
        </div>
      </div>

      {/* Справочник струн */}
      <div className="strings-reference">
        <div className="strings-title">Стандартный строй гитары:</div>
        <div className="strings-grid">
          <div className="string-item">
            <span className="string-name">1-я (E4)</span>
            <span className="string-freq">329.63 Гц</span>
          </div>
          <div className="string-item">
            <span className="string-name">2-я (B3)</span>
            <span className="string-freq">246.94 Гц</span>
          </div>
          <div className="string-item">
            <span className="string-name">3-я (G3)</span>
            <span className="string-freq">196.00 Гц</span>
          </div>
          <div className="string-item">
            <span className="string-name">4-я (D3)</span>
            <span className="string-freq">146.83 Гц</span>
          </div>
          <div className="string-item">
            <span className="string-name">5-я (A2)</span>
            <span className="string-freq">110.00 Гц</span>
          </div>
          <div className="string-item">
            <span className="string-name">6-я (E2)</span>
            <span className="string-freq">82.41 Гц</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuitarTuner;