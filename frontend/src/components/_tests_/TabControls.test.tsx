import { render, screen, fireEvent } from '@testing-library/react';
import TabControls from '../editor/TabControls';

describe('TabControls', () => {
  const mockOnToolSelect = jest.fn();
  const mockOnNotesPerMeasureChange = jest.fn();
  const mockOnTuningChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // РЕНДЕРИНГ
  // ============================================
  describe('рендеринг', () => {
    it('должен отображать кнопки эффектов', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      expect(screen.getByTitle('Нота (N)')).toBeInTheDocument();
      expect(screen.getByTitle('Бенд (B)')).toBeInTheDocument();
      expect(screen.getByTitle('Хаммер (H)')).toBeInTheDocument();
      expect(screen.getByTitle('Вибрато (V)')).toBeInTheDocument();
      expect(screen.getByTitle('Слайд (S)')).toBeInTheDocument();
    });

    it('должен подсвечивать активный инструмент', () => {
      render(<TabControls selectedTool="bend" onToolSelect={mockOnToolSelect} />);
      expect(screen.getByTitle('Бенд (B)')).toHaveClass('active');
    });

    it('должен отображать панель плеера если передан player', () => {
      const mockPlayer = <div data-testid="mock-player">Player</div>;
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} player={mockPlayer} />);
      expect(screen.getByTestId('mock-player')).toBeInTheDocument();
    });

    it('должен отображать группу размера такта если передан onNotesPerMeasureChange', () => {
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

    it('не должен отображать группу размера такта если не передан onNotesPerMeasureChange', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      expect(screen.queryByText('4/4')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // ВЫБОР ИНСТРУМЕНТА
  // ============================================
  describe('выбор инструмента', () => {
    it('должен вызывать onToolSelect при клике на бенд', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      fireEvent.click(screen.getByTitle('Бенд (B)'));
      expect(mockOnToolSelect).toHaveBeenCalledWith('bend');
    });

    it('должен вызывать onToolSelect при клике на хаммер', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      fireEvent.click(screen.getByTitle('Хаммер (H)'));
      expect(mockOnToolSelect).toHaveBeenCalledWith('hammer');
    });

    it('должен вызывать onToolSelect при клике на вибрато', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      fireEvent.click(screen.getByTitle('Вибрато (V)'));
      expect(mockOnToolSelect).toHaveBeenCalledWith('vibrato');
    });

    it('должен вызывать onToolSelect при клике на слайд', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
      fireEvent.click(screen.getByTitle('Слайд (S)'));
      expect(mockOnToolSelect).toHaveBeenCalledWith('slide');
    });

    it('должен вызывать onToolSelect при клике на ноту', () => {
      render(<TabControls selectedTool="bend" onToolSelect={mockOnToolSelect} />);
      fireEvent.click(screen.getByTitle('Нота (N)'));
      expect(mockOnToolSelect).toHaveBeenCalledWith('note');
    });
  });

  // ============================================
  // РАЗМЕР ТАКТА
  // ============================================
  describe('размер такта', () => {
    it('должен вызывать onChange при изменении размера на 4/4', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={16} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
        />
      );
      fireEvent.click(screen.getByText('4/4'));
      expect(mockOnNotesPerMeasureChange).toHaveBeenCalledWith(4);
    });

    it('должен вызывать onChange при изменении размера на 8/8', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={16} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
        />
      );
      fireEvent.click(screen.getByText('8/8'));
      expect(mockOnNotesPerMeasureChange).toHaveBeenCalledWith(8);
    });

    it('должен вызывать onChange при изменении размера на 16/16', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={4} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
        />
      );
      fireEvent.click(screen.getByText('16/16'));
      expect(mockOnNotesPerMeasureChange).toHaveBeenCalledWith(16);
    });

    it('не должен вызывать onChange при клике на активный размер', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={16} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
        />
      );
      fireEvent.click(screen.getByText('16/16'));
      expect(mockOnNotesPerMeasureChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // СТРОЙ ГИТАРЫ
  // ============================================
  describe('строй гитары', () => {
    const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

    it('должен отображать поля для каждой струны', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      expect(screen.getByDisplayValue('E4')).toBeInTheDocument();
      expect(screen.getByDisplayValue('B3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('G3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('D3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('E2')).toBeInTheDocument();
    });

    it('должен вызывать onTuningChange при изменении строя струны', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      const input = screen.getByDisplayValue('E4');
      fireEvent.change(input, { target: { value: 'D4' } });
      expect(mockOnTuningChange).toHaveBeenCalled();
    });

    it('должен показывать предустановленные строи', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      const presetButton = screen.getByTitle('Выбрать предустановленный строй');
      fireEvent.click(presetButton);
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Drop D')).toBeInTheDocument();
      expect(screen.getByText('Open G')).toBeInTheDocument();
      expect(screen.getByText('Open D')).toBeInTheDocument();
      expect(screen.getByText('Half Step Down')).toBeInTheDocument();
      expect(screen.getByText('Full Step Down')).toBeInTheDocument();
      expect(screen.getByText('DADGAD')).toBeInTheDocument();
    });

    it('должен применять выбранный предустановленный строй', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      const presetButton = screen.getByTitle('Выбрать предустановленный строй');
      fireEvent.click(presetButton);
      fireEvent.click(screen.getByText('Drop D'));
      expect(mockOnTuningChange).toHaveBeenCalled();
    });

    it('должен отображать название текущего предустановленного строя', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      const presetButton = screen.getByTitle('Выбрать предустановленный строй');
      expect(presetButton).toHaveTextContent('Standard');
    });

    it('должен отображать "Выбрать строй" для кастомного строя', () => {
      const customTuning = ['X1', 'Y2', 'Z3', 'W4', 'V5', 'U6'];
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={customTuning} 
          onTuningChange={mockOnTuningChange} 
        />
      );
      const presetButton = screen.getByTitle('Выбрать предустановленный строй');
      expect(presetButton).toHaveTextContent('Выбрать строй');
    });
  });

  // ============================================
  // ГОРЯЧИЕ КЛАВИШИ
  // ============================================
  describe('горячие клавиши', () => {
    beforeEach(() => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} />);
    });

    it('должен выбирать бенд при нажатии B', () => {
      fireEvent.keyDown(window, { key: 'b' });
      expect(mockOnToolSelect).toHaveBeenCalledWith('bend');
    });

    it('должен выбирать хаммер при нажатии H', () => {
      fireEvent.keyDown(window, { key: 'h' });
      expect(mockOnToolSelect).toHaveBeenCalledWith('hammer');
    });

    it('должен выбирать вибрато при нажатии V', () => {
      fireEvent.keyDown(window, { key: 'v' });
      expect(mockOnToolSelect).toHaveBeenCalledWith('vibrato');
    });

    it('должен выбирать слайд при нажатии S', () => {
      fireEvent.keyDown(window, { key: 's' });
      expect(mockOnToolSelect).toHaveBeenCalledWith('slide');
    });

    it('должен выбирать ноту при нажатии N', () => {
      render(<TabControls selectedTool="bend" onToolSelect={mockOnToolSelect} />);
      fireEvent.keyDown(window, { key: 'n' });
      expect(mockOnToolSelect).toHaveBeenCalledWith('note');
    });

    it('должен игнорировать горячие клавиши при вводе в поле input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      fireEvent.keyDown(input, { key: 'b' });
      expect(mockOnToolSelect).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('должен игнорировать горячие клавиши при вводе в поле textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      fireEvent.keyDown(textarea, { key: 'b' });
      expect(mockOnToolSelect).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });
  });

  // ============================================
  // РЕЖИМ ТОЛЬКО ДЛЯ ЧТЕНИЯ
  // ============================================
  describe('режим только для чтения', () => {
    beforeEach(() => {
      mockOnToolSelect.mockClear();
      mockOnNotesPerMeasureChange.mockClear();
      mockOnTuningChange.mockClear();
    });

    it('должен отключать кнопки эффектов', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} isReadOnly={true} />);
      expect(screen.getByTitle('Бенд (B)')).toBeDisabled();
      expect(screen.getByTitle('Хаммер (H)')).toBeDisabled();
      expect(screen.getByTitle('Вибрато (V)')).toBeDisabled();
      expect(screen.getByTitle('Слайд (S)')).toBeDisabled();
    });

    it('должен отключать изменение размера', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={16} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
          isReadOnly={true} 
        />
      );
      expect(screen.getByText('4/4')).toBeDisabled();
      expect(screen.getByText('8/8')).toBeDisabled();
      expect(screen.getByText('16/16')).toBeDisabled();
    });

    it('должен отключать поля строя', () => {
      const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
          isReadOnly={true} 
        />
      );
      expect(screen.getByDisplayValue('E4')).toBeDisabled();
      expect(screen.getByDisplayValue('B3')).toBeDisabled();
      expect(screen.getByDisplayValue('G3')).toBeDisabled();
    });

    it('не должен вызывать onToolSelect при клике в read-only режиме', () => {
      render(<TabControls selectedTool="note" onToolSelect={mockOnToolSelect} isReadOnly={true} />);
      fireEvent.click(screen.getByTitle('Бенд (B)'));
      expect(mockOnToolSelect).not.toHaveBeenCalled();
    });

    it('не должен вызывать onNotesPerMeasureChange при клике в read-only режиме', () => {
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          notesPerMeasure={16} 
          onNotesPerMeasureChange={mockOnNotesPerMeasureChange} 
          isReadOnly={true} 
        />
      );
      fireEvent.click(screen.getByText('4/4'));
      expect(mockOnNotesPerMeasureChange).not.toHaveBeenCalled();
    });

    it('не должен вызывать onTuningChange при изменении строя в read-only режиме', () => {
      const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
          isReadOnly={true} 
        />
      );
      const input = screen.getByDisplayValue('E4');
      fireEvent.change(input, { target: { value: 'D4' } });
      expect(mockOnTuningChange).not.toHaveBeenCalled();
    });

    it('должен отключать выпадающий список предустановок в read-only режиме', () => {
      const tuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
      render(
        <TabControls 
          selectedTool="note" 
          onToolSelect={mockOnToolSelect} 
          tuning={tuning} 
          onTuningChange={mockOnTuningChange} 
          isReadOnly={true} 
        />
      );
      const presetButton = screen.getByTitle('Выбрать предустановленный строй');
      expect(presetButton).toBeDisabled();
    });
  });
});
