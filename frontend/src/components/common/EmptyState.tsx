/**
 * @fileoverview Компонент пустого состояния.
 * Отображается, когда список данных пуст, с иконкой, заголовком и сообщением.
 * 
 * @module components/common/EmptyState
 */

import React, { memo } from 'react';

/**
 * Свойства компонента EmptyState
 */
interface EmptyStateProps {
  /** Иконка (React-узел, например SVG иконка из lucide-react) */
  icon: React.ReactNode;
  /** Заголовок сообщения */
  title: string;
  /** Текст сообщения */
  message: string;
  /** Действие (кнопка) для выполнения */
  action?: { label: string; onClick: () => void };
}

/**
 * Компонент пустого состояния.
 * Используется для отображения информационного сообщения, когда данные отсутствуют.
 * Поддерживает опциональную кнопку действия.
 * 
 * @component
 * @param props - Свойства компонента
 * @param props.icon - Иконка для отображения
 * @param props.title - Заголовок сообщения
 * @param props.message - Текст сообщения
 * @param props.action - Опциональное действие (кнопка)
 * @returns Отрисованный компонент пустого состояния
 * 
 * @example
 * ```tsx
 * import { FolderOpen } from 'lucide-react';
 * 
 * <EmptyState
 *   icon={<FolderOpen size={48} />}
 *   title="Нет табулатур"
 *   message="Создайте свою первую табулатуру"
 *   action={{ label: "Создать", onClick: handleCreate }}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = memo(({ icon, title, message, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon" role="img" aria-label={title}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && (
        <button className="action-btn" onClick={action.onClick} type="button">
          {action.label}
        </button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;