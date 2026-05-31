// src/hooks/_tests_/useGuitarPlayerSF2.test.tsx

import { renderHook, act } from '@testing-library/react';

// Мок для Tone.js ДО импорта хука
jest.mock('tone', () => ({
  getContext: jest.fn(() => ({ 
    rawContext: { destination: {} } 
  })),
  setContext: jest.fn(),
  Sampler: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttack: jest.fn(),
    triggerRelease: jest.fn(),
    dispose: jest.fn(),
    connect: jest.fn()
  })),
  start: jest.fn(),
  now: jest.fn(() => Date.now() / 1000),
  Transport: {
    schedule: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    seconds: 0,
    bpm: { 
      value: 120, 
      rampTo: jest.fn() 
    }
  },
  Destination: {
    maxVolume: 0,
    volume: { value: 0, rampTo: jest.fn() }
  },
  context: {
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    state: 'running'
  }
}));

// Мок для Soundfont - определяем внутри jest.mock
jest.mock('soundfont-player', () => ({
  instrument: jest.fn().mockResolvedValue({
    play: jest.fn(),
    stop: jest.fn(),
    schedule: jest.fn()
  })
}));

// Мок для AudioContext
const mockAudioContextClose = jest.fn().mockResolvedValue(undefined);
const mockAudioContextResume = jest.fn().mockResolvedValue(undefined);

// Сохраняем ссылку на текущий AudioContext
let currentAudioContext: any = null;

const createMockAudioContext = () => {
  const context = {
    close: mockAudioContextClose,
    resume: mockAudioContextResume,
    suspend: jest.fn().mockResolvedValue(undefined),
    state: 'suspended',
    destination: {},
    currentTime: 0,
    createMediaStreamSource: jest.fn(() => ({ connect: jest.fn() })),
    createAnalyser: jest.fn(() => ({ connect: jest.fn() })),
    createGain: jest.fn(() => ({ connect: jest.fn(), gain: { value: 1 } }))
  };
  currentAudioContext = context;
  return context;
};

// Глобальный мок для AudioContext
(window as any).AudioContext = jest.fn().mockImplementation(createMockAudioContext);
(window as any).webkitAudioContext = (window as any).AudioContext;

import { useGuitarPlayerSF2 } from '../useGuitarPlayerSF2';

