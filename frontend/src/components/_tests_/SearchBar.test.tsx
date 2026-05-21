import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '../common/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('должен отображать поле ввода с плейсхолдером', () => {
    render(<SearchBar value="" onChange={jest.fn()} placeholder="Поиск..." />);
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
  });

  it('должен отображать значение', () => {
    render(<SearchBar value="test query" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('должен вызывать onChange с дебаунсингом', () => {
    const onChange = jest.fn();
    render(<SearchBar value="" onChange={onChange} debounceDelay={300} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(onChange).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('должен показывать кнопку очистки при наличии значения', () => {
    const onClear = jest.fn();
    render(<SearchBar value="test" onChange={jest.fn()} onClear={onClear} />);
    
    const clearButton = screen.getByLabelText('Очистить поле поиска');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });

  it('не должен показывать кнопку очистки при пустом значении', () => {
    render(<SearchBar value="" onChange={jest.fn()} onClear={jest.fn()} />);
    expect(screen.queryByLabelText('Очистить поле поиска')).not.toBeInTheDocument();
  });

  it('должен устанавливать автофокус при монтировании', () => {
    render(<SearchBar value="" onChange={jest.fn()} autoFocus />);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('должен очищать локальное значение при клике на крестик', () => {
    const onChange = jest.fn();
    const onClear = jest.fn();
    render(<SearchBar value="test" onChange={onChange} onClear={onClear} />);
    
    const clearButton = screen.getByLabelText('Очистить поле поиска');
    fireEvent.click(clearButton);
    
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});