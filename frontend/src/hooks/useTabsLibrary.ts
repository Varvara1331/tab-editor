/**
 * @fileoverview Хук для работы с библиотекой табулатур пользователя.
 * Управляет загрузкой, кэшированием и CRUD операциями с табулатурами.
 * 
 * @module hooks/useTabsLibrary
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getLibrary, getFavorites, removeFromLibrary, removeFromFavorites, LibraryItem } from '../services/libraryService';
import { filterLibraryItems } from '../utils/filterUtils';
import { useAuth } from './useAuth';

/**
 * Опции хука useTabsLibrary
 */
interface UseTabsLibraryOptions {
  /** Автоматическая загрузка при монтировании (по умолчанию true) */
  autoLoad?: boolean;
  /** Время кэширования в миллисекундах (по умолчанию 30000) */
  cacheTimeout?: number;
}

/**
 * Возвращаемое значение хука useTabsLibrary
 */
interface UseTabsLibraryReturn {
  /** Мои табулатуры */
  myTabs: LibraryItem[];
  /** Избранные табулатуры */
  favorites: LibraryItem[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** ID табулатуры, над которой выполняется операция */
  processingId: number | null;
  /** Загрузка табулатур (с опцией принудительной перезагрузки) */
  loadTabs: (force?: boolean) => Promise<void>;
  /** Удаление своей табулатуры */
  deleteMyTab: (id: number) => Promise<boolean>;
  /** Удаление из избранного */
  removeFromFavs: (id: number) => Promise<boolean>;
  /** Фильтрация табулатур по поисковому запросу */
  filterTabs: (tabs: LibraryItem[], searchQuery: string) => LibraryItem[];
  /** Принудительное обновление */
  refresh: () => Promise<void>;
  /** Поиск по табулатурам */
  searchTabs: (query: string) => { myTabsFiltered: LibraryItem[]; favoritesFiltered: LibraryItem[] };
}

/** Время кэширования по умолчанию (30 секунд) */
const DEFAULT_CACHE_TIMEOUT = 30000;

/**
 * Хук для работы с библиотекой табулатур пользователя.
 * Предоставляет методы для загрузки, кэширования и управления табулатурами.
 * 
 * @param options - Опции хука
 * @returns Объект с состоянием и методами управления
 * 
 * @example
 * ```typescript
 * function Library() {
 *   const { myTabs, favorites, deleteMyTab, removeFromFavs, isLoading } = useTabsLibrary();
 *   
 *   if (isLoading) return <Spinner />;
 *   
 *   return (
 *     <div>
 *       <h2>Мои табулатуры</h2>
 *       {myTabs.map(tab => (
 *         <TabCard key={tab.id} tab={tab} onDelete={() => deleteMyTab(tab.id)} />
 *       ))}
 *       
 *       <h2>Избранное</h2>
 *       {favorites.map(tab => (
 *         <TabCard key={tab.id} tab={tab} onRemove={() => removeFromFavs(tab.id)} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTabsLibrary = (options: UseTabsLibraryOptions = {}): UseTabsLibraryReturn => {
  const { autoLoad = true, cacheTimeout = DEFAULT_CACHE_TIMEOUT } = options;
  const { currentUser, isLoading: authLoading } = useAuth();

  const [myTabs, setMyTabs] = useState<LibraryItem[]>([]);
  const [favorites, setFavorites] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const lastLoadTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Отслеживание монтирования компонента
  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false; 
    };
  }, []);

  /**
   * Загрузка табулатур из библиотеки
   * 
   * @param force - Принудительная перезагрузка (игнорирование кэша)
   */
  const loadTabs = useCallback(async (force = false) => {
    if (!currentUser) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    // Проверка кэша
    const now = Date.now();
    const isCached = !force && lastLoadTimeRef.current && (now - lastLoadTimeRef.current) < cacheTimeout;
    if (isCached) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }
    
    // Предотвращение параллельных загрузок
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }
    
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    
    loadPromiseRef.current = (async () => {
      try {
        const [my, favs] = await Promise.all([
          getLibrary(),
          getFavorites()
        ]);
        
        if (isMountedRef.current) {
          setMyTabs(my || []);
          setFavorites(favs || []);
          lastLoadTimeRef.current = now;
        }
      } catch (error) { 
        console.error('Error loading tabs:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        loadPromiseRef.current = null;
      }
    })();
    
    return loadPromiseRef.current;
  }, [cacheTimeout, currentUser]);

  /**
   * Удаление своей табулатуры
   * 
   * @param id - ID табулатуры
   * @returns true при успешном удалении
   */
  const deleteMyTab = useCallback(async (id: number): Promise<boolean> => {
    if (!currentUser) return false;
    
    setProcessingId(id);
    try {
      const success = await removeFromLibrary(id);
      if (success && isMountedRef.current) { 
        await loadTabs(true); 
        return true; 
      }
      return false;
    } catch (error) { 
      console.error('Error deleting tab:', error); 
      return false;
    } finally { 
      if (isMountedRef.current) setProcessingId(null); 
    }
  }, [loadTabs, currentUser]);

  /**
   * Удаление табулатуры из избранного
   * 
   * @param id - ID табулатуры
   * @returns true при успешном удалении
   */
  const removeFromFavs = useCallback(async (id: number): Promise<boolean> => {
    if (!currentUser) return false;
    
    setProcessingId(id);
    try {
      const success = await removeFromFavorites(id);
      if (success && isMountedRef.current) { 
        await loadTabs(true); 
        return true; 
      }
      return false;
    } catch (error) { 
      console.error('Error removing from favorites:', error); 
      return false;
    } finally { 
      if (isMountedRef.current) setProcessingId(null); 
    }
  }, [loadTabs, currentUser]);

  /**
   * Фильтрация табулатур по поисковому запросу
   * 
   * @param tabsList - Список табулатур
   * @param searchQuery - Поисковый запрос
   * @returns Отфильтрованный список
   */
  const filterTabs = useCallback((tabsList: LibraryItem[], searchQuery: string): LibraryItem[] => {
    return filterLibraryItems(tabsList, searchQuery);
  }, []);

  /**
   * Поиск по табулатурам
   * 
   * @param query - Поисковый запрос
   * @returns Объект с отфильтрованными списками
   */
  const searchTabs = useCallback((query: string) => ({
    myTabsFiltered: filterTabs(myTabs, query),
    favoritesFiltered: filterTabs(favorites, query)
  }), [myTabs, favorites, filterTabs]);

  /**
   * Принудительное обновление данных
   */
  const refresh = useCallback(() => loadTabs(true), [loadTabs]);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!currentUser) {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }
    
    if (autoLoad && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      loadTabs();
    }
  }, [autoLoad, currentUser, authLoading, loadTabs]);

  return { 
    myTabs, 
    favorites, 
    isLoading: isLoading || authLoading, 
    processingId, 
    loadTabs, 
    deleteMyTab, 
    removeFromFavs, 
    filterTabs, 
    refresh, 
    searchTabs 
  };
};