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
import { 
  Globe
} from 'lucide-react';

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
 * Компонент списка публичных табулатур.
 * Отображает табулатуры, опубликованные другими пользователями.
 * Предоставляет поиск, добавление в избранное, предпросмотр с проигрывателем и экспорт.
 * 
 * @component
 * @param props - Свойства компонента
 * @param props.onSelectTab - Функция выбора табулатуры для редактирования
 * @param props.onFavoritesChanged - Колбэк при изменении избранного
 * @returns Отрисованный компонент списка публичных табулатур
 * 
 * @example
 * ```tsx
 * <PublicTabs 
 *   onSelectTab={(tabData) => openEditor(tabData)}
 *   onFavoritesChanged={() => updateFavoritesCount()}
 * />
 * ```
 */
const PublicTabs: React.FC<PublicTabsProps> = memo(({ onSelectTab, onFavoritesChanged }) => {
  /** Выбранная табулатура для предпросмотра */
  const [selectedTab, setSelectedTab] = useState<PublicTab | null>(null);
  /** Флаг открытия модального окна экспорта */
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  /** Данные табулатуры для экспорта */
  const [exportTabData, setExportTabData] = useState<TabData | null>(null);

  const { currentUser, isLoading: authLoading } = useAuth();
  const { 
    tabs, 
    isLoading, 
    processingId, 
    favoritesStatus, 
    searchQuery, 
    toggleFavorite, 
    filterTabs 
  } = usePublicTabs();

  /**
   * Преобразует публичную табулатуру в формат TabData для редактора
   * 
   * @param tab - Публичная табулатура
   * @returns Табулатура в формате TabData
   */
  const transformTab = useCallback((tab: PublicTab) => {
    return transformPublicTabToTabData(tab, currentUser?.id);
  }, [currentUser?.id]);

  /**
   * Обработчик просмотра табулатуры в редакторе
   * 
   * @param tab - Выбранная публичная табулатура
   */
  const handleViewInEditor = useCallback((tab: PublicTab) => { 
    onSelectTab(transformTab(tab)); 
    setSelectedTab(tab); 
  }, [transformTab, onSelectTab]);

  /**
   * Обработчик экспорта табулатуры (через модальное окно предпросмотра)
   * 
   * @param tab - Табулатура для экспорта
   */
  const handleExport = useCallback((tab: PublicTab) => { 
    setExportTabData(transformTab(tab)); 
    setIsExportModalOpen(true); 
  }, [transformTab]);

  /**
   * Обработчик переключения статуса избранного (добавить/удалить)
   * 
   * @param tab - Табулатура для добавления/удаления из избранного
   */
  const handleToggleFavorite = useCallback(async (tab: PublicTab) => {
    const success = await toggleFavorite(tab);
    
    if (success) { 
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
   * Закрытие панели предпросмотра табулатуры
   */
  const handleClosePreview = useCallback(() => setSelectedTab(null), []);

  /**
   * Закрытие модального окна экспорта и очистка данных
   */
  const handleCloseExportModal = useCallback(() => { 
    setIsExportModalOpen(false); 
    setExportTabData(null); 
  }, []);

  /**
   * Данные табулатуры для отображения в панели предпросмотра
   */
  const previewTabData = useMemo(() => {
    return selectedTab ? transformTab(selectedTab) : null;
  }, [selectedTab, transformTab]);

  if (authLoading) {
    return <LoadingSpinner message="Проверка авторизации..." />;
  }

  if (isLoading && tabs.length === 0) {
    return <LoadingSpinner message="Загрузка публикаций..." />;
  }

  return (
    <div className="public-tabs-container">
      <div className="public-tabs-header">
        <h2 className="public-tabs-title">ПУБЛИКАЦИИ</h2>
        <p className="public-tabs-subtitle">Табулатуры, опубликованные другими пользователями</p>
      </div>

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

      {tabs.length === 0 && !isLoading ? (
        <EmptyState
          icon=<Globe size={24} />
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
                onSelect={() => handleViewInEditor(tab)}
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