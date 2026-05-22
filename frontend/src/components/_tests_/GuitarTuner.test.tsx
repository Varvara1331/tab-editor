import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockStart = jest.fn();
const mockStop = jest.fn();

jest.mock('../../hooks/usePitchDetection', () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    error: null,
    pitch: null,
    start: mockStart,
    stop: mockStop,
  })),
}));

jest.mock('lucide-react', () => ({
  Mic: () => <span data-testid="mic-icon">MicIcon</span>,
  MicOff: () => <span data-testid="micoff-icon">MicOffIcon</span>,
  AlertCircle: () => <span data-testid="alert-icon">AlertIcon</span>,
  Music: () => <span data-testid="music-icon">MusicIcon</span>,
  Activity: () => <span data-testid="activity-icon">ActivityIcon</span>,
}));

import GuitarTuner from '../editor/GuitarTuner';
import { usePitchDetection } from '../../hooks/usePitchDetection';

describe('GuitarTuner', () => {
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
    it('должен рендерить компонент когда isOpen=true', () => {
      render(<GuitarTuner isOpen={true} />);
      expect(screen.getByText('Гитарный тюнер')).toBeInTheDocument();
      expect(screen.getByText('Стандартный строй гитары:')).toBeInTheDocument();
    });

    it('должен рендерить все струны в справочнике', () => {
      render(<GuitarTuner isOpen={true} />);
      expect(screen.getByText('1-я (E4)')).toBeInTheDocument();
      expect(screen.getByText('2-я (B3)')).toBeInTheDocument();
      expect(screen.getByText('3-я (G3)')).toBeInTheDocument();
      expect(screen.getByText('4-я (D3)')).toBeInTheDocument();
      expect(screen.getByText('5-я (A2)')).toBeInTheDocument();
      expect(screen.getByText('6-я (E2)')).toBeInTheDocument();
    });

    it('должен отображать частоты струн', () => {
      render(<GuitarTuner isOpen={true} />);
      expect(screen.getByText('329.63 Гц')).toBeInTheDocument();
      expect(screen.getByText('246.94 Гц')).toBeInTheDocument();
      expect(screen.getByText('196.00 Гц')).toBeInTheDocument();
      expect(screen.getByText('146.83 Гц')).toBeInTheDocument();
      expect(screen.getByText('110.00 Гц')).toBeInTheDocument();
      expect(screen.getByText('82.41 Гц')).toBeInTheDocument();
    });

    it('должен показывать кнопку с микрофоном', () => {
      render(<GuitarTuner isOpen={true} />);
      const micButton = screen.getByRole('button');
      expect(micButton).toBeInTheDocument();
    });
  });

  describe('управление микрофоном', () => {
    it('должен запускать запись при клике на кнопку', () => {
      render(<GuitarTuner isOpen={true} />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      expect(mockStart).toHaveBeenCalled();
    });

    it('должен останавливать запись при клике на кнопку когда слушает', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      const micButton = screen.getByRole('button');
      fireEvent.click(micButton);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('отображение ошибок', () => {
    it('должен отображать сообщение об ошибке', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: false,
        error: 'Microphone access denied',
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });
  });

  describe('отображение данных о ноте', () => {
    it('должен отображать частоту когда есть сигнал', async () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 440, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      await waitFor(() => {
        const freqElement = document.querySelector('.frequency-value');
        expect(freqElement).toBeInTheDocument();
        expect(freqElement?.textContent).toMatch(/Гц/);
      });
    });

    it('должен показывать прочерки когда нет сигнала', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      expect(screen.getByText('--- Гц')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('остановка записи при закрытии', () => {
    it('должен останавливать запись когда isOpen становится false', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: null,
        start: mockStart,
        stop: mockStop,
      });
      
      const { rerender } = render(<GuitarTuner isOpen={true} />);
      
      rerender(<GuitarTuner isOpen={false} />);
      
      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe('качество сигнала', () => {
    it('должен показывать частоту при низкой четкости', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 440, clarity: 0.3 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      const freqElement = document.querySelector('.frequency-value');
      expect(freqElement).toBeInTheDocument();
      expect(freqElement?.textContent).toMatch(/Гц/);
    });

    it('должен показывать --- Гц для частот ниже порога', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 50, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      expect(screen.getByText('--- Гц')).toBeInTheDocument();
    });

    it('должен показывать частоту даже если она выше 500 Гц', () => {
      (usePitchDetection as jest.Mock).mockReturnValue({
        isListening: true,
        error: null,
        pitch: { frequency: 600, clarity: 0.9 },
        start: mockStart,
        stop: mockStop,
      });
      
      render(<GuitarTuner isOpen={true} />);
      
      const freqElement = document.querySelector('.frequency-value');
      expect(freqElement).toBeInTheDocument();
      expect(freqElement?.textContent).toMatch(/Гц/);
    });
  });
});