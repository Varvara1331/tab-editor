import { render, screen, fireEvent } from '@testing-library/react';
import Library from '../library/Library';
import { useTabsLibrary } from '../../hooks/useTabsLibrary';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useTabsLibrary');
jest.mock('../../hooks/useAuth');

jest.mock('../common/SearchBar', () => ({ value, onChange, onClear, placeholder }: any) => (
  <div data-testid="search-bar-wrapper">
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && onClear && (
      <button data-testid="search-clear" onClick={() => onClear()}>
        Clear
      </button>
    )}
  </div>
));

jest.mock('../common/LoadingSpinner', () => ({ message }: any) => <div data-testid="loading-spinner">{message}</div>);

jest.mock('../common/EmptyState', () => ({ icon, title, message, action }: any) => (
  <div data-testid="empty-state">
    <h3>{title}</h3>
    <p>{message}</p>
    {action && <button onClick={action.onClick}>{action.label}</button>}
  </div>
));

jest.mock('../common/TabCard', () => (props: any) => (
  <div data-testid="tab-card" data-tab-id={props.tab.id} data-type={props.type}>
    {props.tab.tabData?.title || props.tab.title}
    <button data-testid="select-btn" onClick={() => props.onSelect?.()}>Select</button>
    <button data-testid="export-btn" onClick={(e: any) => props.onExport?.(e)}>Export</button>
    {props.onDelete && <button data-testid="delete-btn" onClick={() => props.onDelete?.(props.tab.id)}>Delete</button>}
    {props.onRemoveFromFavorites && <button data-testid="remove-fav-btn" onClick={() => props.onRemoveFromFavorites?.(props.tab.id)}>Remove Fav</button>}
  </div>
));

jest.mock('../modals/ExportModal', () => ({ isOpen, tabData, onClose }: any) => (
  isOpen ? <div data-testid="export-modal">Export Modal for {tabData?.title}</div> : null
));

jest.mock('../modals/ImportModal', () => ({ isOpen, onClose, onImportSuccess }: any) => (
  isOpen ? (
    <div data-testid="import-modal">
      Import Modal
      <button onClick={() => onImportSuccess({ id: 1, title: 'Imported Tab' })}>Import</button>
    </div>
  ) : null
));

describe('Library', () => {
  const mockOnSelectTab = jest.fn();

  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', createdAt: '2024-01-01' };
  
  const mockMyTabs = [
    { 
      id: 1, 
      tabData: { title: 'My Tab 1', artist: 'Artist 1', isPublic: false, tuning: [], measures: [], createdAt: new Date(), updatedAt: new Date() }, 
      lastModified: '2024-01-01' 
    },
    { 
      id: 2, 
      tabData: { title: 'My Tab 2', artist: 'Artist 2', isPublic: true, tuning: [], measures: [], createdAt: new Date(), updatedAt: new Date() }, 
      lastModified: '2024-01-02' 
    },
  ];
  
  const mockFavorites = [
    { 
      id: 3, 
      tabData: { title: 'Favorite 1', artist: 'Fav Artist', isPublic: true, tuning: [], measures: [], createdAt: new Date(), updatedAt: new Date() }, 
      lastModified: '2024-01-03', 
      originalAuthor: 'Original Author' 
    },
  ];

  const mockRefresh = jest.fn();
  const mockDeleteMyTab = jest.fn();
  const mockRemoveFromFavs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockUser, isLoading: false });
    (useTabsLibrary as jest.Mock).mockReturnValue({
      myTabs: mockMyTabs,
      favorites: mockFavorites,
      isLoading: false,
      processingId: null,
      deleteMyTab: mockDeleteMyTab,
      removeFromFavs: mockRemoveFromFavs,
      filterTabs: jest.fn((tabs) => tabs),
      refresh: mockRefresh,
    });
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();
  });

  describe('рендеринг', () => {
    it('должен отображать заголовок библиотеки', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByText('БИБЛИОТЕКА')).toBeInTheDocument();
    });

    it('должен отображать кнопку импорта', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTitle('Импортировать табулатуру')).toBeInTheDocument();
    });

    it('должен отображать вкладки с количеством табов', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTitle('Мои табулатуры')).toBeInTheDocument();
      expect(screen.getByTitle('Избранное')).toBeInTheDocument();
    });

    it('должен отображать список моих табулатур по умолчанию', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      const tabCards = screen.getAllByTestId('tab-card');
      expect(tabCards.length).toBeGreaterThan(0);
    });

    it('должен переключаться на избранное при клике', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      fireEvent.click(screen.getByTitle('Избранное'));
      expect(screen.getByTestId('tab-card')).toBeInTheDocument();
    });
  });

  describe('состояние загрузки', () => {
    it('должен показывать спиннер при загрузке аутентификации', () => {
      (useAuth as jest.Mock).mockReturnValue({ currentUser: null, isLoading: true });
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('неавторизованный пользователь', () => {
    it('должен показывать сообщение о необходимости авторизации', () => {
      (useAuth as jest.Mock).mockReturnValue({ currentUser: null, isLoading: false });
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByText('Требуется авторизация')).toBeInTheDocument();
    });
  });

  describe('пустое состояние', () => {
    it('должен показывать EmptyState когда нет своих табулатур', () => {
      (useTabsLibrary as jest.Mock).mockReturnValue({
        myTabs: [],
        favorites: mockFavorites,
        isLoading: false,
        processingId: null,
        deleteMyTab: mockDeleteMyTab,
        removeFromFavs: mockRemoveFromFavs,
        filterTabs: jest.fn((tabs) => tabs),
        refresh: mockRefresh,
      });
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByText('У вас пока нет табулатур')).toBeInTheDocument();
    });
  });

  describe('поиск', () => {
    it('должен отображать строку поиска', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('обработчики событий', () => {
    it('должен открывать редактор при выборе табулатуры', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      const selectButtons = screen.getAllByTestId('select-btn');
      fireEvent.click(selectButtons[0]);
      expect(mockOnSelectTab).toHaveBeenCalled();
    });

    it('должен открывать модальное окно экспорта', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      const exportButtons = screen.getAllByTestId('export-btn');
      fireEvent.click(exportButtons[0]);
      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });

    it('должен открывать модальное окно импорта', () => {
      render(<Library onSelectTab={mockOnSelectTab} />);
      fireEvent.click(screen.getByTitle('Импортировать табулатуру'));
      expect(screen.getByTestId('import-modal')).toBeInTheDocument();
    });
  });

  describe('удаление табулатуры', () => {
    it('должен вызывать deleteMyTab при клике на удаление', () => {
      mockDeleteMyTab.mockResolvedValue(true);
      render(<Library onSelectTab={mockOnSelectTab} />);
      const deleteButtons = screen.getAllByTestId('delete-btn');
      fireEvent.click(deleteButtons[0]);
      expect(window.confirm).toHaveBeenCalled();
      expect(mockDeleteMyTab).toHaveBeenCalled();
    });
  });

  describe('обновление при изменении refreshTrigger', () => {
    it('должен вызывать refresh при изменении refreshTrigger', () => {
      const { rerender } = render(<Library onSelectTab={mockOnSelectTab} refreshTrigger={false} />);
      expect(mockRefresh).not.toHaveBeenCalled();
      rerender(<Library onSelectTab={mockOnSelectTab} refreshTrigger={true} />);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});