import { render, screen, fireEvent } from '@testing-library/react';
import PublicTabs from '../public/PublicTabs';
import { usePublicTabs } from '../../hooks/usePublicTabs';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/usePublicTabs');
jest.mock('../../hooks/useAuth');

jest.mock('../common/SearchBar', () => ({ value, onChange, onClear, placeholder, debounceDelay }: any) => (
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
    {props.tab.title}
    <button data-testid="select-btn" onClick={() => props.onSelect?.()}>Select</button>
    <button data-testid="favorite-btn" onClick={() => props.onAddToFavorites?.()}>Add to Favorites</button>
    {props.onRemoveFromFavorites && (
      <button data-testid="remove-fav-btn" onClick={() => props.onRemoveFromFavorites?.()}>Remove from Favorites</button>
    )}
  </div>
));

jest.mock('../editor/TabPlayer', () => ({ tabData }: any) => (
  <div data-testid="tab-player">Playing: {tabData?.title}</div>
));

jest.mock('../modals/ExportModal', () => ({ isOpen, tabData, onClose }: any) => (
  isOpen ? <div data-testid="export-modal">Export Modal for {tabData?.title}</div> : null
));

describe('PublicTabs', () => {
  const mockOnSelectTab = jest.fn();
  const mockOnFavoritesChanged = jest.fn();

  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', createdAt: '2024-01-01' };
  
  const mockTabs = [
    { id: 1, title: 'Public Tab 1', artist: 'Artist 1', userId: 2, createdAt: '2024-01-01', updatedAt: '2024-01-01', isPublic: true, views: 100, likes: 10, tuning: [], measures: [] },
    { id: 2, title: 'Public Tab 2', artist: 'Artist 2', userId: 2, createdAt: '2024-01-02', updatedAt: '2024-01-02', isPublic: true, views: 50, likes: 5, tuning: [], measures: [] },
  ];

  const mockFavoritesStatus = new Map([[1, false], [2, true]]);
  const mockToggleFavorite = jest.fn().mockImplementation(async () => {
    return true;
  });
  const mockFilterTabs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ currentUser: mockUser, isLoading: false });
    (usePublicTabs as jest.Mock).mockReturnValue({
      tabs: mockTabs,
      isLoading: false,
      processingId: null,
      favoritesStatus: mockFavoritesStatus,
      searchQuery: '',
      filterTabs: mockFilterTabs,
      refresh: jest.fn(),
      toggleFavorite: mockToggleFavorite,
    });
    window.alert = jest.fn();
  });

  describe('рендеринг', () => {
    it('должен отображать заголовок', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      expect(screen.getByText('ПУБЛИКАЦИИ')).toBeInTheDocument();
      expect(screen.getByText('Табулатуры, опубликованные другими пользователями')).toBeInTheDocument();
    });

    it('должен отображать список публичных табулатур', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      const tabCards = screen.getAllByTestId('tab-card');
      expect(tabCards).toHaveLength(2);
      expect(screen.getByText('Public Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Public Tab 2')).toBeInTheDocument();
    });

    it('должен отображать строку поиска', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('состояние загрузки', () => {
    it('должен показывать спиннер при загрузке аутентификации', () => {
      (useAuth as jest.Mock).mockReturnValue({ currentUser: null, isLoading: true });
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('должен показывать спиннер при загрузке данных', () => {
      (usePublicTabs as jest.Mock).mockReturnValue({
        tabs: [],
        isLoading: true,
        processingId: null,
        favoritesStatus: new Map(),
        searchQuery: '',
        filterTabs: mockFilterTabs,
        refresh: jest.fn(),
        toggleFavorite: mockToggleFavorite,
      });
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('пустое состояние', () => {
    it('должен показывать EmptyState когда нет публикаций', () => {
      (usePublicTabs as jest.Mock).mockReturnValue({
        tabs: [],
        isLoading: false,
        processingId: null,
        favoritesStatus: new Map(),
        searchQuery: '',
        filterTabs: mockFilterTabs,
        refresh: jest.fn(),
        toggleFavorite: mockToggleFavorite,
      });
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      expect(screen.getByText('Публикаций не найдено')).toBeInTheDocument();
    });
  });

  describe('поиск', () => {
    it('должен вызывать filterTabs при вводе текста', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      const searchInput = screen.getByTestId('search-bar');
      fireEvent.change(searchInput, { target: { value: 'rock' } });
      expect(mockFilterTabs).toHaveBeenCalledWith('rock');
    });
  });

  describe('предпросмотр табулатуры', () => {
    it('должен показывать панель предпросмотра при выборе табулатуры', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      const selectButtons = screen.getAllByTestId('select-btn');
      fireEvent.click(selectButtons[0]);
      expect(screen.getByTestId('tab-player')).toBeInTheDocument();
      expect(screen.getByText('Playing: Public Tab 1')).toBeInTheDocument();
    });

    it('должен закрывать панель предпросмотра при клике на крестик', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      const selectButtons = screen.getAllByTestId('select-btn');
      fireEvent.click(selectButtons[0]);
      expect(screen.getByTestId('tab-player')).toBeInTheDocument();
      
      const closeButton = screen.getByLabelText('Закрыть предпросмотр');
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('tab-player')).not.toBeInTheDocument();
    });
  });

  describe('избранное', () => {
    it('должен вызывать toggleFavorite при клике на кнопку', async () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      
      const favoriteButtons = screen.getAllByTestId('favorite-btn');
      expect(favoriteButtons.length).toBe(2);
      
      fireEvent.click(favoriteButtons[0]);
      
      expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockTabs[0]);
    });
  });

  describe('обработчик выбора табулатуры', () => {
    it('должен вызывать onSelectTab при выборе табулатуры', () => {
      render(<PublicTabs onSelectTab={mockOnSelectTab} />);
      const selectButtons = screen.getAllByTestId('select-btn');
      fireEvent.click(selectButtons[0]);
      expect(mockOnSelectTab).toHaveBeenCalled();
    });
  });
});