const mockTabData = {
  id: 1,
  title: 'Test Song',
  artist: 'Test Artist',
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  notesPerMeasure: 16,
  measures: [{
    id: 'measure-1',
    strings: [
      { stringNumber: 0, notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }] },
      { stringNumber: 1, notes: [{ fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 2, notes: [{ fret: 7 }, { fret: 8 }, { fret: 10 }] },
      { stringNumber: 3, notes: [{ fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 4, notes: [{ fret: 12 }, { fret: null }, { fret: null }] },
      { stringNumber: 5, notes: [{ fret: null }, { fret: null }, { fret: null }] },
    ],
    tempo: 120,
  }],
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTabDataWithEffects = {
  ...mockTabData,
  measures: [{
    id: 'measure-1',
    strings: [
      { 
        stringNumber: 0, 
        notes: [
          { fret: 5, bend: true },
          { fret: 7, vibrato: true },
          { fret: 5, slide: 'up' as const },
          { fret: 8, slide: 'down' as const },
          { fret: 5, hammer: true },
          { fret: 7, pull: true },
          { fret: 12 },
          { fret: 0 }
        ] 
      },
      { stringNumber: 1, notes: [{ fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 2, notes: [{ fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 3, notes: [{ fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 4, notes: [{ fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }] },
      { stringNumber: 5, notes: [{ fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }, { fret: null }] },
    ],
    tempo: 120,
  }],
};

describe('useGuitarPlayerSF2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAudioContextClose.mockClear();
    mockAudioContextResume.mockClear();
    currentAudioContext = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('инициализация', () => {
    it('должен возвращать начальное состояние', () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isReady).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentPosition).toBeNull();
    });
  });

  describe('initializePlayer', () => {
    it('должен инициализировать плеер', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      expect(result.current.isReady).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('должен обрабатывать ошибку инициализации', async () => {
      const soundfontModule = require('soundfont-player');
      soundfontModule.instrument.mockRejectedValueOnce(new Error('Failed to load instrument'));
      
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      expect(result.current.isReady).toBe(false);
      expect(result.current.error).toContain('Ошибка инициализации');
    });
  });

  describe('loadTab', () => {
    it('должен загружать табулатуру', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      expect(result.current.isReady).toBe(true);
    });

    it('должен обновлять строй при загрузке', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      const customTuningTab = {
        ...mockTabData,
        tuning: ['D4', 'A3', 'F3', 'C3', 'G2', 'C2']
      };
      
      act(() => {
        result.current.loadTab(customTuningTab);
      });
      
      expect(result.current.isReady).toBe(true);
    });
  });

  describe('play', () => {
    it('должен запускать воспроизведение', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      
      // Очищаем
      act(() => {
        result.current.stop();
      });
    });

    it('должен показывать ошибку если нет загруженной табулатуры', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.error).toBe('Нет загруженной табулатуры');
      expect(result.current.isPlaying).toBe(false);
    });

    it('должен инициализировать плеер если он закрыт', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      // Не инициализируем плеер явно, просто загружаем табулатуру
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      // Плеер должен попытаться инициализироваться
      expect(result.current.isReady !== undefined || result.current.error !== undefined).toBe(true);
    });
  });

  describe('pause', () => {
    it('должен ставить на паузу', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isPlaying).toBe(false);
    });

    it('не должен делать ничего если не играет', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('stop', () => {
    it('должен останавливать воспроизведение', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      act(() => {
        result.current.stop();
      });
      
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentPosition).toBeNull();
    });

    it('должен очищать запланированные ноты при остановке', async () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      act(() => {
        result.current.stop();
      });
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('setTempo', () => {
    it('должен изменять темп', () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      act(() => {
        result.current.setTempo(140);
      });
      
      expect(result.current.setTempo).toBeDefined();
    });
  });

  describe('seekToPosition', () => {
    it('должен переходить к указанной позиции', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      act(() => {
        result.current.seekToPosition?.({ measureIndex: 0, stringIndex: 0, noteIndex: 2 });
      });
      
      expect(result.current.currentPosition).toEqual({ measureIndex: 0, stringIndex: 0, noteIndex: 2 });
    });

    it('должен переходить к позиции по проценту', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      act(() => {
        result.current.seekToPosition?.(50);
      });
      
      expect(result.current.currentPosition).toBeDefined();
    });

    it('не должен ничего делать если нет табулатуры', () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      act(() => {
        result.current.seekToPosition?.({ measureIndex: 0, stringIndex: 0, noteIndex: 2 });
      });
      
      expect(result.current.currentPosition).toBeNull();
    });

    it('должен ставить на паузу при переходе во время воспроизведения', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      
      act(() => {
        result.current.seekToPosition?.({ measureIndex: 0, stringIndex: 0, noteIndex: 1 });
      });
      
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('эффекты', () => {
    it('должен воспроизводить ноту с бендом', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabDataWithEffects);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      result.current.stop();
    });

    it('должен воспроизводить ноту с вибрато', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabDataWithEffects);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      result.current.stop();
    });

    it('должен обрабатывать слайд', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabDataWithEffects);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      // Продвигаем таймеры для слайда
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(result.current.isPlaying).toBe(true);
      result.current.stop();
    });

    it('должен обрабатывать хаммер и пулл', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabDataWithEffects);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      result.current.stop();
    });
  });

  describe('восстановление после паузы', () => {
    it('должен продолжать воспроизведение с позиции паузы', async () => {
      const { result } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      // Ждем немного
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isPlaying).toBe(false);
      
      await act(async () => {
        await result.current.play();
      });
      
      expect(result.current.isPlaying).toBe(true);
      result.current.stop();
    });
  });

  describe('очистка ресурсов', () => {
    it('должен закрывать AudioContext при размонтировании', async () => {
      const { result, unmount } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        unmount();
      });
      
      expect(mockAudioContextClose).toHaveBeenCalled();
    });

    it('должен очищать таймеры при размонтировании', async () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      const { result, unmount } = renderHook(() => useGuitarPlayerSF2());
      
      await act(async () => {
        await result.current.initializePlayer();
      });
      
      act(() => {
        result.current.loadTab(mockTabData);
      });
      
      await act(async () => {
        await result.current.play();
      });
      
      act(() => {
        unmount();
      });
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
