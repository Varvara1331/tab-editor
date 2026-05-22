import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from '../auth/Auth';
import { login, register } from '../../services/authService';

jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock('../../logo512.png', () => 'logo-mock.png', { virtual: true });

describe('Auth', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('рендеринг', () => {
    it('должен отображать форму входа по умолчанию', () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      expect(screen.getByText('Вход в аккаунт')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.queryByLabelText('Имя пользователя')).not.toBeInTheDocument();
      expect(screen.getByText('Войти')).toBeInTheDocument();
    });

    it('должен отображать логотип', () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      const logo = screen.getByAltText('TabEditor Logo');
      expect(logo).toBeInTheDocument();
    });

    it('должен переключаться на форму регистрации', () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.click(screen.getByText('Нет аккаунта? Зарегистрироваться'));
      
      expect(screen.getByText('Регистрация')).toBeInTheDocument();
      expect(screen.getByLabelText('Имя пользователя')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByText('Минимум 6 символов')).toBeInTheDocument();
    });
  });

  describe('валидация формы входа', () => {
    it('должен показывать ошибку при пустом email', async () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      const submitButton = screen.getByText('Войти');
      fireEvent.click(submitButton);
      
      expect(await screen.findByText('Введите email')).toBeInTheDocument();
    });

    it('должен показывать ошибку при некорректном email', async () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByText('Войти');
      fireEvent.click(submitButton);
      
      expect(await screen.findByText('Введите корректный email')).toBeInTheDocument();
    });

    it('должен показывать ошибку при коротком пароле', async () => {
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: '123' } });
      
      fireEvent.click(screen.getByText('Войти'));
      
      expect(await screen.findByText('Пароль должен содержать минимум 6 символов')).toBeInTheDocument();
    });
  });

  describe('успешная аутентификация', () => {
    it('должен успешно выполнять вход', async () => {
      (login as jest.Mock).mockResolvedValue({ success: true });
      
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByText('Войти'));
      
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockOnAuthSuccess).toHaveBeenCalled();
      });
    });

    it('должен успешно регистрировать пользователя', async () => {
      (register as jest.Mock).mockResolvedValue({ success: true });
      
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.click(screen.getByText('Нет аккаунта? Зарегистрироваться'));
      
      fireEvent.change(screen.getByLabelText('Имя пользователя'), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByText('Зарегистрироваться'));
      
      await waitFor(() => {
        expect(register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123');
        expect(mockOnAuthSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('обработка ошибок', () => {
    it('должен показывать ошибку при неудачном входе', async () => {
      (login as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: 'Неверный пароль' 
      });
      
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByText('Войти'));
      
      expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
    });

    it('должен показывать общую ошибку при исключении', async () => {
      (login as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByText('Войти'));
      
      expect(await screen.findByText('Произошла ошибка. Попробуйте позже.')).toBeInTheDocument();
    });
  });

  describe('состояние загрузки', () => {
    it('должен отображать индикатор загрузки во время отправки', async () => {
      (login as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );
      
      render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
      
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByText('Войти'));
      
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
  });
});