/**
 * @fileoverview Компонент списка публичных табулатур.
 * Отображает табулатуры, опубликованные другими пользователями,
 * позволяет добавлять их в избранное и просматривать.
 * 
 * @module components/public/PublicTabs
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { PublicTab } from '../../services/publicTabsService';
import { TabData } from '../../types/tab';
import { usePublicTabs } from '../../hooks/usePublicTabs';
import { transformPublicTabToTabData } from '../../utils/tabTransformers';
import { useAuth } from '../../hooks/useAuth';
import TabPlayer from '../editor/TabPlayer';
import ExportModal from '../modals/ExportModal';
import TabCard from '../common/TabCard';
import SearchBar from '../common/SearchBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import '../library/Library.css';

/**
 * Свойства компонента PublicTabs
 */
interface PublicTabsProps {
  /** Функция выбора табулатуры для редактирования */
  onSelectTab: (tabData: TabData) => void;
  /** Функция обратного вызова при изменении избранного */
  onFavoritesChanged?: () => void;
}

/**
 * Компонент списка публичных табулатур
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент публичных табулатур
 * 
 * @example
 * ```typescript
 * <PublicTabs 
 *   onSelectTab={(tabData) => openEditor(tabData)}
 *   onFavoritesChanged={() => updateLibrary()}
 * />
 * ```
 */
const PublicTabs: React.FC<PublicTabsProps> = memo(({ onSelectTab, onFavoritesChanged }) => {
  // Состояния компонента
  const [selectedTab, setSelectedTab] = useState<PublicTab | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTabData, setExportTabData] = useState<TabData | null>(null);

  // Хуки (должны быть вызваны до любых условных возвратов)
  const { currentUser, isLoading: authLoading } = useAuth();
  const { 
    tabs, 
    isLoading, 
    processingId, 
    favoritesStatus, 
    searchQuery, 
    toggleFavorite, 
    filterTabs, 
    refresh 
  } = usePublicTabs();

  /**
   * Преобразование публичной табулатуры в формат TabData
   */
  const transformTab = useCallback((tab: PublicTab) => {
    return transformPublicTabToTabData(tab, currentUser?.id);
  }, [currentUser?.id]);

  /**
   * Обработчик просмотра табулатуры в редакторе
   */
  const handleViewInEditor = useCallback((tab: PublicTab) => { 
    onSelectTab(transformTab(tab)); 
    setSelectedTab(tab); 
  }, [transformTab, onSelectTab]);

  /**
   * Обработчик экспорта табулатуры
   */
  const handleExport = useCallback((tab: PublicTab) => { 
    setExportTabData(transformTab(tab)); 
    setIsExportModalOpen(true); 
  }, [transformTab]);

  /**
   * Обработчик переключения статуса избранного
   */
  const handleToggleFavorite = useCallback(async (tab: PublicTab) => {
    const success = await toggleFavorite(tab);
    
    if (success) { 
      const message = favoritesStatus.get(tab.id) 
        ? 'Табулатура удалена из избранного' 
        : 'Табулатура добавлена в избранное';
      alert(message); 
      onFavoritesChanged?.(); 
    } else { 
      alert('Не удалось выполнить действие'); 
    }
  }, [toggleFavorite, favoritesStatus, onFavoritesChanged]);

  /**
   * Очистка поискового запроса
   */
  const handleClearSearch = useCallback(() => filterTabs(''), [filterTabs]);

  /**
   * Закрытие панели предпросмотра
   */
  const handleClosePreview = useCallback(() => setSelectedTab(null), []);

  /**
   * Закрытие модального окна экспорта
   */
  const handleCloseExportModal = useCallback(() => { 
    setIsExportModalOpen(false); 
    setExportTabData(null); 
  }, []);

  /**
   * Данные табулатуры для предпросмотра
   */
  const previewTabData = useMemo(() => {
    return selectedTab ? transformTab(selectedTab) : null;
  }, [selectedTab, transformTab]);

  // Условные возвраты (только после всех хуков)

  // Загрузка аутентификации
  if (authLoading) {
    return <LoadingSpinner message="Проверка авторизации..." />;
  }

  // Первичная загрузка данных
  if (isLoading && tabs.length === 0) {
    return <LoadingSpinner message="Загрузка публикаций..." />;
  }

  return (
    <div className="public-tabs-container">
      {/* Заголовок */}
      <div className="public-tabs-header">
        <h2>🌍 Публикации</h2>
        <p>Табулатуры, опубликованные другими пользователями</p>
      </div>

      {/* Поиск */}
      <div className="public-tabs-search">
        <SearchBar 
          value={searchQuery}
          onChange={filterTabs}
          onClear={handleClearSearch}
          placeholder="Поиск публикаций по названию или исполнителю..."
          debounceDelay={500}
        />
        {searchQuery && !isLoading && (
          <div className="search-results-info">
            Найдено: {tabs.length} результатов по запросу "{searchQuery}"
          </div>
        )}
      </div>

      {/* Панель предпросмотра */}
      {selectedTab && previewTabData && (
        <div className="public-tab-preview">
          <div className="preview-header">
            <h3>{selectedTab.title}</h3>
            <button 
              className="close-preview" 
              onClick={handleClosePreview} 
              type="button"
              aria-label="Закрыть предпросмотр"
            >
              ×
            </button>
          </div>
          <div className="preview-player">
            <TabPlayer tabData={previewTabData} />
          </div>
        </div>
      )}

      {/* Список публикаций */}
      {tabs.length === 0 && !isLoading ? (
        <EmptyState
          icon="🌍"
          title={searchQuery ? "Ничего не найдено" : "Публикаций не найдено"}
          message={searchQuery 
            ? `По запросу "${searchQuery}" ничего не найдено. Попробуйте изменить поисковый запрос.`
            : 'Пока нет опубликованных табулатур. Зайдите в редактор и опубликуйте свою табулатуру!'}
          action={searchQuery ? {
            label: 'Очистить поиск',
            onClick: handleClearSearch
          } : undefined}
        />
      ) : (
        <div className="public-tabs-grid">
          {tabs.map(tab => {
            const isOwn = tab.userId === currentUser?.id;
            const isInFavorites = favoritesStatus.get(tab.id) || false;
            
            return (
              <TabCard
                key={tab.id}
                tab={tab}
                type="public"
                onEdit={() => handleViewInEditor(tab)}
                onExport={() => handleExport(tab)}
                onAddToFavorites={() => handleToggleFavorite(tab)}
                onRemoveFromFavorites={() => handleToggleFavorite(tab)}
                processingId={processingId}
                isInFavorites={isInFavorites}
                isOwn={isOwn}
              />
            );
          })}
        </div>
      )}

      {/* Модальное окно экспорта */}
      {exportTabData && (
        <ExportModal
          tabData={exportTabData}
          isOpen={isExportModalOpen}
          onClose={handleCloseExportModal}
        />
      )}
    </div>
  );
});

PublicTabs.displayName = 'PublicTabs';
export default PublicTabs;