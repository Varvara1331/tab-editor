// src/hooks/usePitchDetection.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

interface PitchResult {
  frequency: number;
  clarity: number;
}

export const usePitchDetection = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      
      // 1. Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Настраиваем AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // 3. Создаем анализатор (размер буфера влияет на точность и задержку)
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Рекомендуемый размер для pitch detection
      
      // 4. Подключаем источник звука
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      // 5. Инициализируем детектор pitchy
      //    Размер входного буфера должен соответствовать analyser.fftSize [citation:2]
      const bufferSize = analyserRef.current.fftSize;
      detectorRef.current = PitchDetector.forFloat32Array(bufferSize);
      
      // 6. Запускаем AudioContext (важно: браузер требует взаимодействия пользователя)
      await audioContextRef.current.resume();
      
      setIsListening(true);
      
      // 7. Запускаем цикл анализа
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
        
        // Обновляем состояние, только если pitch достаточно "чистый" [citation:7]
        if (clarity > 0.8 && detectedPitch > 70 && detectedPitch < 500) {
          setPitch({ frequency: detectedPitch, clarity });
        } else {
          setPitch(null);
        }
        
        animationRef.current = requestAnimationFrame(updatePitch);
      };
      
      updatePitch();
      
    } catch (err) {
      console.error('Ошибка доступа к микрофону:', err);
      setError('Не удалось получить доступ к микрофону');
      setIsListening(false);
    }
  }, []);

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
    
    setIsListening(false);
    setPitch(null);
    setError(null);
  }, []);

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