/**
 * @fileoverview Компонент карточки табулатуры для отображения в списках библиотеки, избранного и публичных табулатур.
 * @module components/common/TabCard
 */

import React, { memo, useMemo, useCallback } from 'react';
import { 
  Guitar, 
  Trash2, 
  Download, 
  Loader2,
  Heart,
  X,
  Eye,
  FileText,
  User,
  UserCircle,
  Globe
} from 'lucide-react';
import { LibraryItem } from '../../services/libraryService';
import { PublicTab } from '../../services/publicTabsService';
import { formatDate } from '../../utils/dateUtils';
import { getPreviewText } from '../../utils/previewUtils';
import { 
  getTabTitle, 
  getTabArtist, 
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
  /** Данные табулатуры (из библиотеки или публичной коллекции) */
  tab: LibraryItem | PublicTab;
  /** Тип карточки: 'my' - мои табы, 'favorites' - избранное, 'public' - публичные табы */
  type: 'my' | 'favorites' | 'public';
  /** Обработчик выбора табулатуры (открытие) */
  onSelect?: (tab: LibraryItem | PublicTab) => void;
  /** Обработчик экспорта/скачивания табулатуры */
  onExport?: (tab: LibraryItem | PublicTab) => void;
  /** Обработчик удаления табулатуры (только для своих) */
  onDelete?: (id: number) => void;
  /** Обработчик удаления из избранного */
  onRemoveFromFavorites?: (id: number) => void;
  /** Обработчик добавления в избранное (для публичных табулатур) */
  onAddToFavorites?: (tab: PublicTab) => void;
  /** ID табулатуры, которая сейчас обрабатывается (для отображения спиннера) */
  processingId?: number | null;
  /** Имя оригинального автора (для избранного) */
  originalAuthor?: string;
  /** Флаг, находится ли табулатура в избранном (для публичных табов) */
  isInFavorites?: boolean;
  /** Флаг, является ли табулатура своей (для публичных табов) */
  isOwn?: boolean;
}

/**
 * Компонент карточки табулатуры.
 * Отображает информацию о табулатуре: название, исполнителя, дату, превью, а также кнопки действий.
 * Поддерживает три режима: мои табы, избранное и публичные табы.
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованная карточка табулатуры
 * 
 * @example
 * ```tsx
 * // Для своих табулатур
 * <TabCard 
 *   tab={myTab} 
 *   type="my" 
 *   onSelect={handleOpen} 
 *   onExport={handleExport}
 *   onDelete={handleDelete}
 * />
 * 
 * // Для публичных табулатур
 * <TabCard 
 *   tab={publicTab} 
 *   type="public" 
 *   onAddToFavorites={handleAddToFav}
 *   isInFavorites={isFav}
 *   isOwn={isOwn}
 * />
 * ```
 */
