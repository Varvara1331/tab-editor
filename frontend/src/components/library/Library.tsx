/**
 * @fileoverview Компонент библиотеки пользователя.
 * Отображает список табулатур пользователя и избранное, позволяет управлять ими.
 * 
 * @module components/library/Library
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LibraryItem } from '../../services/libraryService';
import { TabData } from '../../types/tab';
import { useTabsLibrary } from '../../hooks/useTabsLibrary';
import { useAuth } from '../../hooks/useAuth';
import ExportModal from '../modals/ExportModal';
import ImportModal from '../modals/ImportModal';
import SearchBar from '../common/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import TabCard from '../common/TabCard';

/**
 * Свойства компонента Library
 */
interface LibraryProps {
  /** Функция выбора табулатуры для редактирования */
  onSelectTab: (tabData: TabData) => void;
  /** Триггер обновления списка (при изменении) */
  refreshTrigger?: boolean;
  /** Функция обратного вызова при изменении избранного */
  onFavoritesChanged?: () => void;
  /** Функция обратного вызова при удалении табулатуры */
  onTabDeleted?: () => void;
}

/**
 * Компонент библиотеки пользователя
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент библиотеки
 * 
 * @example
 * ```typescript
 * <Library 
 *   onSelectTab={(tabData) => openEditor(tabData)}
 *   refreshTrigger={refreshFlag}
 *   onFavoritesChanged={() => updateFavorites()}
 * />
 * ```
 */
