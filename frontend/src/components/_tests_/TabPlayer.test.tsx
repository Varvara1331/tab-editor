// frontend/src/components/_tests_/TabPlayer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Создаем моки функций
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn();
const mockPause = jest.fn();
const mockSetTempo = jest.fn();
const mockInitializePlayer = jest.fn().mockResolvedValue(undefined);
const mockLoadTab = jest.fn();
const mockSeekToPosition = jest.fn();

// Мокаем хук useGuitarPlayerSF2 ДО импорта компонента
jest.mock('../../hooks/useGuitarPlayerSF2', () => ({
  useGuitarPlayerSF2: jest.fn(),
}));

// Мокаем lucide-react иконки
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">PlayIcon</span>,
  Pause: () => <span data-testid="pause-icon">PauseIcon</span>,
  Square: () => <span data-testid="square-icon">SquareIcon</span>,
  Loader2: () => <span data-testid="loader-icon">LoaderIcon</span>,
  AlertCircle: () => <span data-testid="alert-icon">AlertIcon</span>,
  Music: () => <span data-testid="music-icon">MusicIcon</span>,
}));

// Импортируем компонент
import TabPlayer from '../editor/TabPlayer';
import { useGuitarPlayerSF2 } from '../../hooks/useGuitarPlayerSF2';

describe('TabPlayer', () => {
  const mockOnPositionChange = jest.fn();
  const mockOnPlayheadPosition = jest.fn();

  const mockTabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [
      {
        id: 'measure-1',
        strings: [
          { stringNumber: 0, notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }] },
          { stringNumber: 1, notes: [{ fret: null }, { fret: null }, { fret: null }] },
        ],
        tempo: 120,
      },
    ],
    notesPerMeasure: 16,
    isPublic: false,
    isOwn: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlay.mockResolvedValue(undefined);
    mockInitializePlayer.mockResolvedValue(undefined);
    
    // Устанавливаем мок по умолчанию - isReady=true, isInitialized=true
    (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
      isPlaying: false,
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
      seekToPosition: mockSeekToPosition,
    });
  });

  describe('рендеринг', () => {
    it('должен рендерить панель управления плеером', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByTitle('Играть')).toBeInTheDocument();
      expect(screen.getByTitle('Остановить')).toBeInTheDocument();
      expect(screen.getByText('Темп')).toBeInTheDocument();
    });

    it('должен отображать кнопку Play в начальном состоянии', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTitle('Играть');
      expect(playButton).not.toBeDisabled();
    });

    it('должен отображать ползунок темпа', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const tempoSlider = screen.getByRole('slider');
      expect(tempoSlider).toBeInTheDocument();
      expect(tempoSlider).toHaveValue('120');
    });
  });

  describe('управление воспроизведением', () => {
    it('должен вызывать play при клике на кнопку Play', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTitle('Играть');
      expect(playButton).not.toBeDisabled();
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it('должен вызывать pause при клике на кнопку Play во время воспроизведения', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
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
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      const playButton = screen.getByTitle('Пауза');
      expect(playButton).not.toBeDisabled();
      fireEvent.click(playButton);
      
      expect(mockPause).toHaveBeenCalled();
    });

    it('должен вызывать stop при клике на кнопку Stop', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const stopButton = screen.getByTitle('Остановить');
      expect(stopButton).not.toBeDisabled();
      fireEvent.click(stopButton);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('управление темпом', () => {
    it('должен изменять темп при перемещении ползунка', () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      const tempoSlider = screen.getByRole('slider');
      fireEvent.change(tempoSlider, { target: { value: '140' } });
      
      expect(mockSetTempo).toHaveBeenCalledWith(140);
    });
  });

  describe('отображение позиции', () => {
    it('должен отображать текущую позицию воспроизведения', () => {
      (useGuitarPlayerSF2 as jest.Mock).mockReturnValue({
        isPlaying: true,
        play: mockPlay,
        stop: mockStop,
        pause: mockPause,
        currentPosition: { measureIndex: 2, stringIndex: 0, noteIndex: 5 },
        setTempo: mockSetTempo,
        isReady: true,
        isLoading: false,
        error: null,
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      // Проверяем что индикатор позиции отображается
      const positionElement = screen.getByText(/Такт/);
      expect(positionElement).toBeInTheDocument();
    });
  });

  describe('состояния загрузки и ошибок', () => {
    it('должен отображать индикатор загрузки при isLoading=true', () => {
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
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByText('Загрузка гитарных звуков...')).toBeInTheDocument();
    });

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
        error: 'Failed to load audio',
        initializePlayer: mockInitializePlayer,
        loadTab: mockLoadTab,
        seekToPosition: mockSeekToPosition,
      });
      
      render(<TabPlayer tabData={mockTabData} />);
      
      expect(screen.getByText('Failed to load audio')).toBeInTheDocument();
    });
  });

  describe('колбэки', () => {
    it('должен вызывать onPositionChange при изменении позиции', () => {
      render(
        <TabPlayer 
          tabData={mockTabData} 
          onPositionChange={mockOnPositionChange}
        />
      );
      
      // onPositionChange вызывается при монтировании из-за useEffect
      expect(mockOnPositionChange).toHaveBeenCalled();
    });
  });

  describe('инициализация плеера', () => {
    it('должен инициализировать плеер при монтировании', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      await waitFor(() => {
        expect(mockInitializePlayer).toHaveBeenCalled();
      });
    });
  });

  describe('загрузка табулатуры', () => {
    it('должен загружать табулатуру при готовности плеера', async () => {
      render(<TabPlayer tabData={mockTabData} />);
      
      await waitFor(() => {
        expect(mockLoadTab).toHaveBeenCalledWith(mockTabData);
      });
    });
  });
});