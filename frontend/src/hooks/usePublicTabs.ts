/**
 * @fileoverview Хук для работы с публичными табулатурами.
 * Управляет загрузкой, поиском и добавлением в избранное.
 * 
 * @module hooks/usePublicTabs
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { publicTabsService, PublicTab } from '../services/publicTabsService';
import { checkInFavorites, addToFavorites, removeFromFavorites } from '../services/libraryService';
import { useAuth } from './useAuth';

/**
 * Возвращаемое значение хука usePublicTabs
 */
interface UsePublicTabsReturn {
  /** Список публичных табулатур */
  tabs: PublicTab[];
  /** Флаг загрузки */
  isLoading: boolean;
  /** ID табулатуры, над которой выполняется операция */
  processingId: number | null;
  /** Статус добавления в избранное для каждой табулатуры */
  favoritesStatus: Map<number, boolean>;
  /** Текущий поисковый запрос */
  searchQuery: string;
  /** Фильтрация табулатур по поисковому запросу */
  filterTabs: (search: string) => void;
  /** Принудительное обновление списка */
  refresh: () => void;
  /** Переключение статуса избранного */
  toggleFavorite: (tab: PublicTab) => Promise<boolean>;
}

/**
 * Хук для работы с публичными табулатурами.
 * Предоставляет методы для загрузки, поиска и управления избранным.
 * 
 * @returns Объект с состоянием и методами управления
 * 
 * @example
 * ```typescript
 * function PublicTabsList() {
 *   const { tabs, isLoading, toggleFavorite, filterTabs } = usePublicTabs();
 *   
 *   if (isLoading) return <Spinner />;
 *   
 *   return (
 *     <div>
 *       <input onChange={(e) => filterTabs(e.target.value)} placeholder="Поиск..." />
 *       {tabs.map(tab => (
 *         <TabCard key={tab.id} tab={tab} onFavorite={() => toggleFavorite(tab)} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const usePublicTabs = (): UsePublicTabsReturn => {
  const { currentUser } = useAuth();
  
  const [tabs, setTabs] = useState<PublicTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [favoritesStatus, setFavoritesStatus] = useState<Map<number, boolean>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Отслеживание монтирования компонента
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  /**
   * Загрузка статуса избранного для списка табулатур
   */
  const loadFavoritesStatus = useCallback(async (tabsList: PublicTab[]) => {
    if (!currentUser) return new Map<number, boolean>();
    
    const statusMap = new Map<number, boolean>();
    for (const tab of tabsList) {
      // Только чужие табулатуры можно добавлять в избранное
      if (tab.userId !== currentUser.id) {
        const inFavorites = await checkInFavorites(tab.id);
        if (isMountedRef.current) statusMap.set(tab.id, inFavorites);
      } else {
        statusMap.set(tab.id, false);
      }
    }
    return statusMap;
  }, [currentUser]);

  /**
   * Загрузка публичных табулатур
   */
  const loadTabs = useCallback(async (search?: string) => {
    // Предотвращение повторных загрузок
    if (loadingRef.current) return;
    if (!currentUser) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const data = await publicTabsService.getPublicTabs({ 
        search: search || '', 
        limit: 50, 
        offset: 0 
      });
      
      if (!isMountedRef.current) return;
      
      setTabs(data);
      
      if (currentUser) {
        const statusMap = await loadFavoritesStatus(data);
        if (isMountedRef.current) {
          setFavoritesStatus(statusMap);
        }
      }
    } catch (error) {
      console.error('Error loading public tabs:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, [currentUser, loadFavoritesStatus]);

  // Загрузка при монтировании и изменении пользователя
  useEffect(() => {
    if (currentUser) {
      loadTabs(searchQuery || undefined);
    }
  }, [currentUser]); // Только при изменении пользователя

  // Дебаунсированная загрузка при изменении поиска
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        loadTabs(searchQuery || undefined);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, currentUser, loadTabs]);

  /**
   * Фильтрация табулатур по поисковому запросу
   */
  const filterTabs = useCallback((search: string) => {
    setSearchQuery(search);
  }, []);

  /**
   * Принудительное обновление списка
   */
  const refresh = useCallback(() => {
    if (currentUser) {
      loadTabs(searchQuery || undefined);
    }
  }, [currentUser, searchQuery, loadTabs]);

  /**
   * Переключение статуса избранного для табулатуры
   * 
   * @param tab - Табулатура
   * @returns true при успешном переключении
   */
  const toggleFavorite = useCallback(async (tab: PublicTab): Promise<boolean> => {
    if (!currentUser) return false;
    
    setProcessingId(tab.id);
    try {
      const isInFavorites = favoritesStatus.get(tab.id) || false;
      const success = isInFavorites 
        ? await removeFromFavorites(tab.id) 
        : await addToFavorites(tab.id);
      
      if (success && isMountedRef.current) {
        setFavoritesStatus(prev => new Map(prev).set(tab.id, !isInFavorites));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    } finally {
      if (isMountedRef.current) setProcessingId(null);
    }
  }, [favoritesStatus, currentUser]);

  return {
    tabs,
    isLoading,
    processingId,
    favoritesStatus,
    searchQuery,
    filterTabs,
    refresh,
    toggleFavorite,
  };
};