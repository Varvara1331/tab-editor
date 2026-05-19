/**
 * @fileoverview Компонент индикатора загрузки.
 * Отображает анимированный спиннер и опциональное сообщение.
 * 
 * @module components/common/LoadingSpinner
 */

import React, { memo } from 'react';

/**
 * Свойства компонента LoadingSpinner
 */
interface LoadingSpinnerProps {
  /** Сообщение для отображения (по умолчанию 'Загрузка...') */
  message?: string;
  /** Размер спиннера: 'small', 'medium', 'large' (по умолчанию 'medium') */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Компонент индикатора загрузки.
 * Отображает анимированный спиннер во время выполнения асинхронных операций.
 * Поддерживает три размера и пользовательское сообщение.
 * 
 * @component
 * @param props - Свойства компонента
 * @param props.message - Текст сообщения (по умолчанию 'Загрузка...')
 * @param props.size - Размер спиннера: 'small', 'medium', 'large' (по умолчанию 'medium')
 * @returns Отрисованный компонент загрузки
 * 
 * @example
 * ```tsx
 * // Стандартный спиннер
 * <LoadingSpinner />
 * 
 * // С пользовательским сообщением
 * <LoadingSpinner message="Сохранение..." size="large" />
 * ```
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ 
  message = 'Загрузка...', 
  size = 'medium' 
}) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="loading-spinner" aria-label="Загрузка" />
      <p>{message}</p>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;