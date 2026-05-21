import { render, screen, fireEvent } from '@testing-library/react';
import TuningSelector from '../editor/TuningSelector';

describe('TuningSelector', () => {
  const mockOnChange = jest.fn();
  const defaultTuning = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен отображать поля для каждой струны', () => {
    render(<TuningSelector tuning={defaultTuning} onTuningChange={mockOnChange} />);
    
    expect(screen.getByText('Струна 1:')).toBeInTheDocument();
    expect(screen.getByText('Струна 2:')).toBeInTheDocument();
    expect(screen.getByText('Струна 3:')).toBeInTheDocument();
    expect(screen.getByText('Струна 4:')).toBeInTheDocument();
    expect(screen.getByText('Струна 5:')).toBeInTheDocument();
    expect(screen.getByText('Струна 6:')).toBeInTheDocument();
  });

  it('должен отображать текущие значения строя', () => {
    render(<TuningSelector tuning={defaultTuning} onTuningChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('E4');
    expect(inputs[1]).toHaveValue('B3');
    expect(inputs[2]).toHaveValue('G3');
    expect(inputs[3]).toHaveValue('D3');
    expect(inputs[4]).toHaveValue('A2');
    expect(inputs[5]).toHaveValue('E2');
  });

  it('должен вызывать onChange при изменении настройки струны', () => {
    render(<TuningSelector tuning={defaultTuning} onTuningChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'D4' } });
    
    expect(mockOnChange).toHaveBeenCalledWith(['D4', 'B3', 'G3', 'D3', 'A2', 'E2']);
  });

  it('должен применять предустановленный строй', () => {
    render(<TuningSelector tuning={defaultTuning} onTuningChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Drop D' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });
});