import { render, screen, fireEvent, act } from '@testing-library/react';
import FretInput from '../editor/FreetInput';

describe('FretInput', () => {
  const mockOnFretSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('активация', () => {
    it('не должен отображаться по умолчанию', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
    });

    it('должен активироваться при нажатии цифровой клавиши', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '5' });
      
      expect(screen.getByText('Введите лад (0-24):')).toBeInTheDocument();
    });

    it('не должен активироваться если enabled = false', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} enabled={false} />);
      
      fireEvent.keyDown(window, { key: '5' });
      
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
    });

    it('не должен активироваться при вводе в поле input', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      const mockInput = document.createElement('input');
      document.body.appendChild(mockInput);
      mockInput.focus();
      
      fireEvent.keyDown(mockInput, { key: '5' });
      
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
      
      document.body.removeChild(mockInput);
    });
  });

  describe('ввод лада', () => {
    it('должен отправлять лад при нажатии Enter', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '7' });
      
      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnFretSubmit).toHaveBeenCalledWith(7);
    });

    it('должен закрываться после отправки', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '7' });
      
      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
    });

    it('должен закрываться при нажатии Escape', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '7' });
      
      const input = screen.getByRole('spinbutton');
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
    });
  });

  describe('кнопки', () => {
    it('должен отправлять лад при клике на OK', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '7' });
      
      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);
      
      expect(mockOnFretSubmit).toHaveBeenCalledWith(7);
    });

    it('должен закрываться при клике на Отмена', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} />);
      
      fireEvent.keyDown(window, { key: '7' });
      
      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Введите лад')).not.toBeInTheDocument();
    });
  });

  describe('максимальный лад', () => {
    it('должен ограничивать ввод максимальным ладом', () => {
      render(<FretInput onFretSubmit={mockOnFretSubmit} maxFret={12} />);
      
      fireEvent.keyDown(window, { key: '1' });
      fireEvent.keyDown(window, { key: '5' });
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('max', '12');
    });
  });
});