/**
 * @fileoverview Хук для управления навигацией и состоянием редактора.
 * 
 * @module hooks/useNavigation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TabData } from '../types/tab';

/**
 * Типы доступных вкладок приложения
 */
export type TabType = 'editor' | 'library' | 'public' | 'theory';

/**
 * Состояние редактора для сохранения между сессиями
 */
export interface EditorState {
  /** Данные табулатуры */
  tabData: TabData;
  /** Режим только для чтения */
  isReadOnly: boolean;
  /** Публичный статус */
  isPublic: boolean;
  /** Флаг новой табулатуры */
  isNewTab: boolean;
  /** Позиция курсора */
  cursor: any;
  /** Выбранный инструмент */
  selectedTool: string;
  /** Уровень масштабирования */
  zoom: number;
  /** Имя файла */
  fileName: string;
}

/**
 * Возвращаемое значение хука useNavigation
 */
interface UseNavigationReturn {
  /** Активная вкладка */
  activeTab: TabType;
  /** Установка активной вкладки */
  setActiveTab: (tab: TabType) => void;
  /** Данные выбранной табулатуры */
  selectedTabData: TabData | undefined;
  /** Триггер обновления библиотеки */
  refreshLibrary: boolean;
  /** Ключ для сброса редактора */
  editorResetKey: number;
  /** Сохранённое состояние редактора */
  savedEditorState: EditorState | null;
  /** Флаг необходимости восстановления состояния */
  shouldRestoreState: boolean;
  /** Сброс состояния редактора при смене пользователя */
  resetEditorForUser: (userId?: number) => void;
  /** Обработчик выбора табулатуры из публикаций */
  handleSelectFromPublic: (tabData: TabData) => void;
  /** Обработчик выбора табулатуры из библиотеки */
  handleSelectFromLibrary: (tabData: TabData) => void;
  /** Обработчик сохранения табулатуры */
  handleTabSaved: () => void;
  /** Обработчик изменения избранного */
  handleFavoritesChanged: () => void;
  /** Обработчик создания новой табулатуры */
  handleNewTabRequest: () => void;
  /** Обработчик изменения состояния редактора */
  handleEditorStateChange: (state: EditorState) => void;
  /** Обработчик изменения данных табулатуры */
  handleTabDataChange: () => void;
  /** Обработчик удаления табулатуры */
  handleTabDeleted: () => void;
}

/**
 * Хук для управления навигацией и состоянием редактора
 * 
 * @returns Объект с состоянием навигации и методами управления
 * 
 * @example
 * ```typescript
 * const {
 *   activeTab,
 *   setActiveTab,
 *   handleSelectFromPublic,
 *   handleNewTabRequest,
 *   // ... другие поля
 * } = useNavigation();
 * ```
 */
export const useNavigation = (): UseNavigationReturn => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [selectedTabData, setSelectedTabData] = useState<TabData | undefined>(undefined);
  const [refreshLibrary, setRefreshLibrary] = useState(false);
  const [editorResetKey, setEditorResetKey] = useState(() => Date.now());
  const [savedEditorState, setSavedEditorState] = useState<EditorState | null>(null);
  const [shouldRestoreState, setShouldRestoreState] = useState(true);
  
  // ID последнего пользователя для сброса состояния при смене пользователя
  const lastUserIdRef = useRef<number | undefined>(undefined);

  /**
   * Сброс состояния редактора при смене пользователя
   * 
   * @param userId - ID нового пользователя
   */
  const resetEditorForUser = useCallback((userId?: number) => {
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId;
      setEditorResetKey(Date.now());
      setSelectedTabData(undefined);
      setSavedEditorState(null);
      setShouldRestoreState(false);
    }
  }, []);

  // Обновление флага восстановления состояния при смене вкладки
  useEffect(() => {
    if (activeTab === 'editor') {
      setShouldRestoreState(!selectedTabData);
      if (selectedTabData) {
        setSavedEditorState(null);
      }
    }
  }, [activeTab, selectedTabData]);

  /**
   * Обработчик выбора табулатуры из публикаций
   * 
   * @param tabData - Данные выбранной табулатуры
   */
  const handleSelectFromPublic = useCallback((tabData: TabData) => {
    setSavedEditorState(null);
    setSelectedTabData(tabData);
    setEditorResetKey(Date.now());
    setShouldRestoreState(false);
    setActiveTab('editor');
  }, []);

  /**
   * Обработчик выбора табулатуры из библиотеки
   * 
   * @param tabData - Данные выбранной табулатуры
   */
  const handleSelectFromLibrary = useCallback((tabData: TabData) => {
    setSavedEditorState(null);
    setSelectedTabData(tabData);
    setEditorResetKey(Date.now());
    setShouldRestoreState(false);
    setActiveTab('editor');
  }, []);

  /**
   * Обработчик сохранения табулатуры
   */
  const handleTabSaved = useCallback(() => {
    setRefreshLibrary(prev => !prev);
  }, []);

  /**
   * Обработчик изменения избранного
   */
  const handleFavoritesChanged = useCallback(() => {
    setRefreshLibrary(prev => !prev);
  }, []);

  /**
   * Обработчик создания новой табулатуры
   */
  const handleNewTabRequest = useCallback(() => {
    setSelectedTabData(undefined);
    setSavedEditorState(null);
    setShouldRestoreState(false);
    setEditorResetKey(Date.now());
  }, []);

  /**
   * Обработчик изменения состояния редактора
   * 
   * @param state - Новое состояние редактора
   */
  const handleEditorStateChange = useCallback((state: EditorState) => {
    if (activeTab === 'editor' && !selectedTabData) {
      setSavedEditorState(state);
    }
  }, [activeTab, selectedTabData]);

  /**
   * Обработчик изменения данных табулатуры
   */
  const handleTabDataChange = useCallback(() => {
    setSelectedTabData(undefined);
  }, []);

  /**
   * Обработчик удаления табулатуры
   */
  const handleTabDeleted = useCallback(() => {
    setEditorResetKey(Date.now());
    setSelectedTabData(undefined);
    setSavedEditorState(null);
    setShouldRestoreState(false);
  }, []);

  return {
    activeTab,
    setActiveTab,
    selectedTabData,
    refreshLibrary,
    editorResetKey,
    savedEditorState,
    shouldRestoreState,
    resetEditorForUser,
    handleSelectFromPublic,
    handleSelectFromLibrary,
    handleTabSaved,
    handleFavoritesChanged,
    handleNewTabRequest,
    handleEditorStateChange,
    handleTabDataChange,
    handleTabDeleted,
  };
};