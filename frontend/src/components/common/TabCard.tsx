/**
 * @fileoverview Компонент карточки табулатуры.
 * Отображает информацию о табулатуре и предоставляет действия (редактирование, экспорт, удаление).
 * 
 * @module components/common/TabCard
 */

import React, { memo, useMemo, useCallback } from 'react';
import { LibraryItem } from '../../services/libraryService';
import { PublicTab } from '../../services/publicTabsService';
import { formatDate } from '../../utils/dateUtils';
import { getPreviewText } from '../../utils/previewUtils';
import { 
  getTabTitle, 
  getTabArtist, 
  getTabTuning, 
  getTabMeasures, 
  getTabDate, 
  getTabPreview, 
  getIsPublicFromTab, 
  getTabId, 
  isPublicTab 
} from '../../utils/tabHelpers';

/**
 * Свойства компонента TabCard
 */
interface TabCardProps {
  /** Данные табулатуры (библиотека или публичная) */
  tab: LibraryItem | PublicTab;
  /** Тип отображения */
  type: 'my' | 'favorites' | 'public';
  /** Обработчик редактирования/просмотра */
  onEdit?: (tab: LibraryItem | PublicTab) => void;
  /** Обработчик экспорта */
  onExport?: (tab: LibraryItem | PublicTab) => void;
  /** Обработчик удаления (для своих табулатур) */
  onDelete?: (id: number) => void;
  /** Обработчик удаления из избранного */
  onRemoveFromFavorites?: (id: number) => void;
  /** Обработчик добавления в избранное */
  onAddToFavorites?: (tab: PublicTab) => void;
  /** ID табулатуры, над которой выполняется операция (для индикации загрузки) */
  processingId?: number | null;
  /** Оригинальный автор (для избранного) */
  originalAuthor?: string;
  /** Находится ли в избранном (для публичных табулатур) */
  isInFavorites?: boolean;
  /** Принадлежит ли текущему пользователю (для публичных табулатур) */
  isOwn?: boolean;
}

/**
 * Компонент карточки табулатуры.
 * Отображает информацию и действия для табулатуры в зависимости от типа.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованная карточка табулатуры
 * 
 * @example
 * ```typescript
 * <TabCard
 *   tab={myTab}
 *   type="my"
 *   onEdit={() => editTab(myTab)}
 *   onExport={() => exportTab(myTab)}
 *   onDelete={(id) => deleteTab(id)}
 * />
 * ```
 */
