import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { useAuthState } from '../hooks/useAuthState';
import { useNavigation } from '../hooks/useNavigation';

// Моки для хуков
jest.mock('../hooks/useAuthState');
jest.mock('../hooks/useNavigation');

// Моки для компонентов
jest.mock('../components/editor/TabEditor', () => (props: any) => (
  <div data-testid="tab-editor">
    Tab Editor
    <button data-testid="new-tab-btn" onClick={props.onNewTabRequest}>New Tab</button>
    <button data-testid="save-tab-btn" onClick={props.onTabSaved}>Save Tab</button>
  </div>
));
jest.mock('../components/auth/Auth', () => ({ onAuthSuccess }: any) => (
  <div data-testid="auth-component">
    Auth Component
    <button onClick={onAuthSuccess}>Login</button>
  </div>
));
jest.mock('../components/library/Library', () => ({ onSelectTab, refreshTrigger, onFavoritesChanged, onTabDeleted }: any) => (
  <div data-testid="library-component">
    Library Component
    <button onClick={() => onSelectTab({ id: 1, title: 'Library Tab' })}>Select Tab</button>
  </div>
));
jest.mock('../components/public/PublicTabs', () => ({ onSelectTab, onFavoritesChanged }: any) => (
  <div data-testid="public-tabs-component">
    Public Tabs Component
    <button onClick={() => onSelectTab({ id: 2, title: 'Public Tab' })}>Select Public Tab</button>
  </div>
));
jest.mock('../components/theory/Theory', () => () => <div data-testid="theory-component">Theory Component</div>);

