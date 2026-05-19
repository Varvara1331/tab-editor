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

  it('should load user on mount', async () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return null for unauthenticated user', async () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle logout', async () => {
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

  it('should refresh user', async () => {
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
  it('should return current user and isAuthenticated function', () => {
    const { result } = renderHook(() => useLegacyAuth());
    expect(result.current).toHaveProperty('currentUser');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(typeof result.current.isAuthenticated).toBe('function');
  });
});