import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthState } from '../useAuthState';
import * as authService from '../../services/authService';

jest.mock('../../services/authService', () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
  clearEditorState: jest.fn(),
}));

describe('useAuthState', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    createdAt: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен проверять статус аутентификации и загружать данные пользователя при монтировании', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен корректно обрабатывать неавторизованного пользователя', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен обновлять состояние при успешной аутентификации и очищать редактор', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    act(() => {
      result.current.handleAuthSuccess();
    });

    expect(authService.clearEditorState).toHaveBeenCalled();
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it('должен выполнять выход из системы после подтверждения пользователя', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    window.confirm = jest.fn().mockReturnValue(true);

    act(() => {
      result.current.handleLogout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.currentUser).toBeNull();
  });

  it('должен отменять выход из системы при отказе пользователя от подтверждения', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuthState());

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    window.confirm = jest.fn().mockReturnValue(false);

    act(() => {
      result.current.handleLogout();
    });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(result.current.isLoggedIn).toBe(true);
  });
});