const TabCard: React.FC<TabCardProps> = memo(({
  tab, 
  type, 
  onSelect, 
  onExport, 
  onDelete, 
  onRemoveFromFavorites, 
  onAddToFavorites,
  processingId, 
  originalAuthor, 
  isInFavorites = false, 
  isOwn = false,
}) => {
  const tabId = useMemo(() => getTabId(tab), [tab]);
  const title = useMemo(() => getTabTitle(tab), [tab]);
  const artist = useMemo(() => getTabArtist(tab), [tab]);
  const date = useMemo(() => getTabDate(tab, type), [tab, type]);
  const preview = useMemo(() => getTabPreview(tab), [tab]);
  const isTabPublic = useMemo(() => getIsPublicFromTab(tab), [tab]);

  const isMyTab = type === 'my';
  const isFav = type === 'favorites';
  const isPublic = type === 'public';
  const isProcessing = processingId === tabId;

  /**
   * Конфигурация бейджа видимости табулатуры.
   * Возвращает иконку, текст и CSS-класс для отображения статуса (опубликовано/черновик/ваша публикация).
   */
  const visibilityConfig = useMemo(() => {
    if (isPublic && isOwn) {
      return {
        icon: <UserCircle size={14} />,
        text: 'Ваша публикация',
        className: 'own-publication'
      };
    }
    if (isMyTab) {
      if (isTabPublic) {
        return {
          icon: <Globe size={14} />,
          text: 'Опубликовано',
          className: 'public'
        };
      } else {
        return {
          icon: <FileText size={14} />,
          text: 'Черновик',
          className: 'private'
        };
      }
    }
    return null;
  }, [isPublic, isOwn, isMyTab, isTabPublic]);

  /** Имя автора для отображения (для избранного и публичных табов) */
  const authorName = useMemo(() => {
    if (isFav && originalAuthor) return originalAuthor;
    if (isPublic && !isOwn && 'authorName' in tab && tab.authorName) return tab.authorName;
    return null;
  }, [isFav, originalAuthor, isPublic, isOwn, tab]);

  const handleCardClick = useCallback(() => {
    onSelect?.(tab);
  }, [onSelect, tab]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExport?.(tab);
  }, [onExport, tab]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(tabId);
  }, [onDelete, tabId]);

  const handleRemoveFromFavorites = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveFromFavorites?.(tabId);
  }, [onRemoveFromFavorites, tabId]);

  const handleAddToFavorites = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPublicTab(tab)) onAddToFavorites?.(tab);
  }, [onAddToFavorites, tab]);

  const showFavoriteBtn = isPublic && !isOwn && onAddToFavorites;
  const showRemoveFromFavBtn = isFav && onRemoveFromFavorites;
  const showDeleteBtn = isMyTab && onDelete;
  const showExportBtn = onExport && type !== 'public';

  return (
    <div className="tab-card-wrapper">
      <div 
        className="library-card clickable" 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Открыть ${title}`}
      >
        <div className="card-info">
          <div className="card-left">
            <div className="card-icon" aria-hidden="true">
              <Guitar size={40} />
            </div>
            <div className="card-details">
              <h3 className="card-title">{title}</h3>
              <div className="card-metadata">
                {artist && <span className="card-artist">{artist}</span>}
                <span className="card-date">
                  {isMyTab ? 'Создано:' : 'Опубликовано:'} {formatDate(date)}
                </span>
              </div>
              <div className="card-preview-mobile">
                <code className="preview-content-mobile">{getPreviewText(preview)}</code>
              </div>
            </div>
          </div>
          
          <div className="card-right">
            {authorName && (
              <div className="card-author" title={`Автор: ${authorName}`}>
                <User size={12} />
                <span className="author-name">{authorName}</span>
              </div>
            )}
            {visibilityConfig && (
              <div className={`visibility-badge ${visibilityConfig.className}`} title={visibilityConfig.text}>
                {visibilityConfig.icon}
                <span>{visibilityConfig.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-actions-side">
        {showFavoriteBtn && (
          <button 
            className={`nav-btn favorites-btn ${isInFavorites ? 'in-favorites' : ''}`} 
            onClick={handleAddToFavorites} 
            disabled={isProcessing} 
            type="button"
            title={isInFavorites ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Heart size={20} fill={isInFavorites ? 'currentColor' : 'none'} />
          </button>
        )}

        {showRemoveFromFavBtn && (
          <button 
            className="nav-btn remove-btn" 
            onClick={handleRemoveFromFavorites} 
            disabled={isProcessing} 
            type="button"
            title="Удалить из избранного"
          >
            {isProcessing ? <Loader2 size={20} className="spinner" /> : <X size={20} />}
          </button>
        )}

        {showDeleteBtn && (
          <button 
            className="nav-btn delete-btn" 
            onClick={handleDelete} 
            disabled={isProcessing} 
            type="button"
            title="Удалить табулатуру"
          >
            {isProcessing ? <Loader2 size={20} className="spinner" /> : <Trash2 size={20} />}
          </button>
        )}

        {showExportBtn && (
          <button 
            className="nav-btn export-btn" 
            onClick={handleExport} 
            type="button"
            title="Скачать табулатуру"
          >
            <Download size={20} />
          </button>
        )}
      </div>
    </div>
  );
});

TabCard.displayName = 'TabCard';
export default TabCard;