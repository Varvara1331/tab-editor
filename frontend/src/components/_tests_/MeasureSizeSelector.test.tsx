import { render, screen, fireEvent } from '@testing-library/react';
import MeasureSizeSelector from '../editor/MeasureSizeSelector';

describe('MeasureSizeSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен отображать кнопки размеров', () => {
    render(<MeasureSizeSelector notesPerMeasure={16} onNotesPerMeasureChange={mockOnChange} />);
    
    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByText('8/8')).toBeInTheDocument();
    expect(screen.getByText('16/16')).toBeInTheDocument();
  });

  it('должен подсвечивать активный размер', () => {
    render(<MeasureSizeSelector notesPerMeasure={16} onNotesPerMeasureChange={mockOnChange} />);
    
    const activeButton = screen.getByText('16/16');
    expect(activeButton).toHaveClass('active');
  });

  it('должен вызывать onChange при клике на другой размер', () => {
    render(<MeasureSizeSelector notesPerMeasure={16} onNotesPerMeasureChange={mockOnChange} />);
    
    const button = screen.getByText('4/4');
    fireEvent.click(button);
    
    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('не должен вызывать onChange при клике на активный размер', () => {
    render(<MeasureSizeSelector notesPerMeasure={16} onNotesPerMeasureChange={mockOnChange} />);
    
    const button = screen.getByText('16/16');
    fireEvent.click(button);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('должен отключать кнопки в режиме read-only', () => {
    render(<MeasureSizeSelector notesPerMeasure={16} onNotesPerMeasureChange={mockOnChange} isReadOnly={true} />);
    
    const button = screen.getByText('4/4');
    expect(button).toBeDisabled();
  });
});