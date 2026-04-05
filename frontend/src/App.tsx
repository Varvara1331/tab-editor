/**
 * @fileoverview Главный компонент приложения Tab Editor.
 * Управляет аутентификацией, навигацией и состоянием редактора табулатур.
 * 
 * @module App
 */

import React, { useMemo, useEffect } from 'react';
import TabEditor from './components/editor/TabEditor';
import Auth from './components/auth/Auth';
import PublicTabs from './components/public/PublicTabs';
import Library from './components/library/Library';
import Theory from './components/theory/Theory';
import { useAuthState } from './hooks/useAuthState';
import { useNavigation } from './hooks/useNavigation';

import './App.css';

/**
 * Главный компонент приложения
 * 
 * @component
 * @returns {JSX.Element} Отрисованный компонент приложения
 */
const App: React.FC = () => {
  const { isLoggedIn, currentUser, isLoading, handleAuthSuccess, handleLogout } = useAuthState();
  const {
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
  } = useNavigation();

  // Сброс состояния редактора при смене пользователя
  useEffect(() => {
    resetEditorForUser(currentUser?.id);
  }, [currentUser, resetEditorForUser]);

  // Конфигурация кнопок навигации
  const navButtons = useMemo(() => [
    { id: 'editor' as const, label: '🎸 Редактор', ariaLabel: 'Редактор табулатур' },
    { id: 'library' as const, label: '📚 Библиотека', ariaLabel: 'Моя библиотека' },
    { id: 'public' as const, label: '🌍 Публикации', ariaLabel: 'Публичные табулатуры' },
    { id: 'theory' as const, label: '📖 Теория', ariaLabel: 'Теория музыки' },
  ], []);

  // Экран загрузки
  if (isLoading) {
    return (
      <div className="loading-screen" role="status" aria-label="Загрузка приложения">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Загрузка...</p>
      </div>
    );
  }

  // Страница аутентификации
  if (!isLoggedIn) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Основной интерфейс приложения
  return (
    <div className="app">
      <header className="app-header">
        <nav className="app-nav" aria-label="Основная навигация">
          {navButtons.map(({ id, label, ariaLabel }) => (
            <button
              key={id}
              className={`nav-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              type="button"
              aria-label={ariaLabel}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="user-info">
          <span className="username" aria-label="Имя пользователя">
            {currentUser?.username}
          </span>
          <button
            className="logout-btn"
            onClick={handleLogout}
            type="button"
            aria-label="Выйти из системы"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="app-main">
        <section
          className="tab-editor-section"
          style={{ display: activeTab === 'editor' ? 'block' : 'none' }}
          aria-label="Редактор табулатур"
        >
          <TabEditor
            key={`editor-${editorResetKey}`}
            initialTabData={selectedTabData}
            onTabDataChange={handleTabDataChange}
            onTabSaved={handleTabSaved}
            onNewTabRequest={handleNewTabRequest}
            onStateChange={handleEditorStateChange}
            restoredState={shouldRestoreState ? savedEditorState : null}
          />
        </section>

        {activeTab === 'library' && (
          <section className="library-section" aria-label="Библиотека табулатур">
            <Library
              key={`library-${refreshLibrary}`}
              onSelectTab={handleSelectFromLibrary}
              refreshTrigger={refreshLibrary}
              onFavoritesChanged={handleFavoritesChanged}
              onTabDeleted={handleTabDeleted}
            />
          </section>
        )}

        {activeTab === 'public' && (
          <section className="public-tabs-section" aria-label="Публичные табулатуры">
            <PublicTabs
              key="public-tabs"
              onSelectTab={handleSelectFromPublic}
              onFavoritesChanged={handleFavoritesChanged}
            />
          </section>
        )}

        {activeTab === 'theory' && (
          <section className="theory-section" aria-label="Теория музыки">
            <Theory />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;