const TabCard: React.FC<TabCardProps> = memo(({
  tab, 
  type, 
  onEdit, 
  onExport, 
  onDelete, 
  onRemoveFromFavorites, 
  onAddToFavorites,
  processingId, 
  originalAuthor, 
  isInFavorites = false, 
  isOwn = false,
}) => {
  // Вычисляемые значения
  const tabId = useMemo(() => getTabId(tab), [tab]);
  const title = useMemo(() => getTabTitle(tab), [tab]);
  const artist = useMemo(() => getTabArtist(tab), [tab]);
  const tuningLength = useMemo(() => getTabTuning(tab).length, [tab]);
  const measuresLength = useMemo(() => getTabMeasures(tab).length, [tab]);
  const date = useMemo(() => getTabDate(tab, type), [tab, type]);
  const preview = useMemo(() => getTabPreview(tab), [tab]);
  const isTabPublic = useMemo(() => getIsPublicFromTab(tab), [tab]);

  // Флаги типов и состояния
  const isMyTab = type === 'my';
  const isFav = type === 'favorites';
  const isPublic = type === 'public';
  const isProcessing = processingId === tabId;

  /**
   * Текст бейджа видимости
   */
  const visibilityBadgeText = useMemo(() => {
    if (isPublic && isOwn) return '👤 Ваша публикация';
    if (isMyTab) return isTabPublic ? '🌍 Опубликовано' : '🔒 Черновик';
    return null;
  }, [isPublic, isOwn, isMyTab, isTabPublic]);

  /**
   * Теги табулатуры (только для публичных)
   */
  const tags = useMemo(() => {
    return (isPublic && 'tags' in tab && tab.tags) ? tab.tags : null;
  }, [isPublic, tab]);

  // Обработчики действий
  const handleEdit = useCallback(() => onEdit?.(tab), [onEdit, tab]);
  const handleExport = useCallback(() => onExport?.(tab), [onExport, tab]);
  const handleDelete = useCallback(() => onDelete?.(tabId), [onDelete, tabId]);
  const handleRemoveFromFavorites = useCallback(() => onRemoveFromFavorites?.(tabId), [onRemoveFromFavorites, tabId]);
  const handleAddToFavorites = useCallback(() => {
    if (isPublicTab(tab)) onAddToFavorites?.(tab);
  }, [onAddToFavorites, tab]);

  return (
    <div className="library-card">
      {/* Заголовок карточки */}
      <div className="card-header">
        <div className="card-icon" aria-hidden="true">🎸</div>
        <div className="card-title-section">
          <h3>{title}</h3>
          {artist && <p className="card-artist">{artist}</p>}
        </div>
        
        {/* Бейдж автора для избранного */}
        {isFav && originalAuthor && (
          <div className="author-badge" title={`Автор: ${originalAuthor}`}>
            👤 {originalAuthor}
          </div>
        )}
        
        {/* Бейдж видимости */}
        {visibilityBadgeText && (
          <div className={`visibility-badge ${isPublic && isOwn ? 'own-publication' : (isTabPublic ? 'public' : 'private')}`}>
            {visibilityBadgeText}
          </div>
        )}
        
        {/* Бейдж автора для публичных табулатур */}
        {isPublic && !isOwn && 'authorName' in tab && tab.authorName && (
          <div className="author-badge">👤 {tab.authorName}</div>
        )}
      </div>

      {/* Тело карточки */}
      <div className="card-body">
        <div className="card-meta">
          <span className="meta-item">
            <span className="meta-label">Струн:</span>
            <span className="meta-value">{tuningLength}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Тактов:</span>
            <span className="meta-value">{measuresLength}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">{isMyTab ? 'Создано:' : 'Добавлено:'}</span>
            <span className="meta-value">{formatDate(date)}</span>
          </span>
        </div>
        
        <div className="card-preview">
          <span className="preview-label">Превью:</span>
          <code className="preview-content">{getPreviewText(preview)}</code>
        </div>
        
        {/* Теги */}
        {tags && tags.length > 0 && (
          <div className="tab-tags">
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag">#{tag}</span>
            ))}
            {tags.length > 3 && (
              <span className="tag-more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Действия */}
      <div className="card-actions">
        {onEdit && (
          <button 
            className="action-btn edit-btn" 
            onClick={handleEdit} 
            type="button"
            aria-label={isMyTab || isOwn ? 'Редактировать табулатуру' : 'Просмотреть табулатуру'}
          >
            {isMyTab || isOwn ? '✏️ Редактировать' : '📖 Просмотр'}
          </button>
        )}
        
        {onExport && (
          <button 
            className="action-btn export-btn" 
            onClick={handleExport} 
            type="button"
            aria-label="Экспортировать табулатуру"
          >
            ⬇️ Экспорт
          </button>
        )}
        
        {isMyTab && onDelete && (
          <button 
            className="action-btn delete-btn" 
            onClick={handleDelete} 
            disabled={isProcessing} 
            type="button"
            aria-label="Удалить табулатуру"
          >
            {isProcessing ? '⏳' : '🗑️ Удалить'}
          </button>
        )}
        
        {isFav && onRemoveFromFavorites && (
          <button 
            className="action-btn remove-btn" 
            onClick={handleRemoveFromFavorites} 
            disabled={isProcessing} 
            type="button"
            aria-label="Удалить из избранного"
          >
            {isProcessing ? '⏳' : '⭐ Удалить из избранного'}
          </button>
        )}
        
        {isPublic && !isOwn && onAddToFavorites && (
          <button 
            className={`action-btn favorites-btn ${isInFavorites ? 'in-favorites' : ''}`} 
            onClick={handleAddToFavorites} 
            disabled={isProcessing} 
            type="button"
            aria-label={isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            {isProcessing ? '⏳' : (isInFavorites ? '⭐ В избранном' : '☆ В избранное')}
          </button>
        )}
      </div>
    </div>
  );
});

TabCard.displayName = 'TabCard';

export default TabCard;