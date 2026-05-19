import { renderHook, act, waitFor } from '@testing-library/react';
import { useTabsLibrary } from '../useTabsLibrary';
import { getLibrary, getFavorites, removeFromLibrary, removeFromFavorites } from '../../services/libraryService';
import { useAuth } from '../useAuth';

jest.mock('../useAuth');
jest.mock('../../services/libraryService');

describe('useTabsLibrary', () => {
  const mockUser = { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' };
  
  // Правильная структура LibraryItem
  const mockMyTabs = [
    { 
      id: 1, 
      tabData: { title: 'My Tab', tuning: [], measures: [] },
      lastModified: '2024-01-01',
    },
  ];
  
  const mockFavorites = [
    { 
      id: 2, 
      tabData: { title: 'Favorite', tuning: [], measures: [] },
      lastModified: '2024-01-01',
      isPublication: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockUser, isLoading: false });
    (getLibrary as jest.Mock).mockResolvedValue(mockMyTabs);
    (getFavorites as jest.Mock).mockResolvedValue(mockFavorites);
  });

  it('should load tabs on mount', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
      expect(result.current.favorites).toEqual(mockFavorites);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should delete my tab', async () => {
    (removeFromLibrary as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteMyTab(1);
    });

    expect(success).toBe(true);
    expect(removeFromLibrary).toHaveBeenCalledWith(1);
  });

  it('should remove from favorites', async () => {
    (removeFromFavorites as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.favorites).toEqual(mockFavorites);
    });

    let success = false;
    await act(async () => {
      success = await result.current.removeFromFavs(2);
    });

    expect(success).toBe(true);
    expect(removeFromFavorites).toHaveBeenCalledWith(2);
  });

  it('should search tabs', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
    });

    const searchResult = result.current.searchTabs('My');
    expect(searchResult.myTabsFiltered).toHaveLength(1);
    expect(searchResult.myTabsFiltered[0].id).toBe(1);
  });

  it('should refresh tabs', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(getLibrary).toHaveBeenCalledTimes(2);
  });

  it('should handle no current user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ currentUser: null, isLoading: false });
    
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual([]);
      expect(result.current.favorites).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should filter tabs by search query', () => {
    const { result } = renderHook(() => useTabsLibrary());
    const tabs = [{ tabData: { title: 'Rock Song', artist: 'Rock Band' } }] as any;
    
    const filtered = result.current.filterTabs(tabs, 'Rock');
    expect(filtered).toHaveLength(1);
  });
});