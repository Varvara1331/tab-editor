import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabPlayer from '../editor/TabPlayer';

// Мок для useGuitarPlayerSF2
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn();
const mockPause = jest.fn();
const mockSetTempo = jest.fn();
const mockInitializePlayer = jest.fn().mockResolvedValue(undefined);
const mockLoadTab = jest.fn();
const mockSeekToPosition = jest.fn();

jest.mock('../../hooks/useGuitarPlayerSF2', () => ({
  useGuitarPlayerSF2: jest.fn(() => ({
    isPlaying: false,
    play: mockPlay,
    stop: mockStop,
    pause: mockPause,
    currentPosition: null,
    setTempo: mockSetTempo,
    isReady: true,
    isLoading: false,
    error: null,
    initializePlayer: mockInitializePlayer,
    loadTab: mockLoadTab,
    seekToPosition: mockSeekToPosition
  }))
}));

const mockTabData = {
  id: 1,
  title: 'Test Song',
  artist: 'Test Artist',
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  notesPerMeasure: 16,
  measures: [{ 
    id: 'measure-1', 
    strings: [{ stringNumber: 0, notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }] }], 
    tempo: 120 
  }],
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TabPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('рендеринг', () => {
    it('должен отображать компонент с кнопками управления', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('tab-player')).toBeInTheDocument();
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-button')).toBeInTheDocument();
      expect(screen.getByTestId('tempo-slider')).toBeInTheDocument();
    });

    it('должен отображать иконку Play когда не играет', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('должен отображать BPM значение', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('bpm-value')).toHaveTextContent('120 BPM');
    });

    it('должен отображать индикатор загрузки при isLoading=true', () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: false,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: true,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('должен отображать ошибку при error', () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: false,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: 'Ошибка инициализации',
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('error-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('error-indicator')).toHaveTextContent('Ошибка инициализации');
    });
  });

  describe('управление воспроизведением', () => {
    it('должен вызывать play при клике на кнопку Play', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTestId('play-button');
      await userEvent.click(playButton);
      
      expect(mockPlay).toHaveBeenCalled();
    });

    it('должен отображать иконку Pause когда играет', () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: { measureIndex: 0, stringIndex: 0, noteIndex: 0 },
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });

    it('должен вызывать pause при клике на кнопку Play когда играет', async () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: { measureIndex: 0, stringIndex: 0, noteIndex: 0 },
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTestId('play-button');
      await userEvent.click(playButton);
      
      expect(mockPause).toHaveBeenCalled();
    });

    it('должен вызывать stop при клике на кнопку Stop', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const stopButton = screen.getByTestId('stop-button');
      await userEvent.click(stopButton);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('управление темпом', () => {
    it('должен изменять BPM при перемещении ползунка', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const slider = screen.getByTestId('tempo-slider');
      fireEvent.change(slider, { target: { value: '140' } });
      
      expect(screen.getByTestId('bpm-value')).toHaveTextContent('140 BPM');
    });

    it('должен вызывать setTempo при изменении BPM', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const slider = screen.getByTestId('tempo-slider');
      fireEvent.change(slider, { target: { value: '140' } });
      
      expect(mockSetTempo).toHaveBeenCalledWith(140);
    });
  });

  describe('отображение позиции', () => {
    it('должен отображать текущую позицию', () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: { measureIndex: 2, stringIndex: 0, noteIndex: 4 },
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('position-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('position-indicator')).toHaveTextContent('Такт 3, Позиция 5/16/16');
    });
  });

  describe('инициализация', () => {
    it('должен инициализировать плеер при монтировании', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(mockInitializePlayer).toHaveBeenCalled();
    });

    it('должен загружать табулатуру при isReady', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(mockLoadTab).toHaveBeenCalledWith(mockTabData);
    });

    it('должен отображать индикатор инициализации', () => {
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: false,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: false,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTestId('init-indicator')).toBeInTheDocument();
    });
  });

  describe('ref методы', () => {
    it('должен экспонировать методы через ref', () => {
      const ref = React.createRef<any>();
      render(<TabPlayer ref={ref} tabData={mockTabData} />);
      
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.play).toBe('function');
      expect(typeof ref.current?.pause).toBe('function');
      expect(typeof ref.current?.stop).toBe('function');
      expect(typeof ref.current?.toggle).toBe('function');
      expect(typeof ref.current?.getIsPlaying).toBe('function');
      expect(typeof ref.current?.seekTo).toBe('function');
    });

    it('метод getIsPlaying должен возвращать состояние', () => {
      const ref = React.createRef<any>();
      render(<TabPlayer ref={ref} tabData={mockTabData} />);
      
      expect(ref.current.getIsPlaying()).toBe(false);
    });

    it('метод seekTo должен вызывать seekToPosition', () => {
      const ref = React.createRef<any>();
      render(<TabPlayer ref={ref} tabData={mockTabData} />);
      
      ref.current.seekTo(1, 2);
      
      expect(mockSeekToPosition).toHaveBeenCalledWith({
        measureIndex: 1,
        stringIndex: 0,
        noteIndex: 2
      });
    });
  });

  describe('обработка событий позиции', () => {
    it('должен вызывать onPositionChange при изменении позиции', () => {
      const onPositionChange = jest.fn();
      const { useGuitarPlayerSF2 } = require('../../hooks/useGuitarPlayerSF2');
      
      const mockCurrentPosition = { measureIndex: 1, stringIndex: 0, noteIndex: 2 };
      useGuitarPlayerSF2.mockImplementation(() => ({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: mockCurrentPosition,
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition
      }));
      
      render(<TabPlayer tabData={mockTabData} onPositionChange={onPositionChange} />);
      
      expect(onPositionChange).toHaveBeenCalledWith(mockCurrentPosition);
    });
  });
});
