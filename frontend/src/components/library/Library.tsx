/**
 * @fileoverview Компонент библиотеки пользователя.
 * Отображает список табулатур пользователя и избранное, позволяет управлять ими.
 * 
 * @module components/library/Library
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Music, 
  Star, 
  FolderOpen, 
  Import,
  Heart, 
  Lock
} from 'lucide-react';
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
import './Library.css';

/**
 * Свойства компонента Library
 */
interface LibraryProps {
  /** Функция выбора табулатуры для редактирования */
  onSelectTab: (tabData: TabData) => void;
  /** Триггер обновления списка при изменении данных */
  refreshTrigger?: boolean;
  /** Функция обратного вызова при изменении избранного */
  onFavoritesChanged?: () => void;
  /** Функция обратного вызова при удалении табулатуры */
  onTabDeleted?: () => void;
}

/**
 * Компонент библиотеки пользователя.
 * Управляет отображением и действиями с табулатурами пользователя (свои и избранное).
 * Предоставляет поиск, импорт/экспорт, удаление и навигацию к редактору.
 * 
 * @component
 * @param props - Свойства компонента
 * @param props.onSelectTab - Функция выбора табулатуры для редактирования
 * @param props.refreshTrigger - Триггер обновления списка
 * @param props.onFavoritesChanged - Колбэк при изменении избранного
 * @param props.onTabDeleted - Колбэк при удалении табулатуры
 * @returns Отрисованный компонент библиотеки
 * 
 * @example
 * ```tsx
 * <Library 
 *   onSelectTab={(tabData) => openEditor(tabData)}
 *   refreshTrigger={shouldRefresh}
 *   onFavoritesChanged={() => updateFavoritesCount()}
 * />
 * ```
 */
const Library: React.FC<LibraryProps> = memo(({ 
  onSelectTab, 
  refreshTrigger, 
  onFavoritesChanged,
  onTabDeleted 
}) => {
  /** Активная секция: 'my' - мои табулатуры, 'favorites' - избранное */
  const [activeSection, setActiveSection] = useState<'my' | 'favorites'>('my');
  /** Текущий поисковый запрос */
  const [searchQuery, setSearchQuery] = useState<string>('');
  /** Выбранная табулатура для экспорта */
  const [selectedTabForExport, setSelectedTabForExport] = useState<TabData | null>(null);
  /** Флаг открытия модального окна экспорта */
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  /** Флаг открытия модального окна импорта */
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const { currentUser, isLoading: authLoading } = useAuth();
  const { 
    myTabs, 
    favorites, 
    isLoading, 
    processingId, 
    deleteMyTab, 
    removeFromFavs, 
    filterTabs, 
    refresh 
  } = useTabsLibrary();

  useEffect(() => {
    if (refreshTrigger && currentUser) {
      refresh();
    }
  }, [refreshTrigger, currentUser, refresh]);

  /**
   * Обработчик удаления своей табулатуры
   * 
   * @param id - ID удаляемой табулатуры
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
   * 
   * @param id - ID табулатуры для удаления из избранного
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
   * Обработчик редактирования табулатуры.
   * Преобразует LibraryItem в TabData и вызывает onSelectTab.
   * 
   * @param tab - Выбранная табулатура из библиотеки
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
   * Обработчик экспорта табулатуры.
   * Открывает модальное окно экспорта.
   * 
   * @param tab - Табулатура для экспорта
   */
  const handleExport = useCallback((tab: LibraryItem) => { 
    setSelectedTabForExport(tab.tabData); 
    setIsExportModalOpen(true); 
  }, []);

  /**
   * Обработчик успешного импорта.
   * Обновляет список и открывает импортированную табулатуру.
   * 
   * @param importedTab - Импортированная табулатура
   */
  const handleImportSuccess = useCallback((importedTab: TabData) => { 
    refresh(); 
    onSelectTab(importedTab); 
  }, [refresh, onSelectTab]);

  /**
   * Закрытие модального окна экспорта и очистка выбранной табулатуры
   */
  const handleCloseExportModal = useCallback(() => { 
    setIsExportModalOpen(false); 
    setSelectedTabForExport(null); 
  }, []);

  /**
   * Создание новой пустой табулатуры
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

  const filteredMyTabs = useMemo(() => filterTabs(myTabs, searchQuery), [myTabs, searchQuery, filterTabs]);
  const filteredFavorites = useMemo(() => filterTabs(favorites, searchQuery), [favorites, searchQuery, filterTabs]);
  const currentTabs = activeSection === 'my' ? filteredMyTabs : filteredFavorites;

  if (authLoading) {
    return <LoadingSpinner message="Проверка авторизации..." />;
  }

  if (!currentUser) {
    return (
      <EmptyState
        icon={<Lock size={48} />}
        title="Требуется авторизация"
        message="Пожалуйста, войдите в систему для доступа к библиотеке"
      />
    );
  }

  if (isLoading && myTabs.length === 0 && favorites.length === 0) {
    return <LoadingSpinner message="Загрузка библиотеки..." />;
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="library-header-content">
          <div className="library-header-left">
            <h2 className="library-title">БИБЛИОТЕКА</h2>
            <p className="library-subtitle">Управляйте своими табулатурами и избранным</p>
          </div>
          
          <button 
            className="library-import-btn" 
            onClick={() => setIsImportModalOpen(true)} 
            type="button"
            title="Импортировать табулатуру"
          >
            <Import size={22} />
          </button>
        </div>
      </div>

      <div className="library-view-tabs">
        <button 
          className={`view-tab ${activeSection === 'my' ? 'active' : ''}`} 
          onClick={() => setActiveSection('my')} 
          type="button"
          title="Мои табулатуры"
        >
          <FolderOpen size={20} />
          <span className="tab-count">{myTabs.length}</span>
        </button>
        <button 
          className={`view-tab ${activeSection === 'favorites' ? 'active' : ''}`} 
          onClick={() => setActiveSection('favorites')} 
          type="button"
          title="Избранное"
        >
          <Star size={20} />
          <span className="tab-count">{favorites.length}</span>
        </button>
      </div>

      <div className="library-search">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={`Поиск в ${activeSection === 'my' ? 'моих табулатурах' : 'избранном'}...`}
        />
        {searchQuery && (
          <div className="search-results-info">
            Найдено: {currentTabs.length} результатов по запросу "{searchQuery}"
          </div>
        )}
      </div>

      {currentTabs.length === 0 ? (
        <EmptyState
          icon={activeSection === 'my' ? <FolderOpen size={48} /> : <Heart size={48} />}
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
                onSelect={() => handleEdit(tab)}
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