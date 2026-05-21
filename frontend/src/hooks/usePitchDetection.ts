/**
 * @fileoverview Хук для определения высоты звука через микрофон.
 * Использует библиотеку Pitchy для анализа аудиопотока в реальном времени.
 * 
 * @module hooks/usePitchDetection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

/**
 * Результат определения высоты звука
 */
interface PitchResult {
  /** Частота звука в Герцах */
  frequency: number;
  /** Четкость сигнала (0-1), где 1 - максимальная четкость */
  clarity: number;
}

/**
 * Возвращаемое значение хука usePitchDetection
 */
interface UsePitchDetectionReturn {
  /** Флаг прослушивания микрофона (активен ли захват звука) */
  isListening: boolean;
  /** Текст ошибки, если произошла ошибка доступа к микрофону */
  error: string | null;
  /** Результат определения высоты звука, null если сигнал недостаточно четкий */
  pitch: PitchResult | null;
  /** Функция запуска прослушивания и анализа звука */
  start: () => Promise<void>;
  /** Функция остановки прослушивания и освобождения ресурсов микрофона */
  stop: () => void;
}

/**
 * Хук для определения высоты звука через микрофон.
 * Использует Web Audio API и библиотеку Pitchy для точного определения частоты звука.
 * Автоматически фильтрует сигналы с низкой четкостью и частоты вне гитарного диапазона.
 * 
 * @hook
 * @returns Объект с состоянием детектора и функциями управления
 * 
 * @example
 * ```tsx
 * const { isListening, error, pitch, start, stop } = usePitchDetection();
 * 
 * // Запуск прослушивания
 * await start();
 * 
 * // Использование результатов
 * if (pitch) {
 *   console.log(`Частота: ${pitch.frequency} Гц, четкость: ${pitch.clarity}`);
 * }
 * 
 * // Остановка
 * stop();
 * ```
 * 
 * @remarks
 * - Частоты вне диапазона 70-500 Гц игнорируются (оптимально для гитары)
 * - Сигналы с четкостью ниже 0.8 считаются шумом и игнорируются
 * - При размонтировании компонента автоматически останавливается прослушивание
 */
export const usePitchDetection = (): UsePitchDetectionReturn => {
  /** Флаг активности прослушивания микрофона */
  const [isListening, setIsListening] = useState(false);
  /** Сообщение об ошибке доступа к микрофону */
  const [error, setError] = useState<string | null>(null);
  /** Текущий результат определения высоты звука */
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /**
   * Запускает прослушивание микрофона и анализ звука.
   * Запрашивает доступ к микрофону, настраивает AudioContext и начинает цикл определения частоты.
   * 
   * @async
   * @returns Promise, который резолвится после запуска анализатора
   * @throws Ошибка доступа к микрофону обрабатывается и сохраняется в состояние error
   */
  const start = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      const bufferSize = analyserRef.current.fftSize;
      detectorRef.current = PitchDetector.forFloat32Array(bufferSize);
      
      await audioContextRef.current.resume();
      
      setIsListening(true);
      
      const updatePitch = () => {
        if (!analyserRef.current || !detectorRef.current || !audioContextRef.current) {
          return;
        }
        
        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);
        
        const [detectedPitch, clarity] = detectorRef.current.findPitch(
          buffer,
          audioContextRef.current.sampleRate
        );
        
        if (clarity > 0.8 && detectedPitch > 70 && detectedPitch < 500) {
          setPitch({ frequency: detectedPitch, clarity });
        } else {
          setPitch(null);
        }
        
        animationRef.current = requestAnimationFrame(updatePitch);
      };
      
      updatePitch();
      
    } catch (err) {
      setError('Не удалось получить доступ к микрофону');
      setIsListening(false);
    }
  }, []);

  /**
   * Останавливает прослушивание микрофона и освобождает все ресурсы.
   * Отменяет анимационный цикл, отключает аудиоузлы, закрывает AudioContext
   * и останавливает все активные треки микрофона.
   */
  const stop = useCallback(() => {
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
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      mediaStreamRef.current = null;
    }
    
    setIsListening(false);
    setPitch(null);
    setError(null);
  }, []);

  /**
   * Очистка ресурсов при размонтировании компонента
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isListening,
    error,
    pitch,
    start,
    stop,
  };
};