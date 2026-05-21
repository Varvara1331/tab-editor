import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../common/EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    icon: <span data-testid="icon">🎸</span>,
    title: 'Нет данных',
    message: 'Добавьте свои первые данные',
  };

  it('должен отображать заголовок и сообщение', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
    expect(screen.getByText('Добавьте свои первые данные')).toBeInTheDocument();
  });

  it('должен отображать иконку', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('должен отображать кнопку действия, если передана', () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={{ label: 'Создать', onClick: mockAction }}
      />
    );
    
    const button = screen.getByText('Создать');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalled();
  });

  it('не должен отображать кнопку, если action не передан', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('должен иметь правильный aria-label для иконки', () => {
    render(<EmptyState {...defaultProps} />);
    const iconDiv = screen.getByRole('img');
    expect(iconDiv).toHaveAttribute('aria-label', 'Нет данных');
  });
});