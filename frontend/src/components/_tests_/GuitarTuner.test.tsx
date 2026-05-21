import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import GuitarTuner from '../editor/GuitarTuner';
import { usePitchDetection } from '../../hooks/usePitchDetection';

// Мок для хука usePitchDetection
jest.mock('../../hooks/usePitchDetection');

const mockStart = jest.fn();
const mockStop = jest.fn();

describe.skip('GuitarTuner', () => {
  const mockOnTuningMismatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (usePitchDetection as jest.Mock).mockReturnValue({
      isListening: false,
      error: null,
      pitch: null,
      start: mockStart,
      stop: mockStop,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('рендеринг', () => {
    it('должен отображать компонент когда isOpen = true', () => {
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      expect(screen.getByText('Гитарный тюнер')).toBeInTheDocument();
      expect(screen.getByText('Стандартный строй гитары:')).toBeInTheDocument();
      expect(screen.getByText('1-я (E4)')).toBeInTheDocument();
      expect(screen.getByText('6-я (E2)')).toBeInTheDocument();
    });

    it('должен отображать кнопку включения микрофона', () => {
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      const micButton = screen.getByRole('button');
      expect(micButton).toBeInTheDocument();
    });

    it('должен показывать частоту как "--- Гц" когда нет сигнала', () => {
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      expect(screen.getByText('--- Гц')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('управление микрофоном', () => {
    it('должен запускать запись при клике на кнопку', () => {
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      expect(mockStart).toHaveBeenCalled();
    });

    it('должен останавливать запись при повторном клике', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      expect(mockStop).toHaveBeenCalled();
    });

    it('должен автоматически останавливать запись при закрытии модального окна', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      const { rerender } = render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      rerender(<GuitarTuner isOpen={false} onTuningMismatch={mockOnTuningMismatch} />);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('отображение частоты', () => {
    it('должен отображать частоту при получении сигнала', async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 440, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      await waitFor(() => {
        expect(screen.getByText('440 Гц')).toBeInTheDocument();
      });
    });

    it('должен отображать ноту A при частоте 440 Гц', async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 440, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument();
      });
    });
  });

  describe('отображение ошибок', () => {
    it('должен показывать ошибку если она есть', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: false,
        error: 'Не удалось получить доступ к микрофону',
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      expect(screen.getByText('Не удалось получить доступ к микрофону')).toBeInTheDocument();
    });
  });

  describe('индикатор отклонения', () => {
    it('должен быть зелёным при точной настройке', async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 440, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      await waitFor(() => {
        const noteValue = screen.getByText('A');
        expect(noteValue).toHaveStyle({ color: '#4caf50' });
      });
    });

    it('должен быть оранжевым при небольшой расстройке', async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 445, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      await waitFor(() => {
        const noteValue = screen.getByText('A');
        expect(noteValue).toHaveStyle({ color: '#ff9800' });
      });
    });
  });

  describe('справочник строя', () => {
    it('должен отображать все 6 струн', () => {
      render(<GuitarTuner isOpen={true} onTuningMismatch={mockOnTuningMismatch} />);
      
      expect(screen.getByText('1-я (E4)')).toBeInTheDocument();
      expect(screen.getByText('2-я (B3)')).toBeInTheDocument();
      expect(screen.getByText('3-я (G3)')).toBeInTheDocument();
      expect(screen.getByText('4-я (D3)')).toBeInTheDocument();
      expect(screen.getByText('5-я (A2)')).toBeInTheDocument();
      expect(screen.getByText('6-я (E2)')).toBeInTheDocument();
    });
  });
});