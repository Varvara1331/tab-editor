import { renderHook, act, waitFor } from '@testing-library/react';
import { usePitchDetection } from '../usePitchDetection';

// Мок для pitchy ДО импорта хука
jest.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: jest.fn((size) => ({
      findPitch: jest.fn((buffer: Float32Array, sampleRate: number) => {
        // Возвращаем тестовую частоту и четкость
        return [440, 0.95];
      })
    }))
  }
}));

// Мок для getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

// Мок для AudioContext
const mockAnalyserGetFloatTimeDomainData = jest.fn();
const mockAnalyser = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  fftSize: 2048,
  getFloatTimeDomainData: mockAnalyserGetFloatTimeDomainData,
};

const mockAudioContext = {
  createMediaStreamSource: jest.fn().mockReturnValue({ 
    connect: jest.fn(),
    disconnect: jest.fn()
  }),
  createAnalyser: jest.fn().mockReturnValue(mockAnalyser),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  state: 'suspended',
  sampleRate: 44100,
};

(window as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
(window as any).webkitAudioContext = (window as any).AudioContext;

describe('usePitchDetection', () => {
  let mockStream: MediaStream;
  let mockTrack: { stop: jest.Mock; readyState: string };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack = { stop: jest.fn(), readyState: 'live' };
    mockStream = { getTracks: jest.fn().mockReturnValue([mockTrack]) } as unknown as MediaStream;
    mockGetUserMedia.mockResolvedValue(mockStream);
    
    // Сброс мока findPitch перед каждым тестом
    const mockFindPitch = jest.fn((buffer: Float32Array, sampleRate: number) => [440, 0.95]);
    (require('pitchy').PitchDetector.forFloat32Array as jest.Mock).mockReturnValue({
      findPitch: mockFindPitch
    });
    
    mockAnalyserGetFloatTimeDomainData.mockImplementation((buffer: Float32Array) => {
      // Имитируем синусоиду 440 Гц
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('инициализация', () => {
    it('должен возвращать начальное состояние', () => {
      const { result } = renderHook(() => usePitchDetection());
      
      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pitch).toBeNull();
    });
  });

  describe('start', () => {
    it('должен успешно запускать запись', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('должен обрабатывать ошибку доступа к микрофону', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBe('Не удалось получить доступ к микрофону');
    });

    it('должен определять высоту звука', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      // Ждем несколько кадров анимации
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch).not.toBeNull();
      expect(result.current.pitch?.frequency).toBe(440);
      expect(result.current.pitch?.clarity).toBe(0.95);
    });

    it('должен игнорировать частоты ниже 70 Гц', async () => {
      // Мокаем findPitch для возврата низкой частоты
      const mockFindPitch = jest.fn(() => [60, 0.95]);
      (require('pitchy').PitchDetector.forFloat32Array as jest.Mock).mockReturnValue({
        findPitch: mockFindPitch
      });
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch).toBeNull();
    });

    it('должен игнорировать частоты выше 500 Гц', async () => {
      // Мокаем findPitch для возврата высокой частоты
      const mockFindPitch = jest.fn(() => [600, 0.95]);
      (require('pitchy').PitchDetector.forFloat32Array as jest.Mock).mockReturnValue({
        findPitch: mockFindPitch
      });
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch).toBeNull();
    });

    it('должен игнорировать сигналы с низкой четкостью (< 0.8)', async () => {
      // Мокаем findPitch для возврата низкой четкости
      const mockFindPitch = jest.fn(() => [440, 0.5]);
      (require('pitchy').PitchDetector.forFloat32Array as jest.Mock).mockReturnValue({
        findPitch: mockFindPitch
      });
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch).toBeNull();
    });

    it('должен обновлять pitch при изменении частоты', async () => {
      let currentFrequency = 440;
      const mockFindPitch = jest.fn(() => [currentFrequency, 0.95]);
      (require('pitchy').PitchDetector.forFloat32Array as jest.Mock).mockReturnValue({
        findPitch: mockFindPitch
      });
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch?.frequency).toBe(440);
      
      // Изменяем частоту
      currentFrequency = 493.88; // Нота B4
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(result.current.pitch?.frequency).toBe(493.88);
    });
  });

  describe('stop', () => {
    it('должен останавливать запись', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.isListening).toBe(true);
      
      act(() => {
        result.current.stop();
      });
      
      expect(result.current.isListening).toBe(false);
      expect(result.current.pitch).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('должен останавливать анимационный цикл', async () => {
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');
      const cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(requestAnimationFrameSpy).toHaveBeenCalled();
      
      act(() => {
        result.current.stop();
      });
      
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
      
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    });

    it('должен останавливать все треки микрофона', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(mockTrack.stop).not.toHaveBeenCalled();
      
      act(() => {
        result.current.stop();
      });
      
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it('должен закрывать AudioContext', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(mockAudioContext.close).not.toHaveBeenCalled();
      
      act(() => {
        result.current.stop();
      });
      
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('должен быть безопасным при повторном вызове', async () => {
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      act(() => {
        result.current.stop();
        result.current.stop(); // Повторный вызов не должен вызывать ошибку
      });
      
      expect(result.current.isListening).toBe(false);
    });
  });

  describe('очистка ресурсов', () => {
    it('должен автоматически останавливать запись при размонтировании', async () => {
      const { result, unmount } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.isListening).toBe(true);
      
      act(() => {
        unmount();
      });
      
      // Проверяем, что stop был вызван
      expect(result.current.isListening).toBe(false);
    });
  });

  describe('обработка ошибок', () => {
    it('должен обрабатывать ошибку создания AudioContext', async () => {
      const mockError = new Error('AudioContext error');
      (window.AudioContext as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBe('Не удалось получить доступ к микрофону');
    });

    it('должен сбрасывать ошибку при повторном запуске', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
      
      const { result } = renderHook(() => usePitchDetection());
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.error).toBe('Не удалось получить доступ к микрофону');
      
      mockGetUserMedia.mockResolvedValue(mockStream);
      
      await act(async () => {
        await result.current.start();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.isListening).toBe(true);
    });
  });
});