const Library: React.FC<LibraryProps> = memo(({ 
  onSelectTab, 
  refreshTrigger, 
  onFavoritesChanged,
  onTabDeleted 
}) => {
  // Состояния компонента
  const [activeSection, setActiveSection] = useState<'my' | 'favorites'>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTabForExport, setSelectedTabForExport] = useState<TabData | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Хуки (должны быть вызваны до любых условных возвратов)
  const { currentUser, isLoading: authLoading } = useAuth();
  const { 
    myTabs, 
    favorites, 
    isLoading, 
    processingId, 
    loadTabs, 
    deleteMyTab, 
    removeFromFavs, 
    filterTabs, 
    refresh 
  } = useTabsLibrary();

  // Обновление при изменении refreshTrigger (например, после сохранения)
  useEffect(() => {
    if (refreshTrigger && currentUser) {
      refresh();
    }
  }, [refreshTrigger, currentUser, refresh]);

  /**
   * Обработчик удаления своей табулатуры
   */
  const handleDeleteMyTab = useCallback(async (id: number) => {
    if (!window.confirm('Удалить эту табулатуру? Она будет удалена безвозвратно.')) return;
    
    const success = await deleteMyTab(id);
    if (success) {
      alert('Табулатура удалена');
      onTabDeleted?.();
    } else {
      alert('Не удалось удалить табулатуру');
    }
  }, [deleteMyTab, onTabDeleted]);

  /**
   * Обработчик удаления табулатуры из избранного
   */
  const handleRemoveFromFavorites = useCallback(async (id: number) => {
    if (!window.confirm('Удалить эту табулатуру из избранного?')) return;
    
    const success = await removeFromFavs(id);
    if (success) {
      onFavoritesChanged?.();
      alert('Табулатура удалена из избранного');
    } else {
      alert('Не удалось удалить из избранного');
    }
  }, [removeFromFavs, onFavoritesChanged]);

  /**
   * Обработчик редактирования табулатуры
   */
  const handleEdit = useCallback((tab: LibraryItem) => {
    const isOwn = activeSection === 'my';
    const tabDataToOpen: TabData = { 
      ...tab.tabData, 
      isOwn: isOwn, 
      userId: activeSection === 'favorites' ? -1 : tab.tabData.userId, 
      isPublic: activeSection === 'favorites' ? true : tab.tabData.isPublic,
      notesPerMeasure: tab.tabData.notesPerMeasure || 16
    };
    onSelectTab(tabDataToOpen);
  }, [activeSection, onSelectTab]);

  /**
   * Обработчик экспорта табулатуры
   */
  const handleExport = useCallback((tab: LibraryItem) => { 
    setSelectedTabForExport(tab.tabData); 
    setIsExportModalOpen(true); 
  }, []);

  /**
   * Обработчик успешного импорта
   */
  const handleImportSuccess = useCallback((importedTab: TabData) => { 
    refresh(); 
    onSelectTab(importedTab); 
  }, [refresh, onSelectTab]);

  /**
   * Закрытие модального окна экспорта
   */
  const handleCloseExportModal = useCallback(() => { 
    setIsExportModalOpen(false); 
    setSelectedTabForExport(null); 
  }, []);

  /**
   * Создание новой табулатуры
   */
  const handleNewTab = useCallback(() => { 
    onSelectTab({
      id: undefined,
      title: 'Новая табулатура',
      artist: '',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [],
      notesPerMeasure: 16,
      isOwn: true,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as TabData); 
  }, [onSelectTab]);

  // Мемоизированные отфильтрованные списки
  const filteredMyTabs = useMemo(() => filterTabs(myTabs, searchQuery), [myTabs, searchQuery, filterTabs]);
  const filteredFavorites = useMemo(() => filterTabs(favorites, searchQuery), [favorites, searchQuery, filterTabs]);
  const currentTabs = activeSection === 'my' ? filteredMyTabs : filteredFavorites;

  // Условные возвраты (только после всех хуков)
  
  // Загрузка аутентификации
  if (authLoading) {
    return (
      <div className="library-page">
        <div className="library-container">
          <LoadingSpinner message="Проверка авторизации..." />
        </div>
      </div>
    );
  }

  // Не авторизован
  if (!currentUser) {
    return (
      <div className="library-page">
        <div className="library-container">
          <EmptyState
            icon="🔒"
            title="Требуется авторизация"
            message="Пожалуйста, войдите в систему для доступа к библиотеке"
          />
        </div>
      </div>
    );
  }

  // Загрузка данных
  if (isLoading) {
    return (
      <div className="library-page">
        <div className="library-container">
          <div className="library-header">
            <h2>📚 Библиотека</h2>
            <p>Ваши табулатуры и избранное</p>
          </div>
          <div className="library-loading">
            <LoadingSpinner message="Загрузка библиотеки..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-container">
        {/* Заголовок */}
        <div className="library-header">
          <div className="header-title">
            <h2>📚 Моя библиотека</h2>
            <p>Управляйте своими табулатурами и избранным</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-import" 
              onClick={() => setIsImportModalOpen(true)} 
              title="Импортировать табулатуру из файла" 
              type="button"
            >
              📂 Импорт
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="library-stats">
          <div className="stat-card">
            <div className="stat-icon" aria-hidden="true">🎸</div>
            <div className="stat-info">
              <div className="stat-value">{myTabs.length}</div>
              <div className="stat-label">Мои табулатуры</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" aria-hidden="true">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{favorites.length}</div>
              <div className="stat-label">В избранном</div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="library-tabs">
          <button 
            className={`section-tab ${activeSection === 'my' ? 'active' : ''}`} 
            onClick={() => setActiveSection('my')} 
            type="button"
          >
            🎸 Мои табулатуры
            <span className="tab-count">{myTabs.length}</span>
          </button>
          <button 
            className={`section-tab ${activeSection === 'favorites' ? 'active' : ''}`} 
            onClick={() => setActiveSection('favorites')} 
            type="button"
          >
            ⭐ Избранное
            <span className="tab-count">{favorites.length}</span>
          </button>
        </div>

        {/* Поиск */}
        <div className="library-search">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder={`Поиск в ${activeSection === 'my' ? 'моих табулатурах' : 'избранном'}...`}
          />
        </div>

        {/* Список табулатур */}
        {currentTabs.length === 0 ? (
          <EmptyState
            icon={activeSection === 'my' ? '🎸' : '⭐'}
            title={activeSection === 'my' ? 'У вас пока нет табулатур' : 'Избранное пусто'}
            message={
              activeSection === 'my' 
                ? 'Создайте новую табулатуру в редакторе, импортируйте из файла или добавьте из публикаций' 
                : 'Добавляйте понравившиеся табулатуры из раздела "Публикации"'
            }
            action={activeSection === 'my' ? {
              label: 'Создать новую табулатуру',
              onClick: handleNewTab
            } : undefined}
          />
        ) : (
          <div className="library-grid">
            {currentTabs.map((tab: LibraryItem) => {
              const isOwn = activeSection === 'my';
              const isFav = activeSection === 'favorites';
              return (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  type={activeSection}
                  onEdit={() => handleEdit(tab)}
                  onExport={() => handleExport(tab)}
                  onDelete={isOwn ? handleDeleteMyTab : undefined}
                  onRemoveFromFavorites={isFav ? handleRemoveFromFavorites : undefined}
                  processingId={processingId}
                  originalAuthor={isFav ? tab.originalAuthor : undefined}
                  isOwn={isOwn}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      {selectedTabForExport && (
        <ExportModal
          tabData={selectedTabForExport}
          isOpen={isExportModalOpen}
          onClose={handleCloseExportModal}
        />
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
});

Library.displayName = 'Library';
export default Library;