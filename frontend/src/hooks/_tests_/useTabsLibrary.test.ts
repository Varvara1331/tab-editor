import { renderHook, act, waitFor } from '@testing-library/react';
import { useTabsLibrary } from '../useTabsLibrary';
import { getLibrary, getFavorites, removeFromLibrary, removeFromFavorites } from '../../services/libraryService';
import { useAuth } from '../useAuth';

jest.mock('../useAuth');
jest.mock('../../services/libraryService');

describe('useTabsLibrary', () => {
  const mockUser = { id: 1, username: 'test', email: 'test@test.com', createdAt: '2024-01-01' };
  
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

  it('должен загружать табулатуры и избранное при монтировании компонента', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
      expect(result.current.favorites).toEqual(mockFavorites);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен удалять табулатуру из моей библиотеки', async () => {
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

  it('должен удалять табулатуру из избранного', async () => {
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

  it('должен выполнять поиск по табулатурам', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
    });

    const searchResult = result.current.searchTabs('My');
    expect(searchResult.myTabsFiltered).toHaveLength(1);
    expect(searchResult.myTabsFiltered[0].id).toBe(1);
  });

  it('должен обновлять список табулатур при вызове refresh', async () => {
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual(mockMyTabs);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(getLibrary).toHaveBeenCalledTimes(2);
  });

  it('должен возвращать пустые списки при отсутствии авторизованного пользователя', async () => {
    (useAuth as jest.Mock).mockReturnValue({ currentUser: null, isLoading: false });
    
    const { result } = renderHook(() => useTabsLibrary());

    await waitFor(() => {
      expect(result.current.myTabs).toEqual([]);
      expect(result.current.favorites).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('должен фильтровать табулатуры по поисковому запросу', () => {
    const { result } = renderHook(() => useTabsLibrary());
    const tabs = [{ tabData: { title: 'Rock Song', artist: 'Rock Band' } }] as any;
    
    const filtered = result.current.filterTabs(tabs, 'Rock');
    expect(filtered).toHaveLength(1);
  });
});