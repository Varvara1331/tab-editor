import { renderHook, act, waitFor } from '@testing-library/react';
import { usePublicTabs } from '../usePublicTabs';
import { publicTabsService } from '../../services/publicTabsService';
import { checkInFavorites, addToFavorites, removeFromFavorites } from '../../services/libraryService';
import { useAuth } from '../useAuth';

jest.mock('../useAuth');
jest.mock('../../services/publicTabsService');
jest.mock('../../services/libraryService');

describe('usePublicTabs', () => {
  const mockUser = { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' };
  
  const mockTabs = [
    { 
      id: 1, 
      title: 'Tab 1', 
      userId: 2,
      artist: 'Artist 1',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [],
      isPublic: true,
      views: 100,
      likes: 10,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    { 
      id: 2, 
      title: 'Tab 2', 
      userId: 2,
      artist: 'Artist 2',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [],
      isPublic: true,
      views: 50,
      likes: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockUser });
    (publicTabsService.getPublicTabs as jest.Mock).mockResolvedValue(mockTabs);
    (checkInFavorites as jest.Mock).mockResolvedValue(false);
  });

  it('должен загружать публичные табулатуры при монтировании компонента', async () => {
    const { result } = renderHook(() => usePublicTabs());

    await waitFor(() => {
      expect(result.current.tabs).toEqual(mockTabs);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен фильтровать табулатуры по поисковому запросу', async () => {
    const { result } = renderHook(() => usePublicTabs());

    act(() => {
      result.current.filterTabs('rock');
    });

    expect(result.current.searchQuery).toBe('rock');
  });

  it('должен обновлять список табулатур при вызове refresh', async () => {
    const { result } = renderHook(() => usePublicTabs());

    await waitFor(() => {
      expect(result.current.tabs).toEqual(mockTabs);
    });

    act(() => {
      result.current.refresh();
    });

    expect(publicTabsService.getPublicTabs).toHaveBeenCalledTimes(2);
  });

  it('должен добавлять табулатуру в избранное при toggleFavorite', async () => {
    (addToFavorites as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePublicTabs());

    await waitFor(() => {
      expect(result.current.tabs).toEqual(mockTabs);
    });

    let success = false;
    await act(async () => {
      success = await result.current.toggleFavorite(mockTabs[0]);
    });

    expect(success).toBe(true);
    expect(addToFavorites).toHaveBeenCalledWith(1);
  });

  it('должен удалять табулатуру из избранного при повторном вызове toggleFavorite', async () => {
    (removeFromFavorites as jest.Mock).mockResolvedValue(true);
    (checkInFavorites as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => usePublicTabs());

    await waitFor(() => {
      expect(result.current.tabs).toEqual(mockTabs);
    });

    let success = false;
    await act(async () => {
      success = await result.current.toggleFavorite(mockTabs[0]);
    });

    expect(success).toBe(true);
    expect(removeFromFavorites).toHaveBeenCalledWith(1);
  });
});