describe('App', () => {
  const mockHandleAuthSuccess = jest.fn();
  const mockHandleLogout = jest.fn();
  const mockSetActiveTab = jest.fn();
  const mockHandleSelectFromPublic = jest.fn();
  const mockHandleSelectFromLibrary = jest.fn();
  const mockHandleTabSaved = jest.fn();
  const mockHandleFavoritesChanged = jest.fn();
  const mockHandleNewTabRequest = jest.fn();
  const mockHandleEditorStateChange = jest.fn();
  const mockHandleTabDataChange = jest.fn();
  const mockHandleTabDeleted = jest.fn();
  const mockResetEditorForUser = jest.fn();

  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', createdAt: '2024-01-01' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthState as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      currentUser: mockUser,
      isLoading: false,
      handleAuthSuccess: mockHandleAuthSuccess,
      handleLogout: mockHandleLogout,
    });
    (useNavigation as jest.Mock).mockReturnValue({
      activeTab: 'editor',
      setActiveTab: mockSetActiveTab,
      selectedTabData: undefined,
      refreshLibrary: false,
      editorResetKey: 1,
      savedEditorState: null,
      shouldRestoreState: true,
      resetEditorForUser: mockResetEditorForUser,
      handleSelectFromPublic: mockHandleSelectFromPublic,
      handleSelectFromLibrary: mockHandleSelectFromLibrary,
      handleTabSaved: mockHandleTabSaved,
      handleFavoritesChanged: mockHandleFavoritesChanged,
      handleNewTabRequest: mockHandleNewTabRequest,
      handleEditorStateChange: mockHandleEditorStateChange,
      handleTabDataChange: mockHandleTabDataChange,
      handleTabDeleted: mockHandleTabDeleted,
    });
  });

  describe('рендеринг', () => {
    it('должен показывать экран загрузки', () => {
      (useAuthState as jest.Mock).mockReturnValue({
        isLoggedIn: false,
        currentUser: null,
        isLoading: true,
        handleAuthSuccess: mockHandleAuthSuccess,
        handleLogout: mockHandleLogout,
      });
      render(<App />);
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('должен показывать компонент аутентификации когда пользователь не авторизован', () => {
      (useAuthState as jest.Mock).mockReturnValue({
        isLoggedIn: false,
        currentUser: null,
        isLoading: false,
        handleAuthSuccess: mockHandleAuthSuccess,
        handleLogout: mockHandleLogout,
      });
      render(<App />);
      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('должен показывать основной интерфейс когда пользователь авторизован', () => {
      render(<App />);
      expect(screen.getByTestId('tab-editor')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('должен отображать кнопки навигации', () => {
      render(<App />);
      expect(screen.getByLabelText('Редактор табулатур')).toBeInTheDocument();
      expect(screen.getByLabelText('Моя библиотека')).toBeInTheDocument();
      expect(screen.getByLabelText('Публичные табулатуры')).toBeInTheDocument();
      expect(screen.getByLabelText('Теория музыки')).toBeInTheDocument();
    });

    it('должен отображать кнопку выхода', () => {
      render(<App />);
      expect(screen.getByLabelText('Выйти из системы')).toBeInTheDocument();
    });
  });

  describe('навигация', () => {
    it('должен переключать вкладки при клике на кнопки', () => {
      render(<App />);
      
      const libraryButton = screen.getByLabelText('Моя библиотека');
      fireEvent.click(libraryButton);
      
      expect(mockSetActiveTab).toHaveBeenCalledWith('library');
    });

    it('должен показывать библиотеку при активной вкладке library', () => {
      (useNavigation as jest.Mock).mockReturnValue({
        activeTab: 'library',
        setActiveTab: mockSetActiveTab,
        selectedTabData: undefined,
        refreshLibrary: false,
        editorResetKey: 1,
        savedEditorState: null,
        shouldRestoreState: true,
        resetEditorForUser: mockResetEditorForUser,
        handleSelectFromPublic: mockHandleSelectFromPublic,
        handleSelectFromLibrary: mockHandleSelectFromLibrary,
        handleTabSaved: mockHandleTabSaved,
        handleFavoritesChanged: mockHandleFavoritesChanged,
        handleNewTabRequest: mockHandleNewTabRequest,
        handleEditorStateChange: mockHandleEditorStateChange,
        handleTabDataChange: mockHandleTabDataChange,
        handleTabDeleted: mockHandleTabDeleted,
      });
      render(<App />);
      expect(screen.getByTestId('library-component')).toBeInTheDocument();
    });

    it('должен показывать публичные табулатуры при активной вкладке public', () => {
      (useNavigation as jest.Mock).mockReturnValue({
        activeTab: 'public',
        setActiveTab: mockSetActiveTab,
        selectedTabData: undefined,
        refreshLibrary: false,
        editorResetKey: 1,
        savedEditorState: null,
        shouldRestoreState: true,
        resetEditorForUser: mockResetEditorForUser,
        handleSelectFromPublic: mockHandleSelectFromPublic,
        handleSelectFromLibrary: mockHandleSelectFromLibrary,
        handleTabSaved: mockHandleTabSaved,
        handleFavoritesChanged: mockHandleFavoritesChanged,
        handleNewTabRequest: mockHandleNewTabRequest,
        handleEditorStateChange: mockHandleEditorStateChange,
        handleTabDataChange: mockHandleTabDataChange,
        handleTabDeleted: mockHandleTabDeleted,
      });
      render(<App />);
      expect(screen.getByTestId('public-tabs-component')).toBeInTheDocument();
    });

    it('должен показывать теорию при активной вкладке theory', () => {
      (useNavigation as jest.Mock).mockReturnValue({
        activeTab: 'theory',
        setActiveTab: mockSetActiveTab,
        selectedTabData: undefined,
        refreshLibrary: false,
        editorResetKey: 1,
        savedEditorState: null,
        shouldRestoreState: true,
        resetEditorForUser: mockResetEditorForUser,
        handleSelectFromPublic: mockHandleSelectFromPublic,
        handleSelectFromLibrary: mockHandleSelectFromLibrary,
        handleTabSaved: mockHandleTabSaved,
        handleFavoritesChanged: mockHandleFavoritesChanged,
        handleNewTabRequest: mockHandleNewTabRequest,
        handleEditorStateChange: mockHandleEditorStateChange,
        handleTabDataChange: mockHandleTabDataChange,
        handleTabDeleted: mockHandleTabDeleted,
      });
      render(<App />);
      expect(screen.getByTestId('theory-component')).toBeInTheDocument();
    });
  });

  describe('выход из системы', () => {
    it('должен вызывать handleLogout при клике на кнопку выхода', () => {
      render(<App />);
      const logoutButton = screen.getByLabelText('Выйти из системы');
      fireEvent.click(logoutButton);
      expect(mockHandleLogout).toHaveBeenCalled();
    });
  });

  describe('сброс состояния при смене пользователя', () => {
    it('должен вызывать resetEditorForUser при изменении пользователя', () => {
      render(<App />);
      expect(mockResetEditorForUser).toHaveBeenCalledWith(mockUser.id);
    });
  });
});