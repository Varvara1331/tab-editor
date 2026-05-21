import { render, screen, fireEvent } from '@testing-library/react';
import TabControls from '../editor/TabControls';

describe('TabControls', () => {
  const mockOnToolSelect = jest.fn();
  const mockOnNotesPerMeasureChange = jest.fn();
  const mockOnTuningChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('рендеринг', () => {
    it('должен отображать кнопки эффектов', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      
      expect(screen.getByTitle('Нота (N)')).toBeInTheDocument();
      expect(screen.getByTitle('Бенд (B)')).toBeInTheDocument();
      expect(screen.getByTitle('Хаммер (H)')).toBeInTheDocument();
      expect(screen.getByTitle('Вибрато (V)')).toBeInTheDocument();
      expect(screen.getByTitle('Слайд (S)')).toBeInTheDocument();
    });
  });

  describe('выбор инструмента', () => {
    it('должен вызывать onToolSelect при клике', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      
      const bendButton = screen.getByTitle('Бенд (B)');
      fireEvent.click(bendButton);
      
      expect(mockOnToolSelect).toHaveBeenCalledWith('bend');
    });
  });

  describe('размер такта', () => {
    it('должен отображать кнопки размера такта', () => {
      render(
        <TabControls
          selectedTool="note"
          onToolSelect={mockOnToolSelect}
          notesPerMeasure={16}
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange}
        />
      );
      
      expect(screen.getByText('4/4')).toBeInTheDocument();
      expect(screen.getByText('8/8')).toBeInTheDocument();
      expect(screen.getByText('16/16')).toBeInTheDocument();
    });

    it('должен вызывать onChange при изменении размера', () => {
      render(
        <TabControls
          selectedTool="note"
          onToolSelect={mockOnToolSelect}
          notesPerMeasure={16}
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange}
        />
      );
      
      const button = screen.getByText('4/4');
      fireEvent.click(button);
      
      expect(mockOnNotesPerMeasureChange).toHaveBeenCalledWith(4);
    });
  });
});