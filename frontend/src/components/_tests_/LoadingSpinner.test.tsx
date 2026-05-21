import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('должен отображать сообщение по умолчанию', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('должен отображать пользовательское сообщение', () => {
    render(<LoadingSpinner message="Сохранение..." />);
    expect(screen.getByText('Сохранение...')).toBeInTheDocument();
  });

  it('должен иметь правильный размер для large', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    expect(container.firstChild).toHaveClass('loading-large');
  });

  it('должен иметь правильный размер для small', () => {
    const { container } = render(<LoadingSpinner size="small" />);
    expect(container.firstChild).toHaveClass('loading-small');
  });

  it('должен иметь правильный размер для medium по умолчанию', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toHaveClass('loading-medium');
  });

  it('должен иметь спиннер с aria-label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument();
  });
});