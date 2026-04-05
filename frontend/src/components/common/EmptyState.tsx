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
  /** Иконка (эмодзи или текст) */
  icon: string;
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
 * 
 * @component
 * @param props - Свойства компонента
 * @returns Отрисованный компонент пустого состояния
 * 
 * @example
 * ```typescript
 * <EmptyState
 *   icon="📚"
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