import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, useLegacyAuth } from '../useAuth';
import * as authService from '../../services/authService';

jest.mock('../../services/authService', () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));

describe('useAuth', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    createdAt: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен загружать данные пользователя при монтировании компонента', async () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен возвращать null для неавторизованного пользователя', async () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен корректно выполнять выход из системы и очищать данные пользователя', async () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(mockUser);
    });

    act(() => {
      result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('должен обновлять данные пользователя при вызове refreshUser', async () => {
    const updatedUser = { ...mockUser, username: 'updateduser' };
    (authService.getCurrentUser as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(updatedUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(mockUser);
    });

    act(() => {
      result.current.refreshUser();
    });

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(updatedUser);
    });
  });
});

describe('useLegacyAuth', () => {
  it('должен возвращать объект с текущим пользователем и функцией проверки аутентификации', () => {
    const { result } = renderHook(() => useLegacyAuth());
    expect(result.current).toHaveProperty('currentUser');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(typeof result.current.isAuthenticated).toBe('function');
  });
});