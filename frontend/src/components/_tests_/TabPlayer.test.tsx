import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TabPlayer from '../editor/TabPlayer';
import { useGuitarPlayerSF2 } from '../../hooks/useGuitarPlayerSF2';

// Мок для хука useGuitarPlayerSF2
jest.mock('../../hooks/useGuitarPlayerSF2');

describe('TabPlayer', () => {
  const mockTabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    notesPerMeasure: 16,
    measures: [
      {
        id: 'measure-1',
        strings: [{ stringNumber: 0, notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }] }],
        tempo: 120,
      },
    ],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlay = jest.fn();
  const mockPause = jest.fn();
  const mockStop = jest.fn();
  const mockSetTempo = jest.fn();
  const mockInitializePlayer = jest.fn();
  const mockLoadTab = jest.fn();
  const mockSeekToPosition = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
      isPlaying: false,
      play: mockPlay,
      stop: mockStop,
      pause: mockPause,
      currentPosition: null,
      setTempo: mockSetTempo,
      isReady: true,
      isLoading: false,
      error: null,
      loadTab: mockLoadTab,
      initializePlayer: mockInitializePlayer,
      seekToPosition: mockSeekToPosition,
    });
  });

  describe('рендеринг', () => {
    it('должен отображать кнопки управления', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTitle('Играть')).toBeInTheDocument();
      expect(screen.getByTitle('Остановить')).toBeInTheDocument();
    });

    it('должен отображать контроль темпа', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByLabelText('Темп')).toBeInTheDocument();
      expect(screen.getByText('120 BPM')).toBeInTheDocument();
    });

    it('должен отображать индикатор позиции при воспроизведении', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: { measureIndex: 0, stringIndex: 0, noteIndex: 2 },
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        loadTab: mockLoadTab,
        initializePlayer: mockInitializePlayer,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByText(/Такт 1/)).toBeInTheDocument();
    });
  });

  describe('управление воспроизведением', () => {
    it('должен вызывать play при клике на кнопку Play', async () => {
      mockPlay.mockResolvedValue(undefined);
      
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTitle('Играть');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it('должен отображать кнопку Pause во время воспроизведения', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        loadTab: mockLoadTab,
        initializePlayer: mockInitializePlayer,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTitle('Пауза')).toBeInTheDocument();
    });

    it('должен вызывать pause при клике на кнопку Pause', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        loadTab: mockLoadTab,
        initializePlayer: mockInitializePlayer,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      const pauseButton = screen.getByTitle('Пауза');
      fireEvent.click(pauseButton);
      
      expect(mockPause).toHaveBeenCalled();
    });

    it('должен вызывать stop при клике на кнопку Stop', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const stopButton = screen.getByTitle('Остановить');
      fireEvent.click(stopButton);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('изменение темпа', () => {
    it('должен обновлять темп при изменении ползунка', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const tempoSlider = screen.getByLabelText('Темп');
      fireEvent.change(tempoSlider, { target: { value: '140' } });
      
      expect(mockSetTempo).toHaveBeenCalledWith(140);
    });
  });

  describe('загрузка табулатуры', () => {
    it('должен загружать табулатуру при монтировании', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(mockLoadTab).toHaveBeenCalledWith(mockTabData);
    });
  });

  describe('состояние загрузки', () => {
    it('должен отображать индикатор загрузки', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: false,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: false,
        isLoading: true,
        error: null,
        loadTab: mockLoadTab,
        initializePlayer: mockInitializePlayer,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByText('Загрузка гитарных звуков...')).toBeInTheDocument();
    });
  });

  describe('ошибки', () => {
    it('должен отображать сообщение об ошибке', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: false,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: null,
        setTempo: mockSetTempo,
        isReady: false,
        isLoading: false,
        error: 'Не удалось загрузить звуки',
        loadTab: mockLoadTab,
        initializePlayer: mockInitializePlayer,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByText('Не удалось загрузить звуки')).toBeInTheDocument();
    });
  });
});