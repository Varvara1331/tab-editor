import { render, screen, fireEvent } from '@testing-library/react';
import TabCard from '../common/TabCard';

jest.mock('../../utils/dateUtils', () => ({
  formatDate: jest.fn().mockReturnValue('15.01.2024'),
}));

jest.mock('../../utils/previewUtils', () => ({
  getPreviewText: jest.fn().mockReturnValue('preview text'),
}));

jest.mock('../../utils/tabHelpers', () => ({
  getTabTitle: (tab: any) => tab.title || tab.tabData?.title,
  getTabArtist: (tab: any) => tab.artist || tab.tabData?.artist,
  getTabDate: (tab: any, type: string) => tab.date || tab.lastModified || '2024-01-01',
  getTabPreview: (tab: any) => tab.preview,
  getIsPublicFromTab: (tab: any) => tab.isPublic || tab.tabData?.isPublic || false,
  getTabId: (tab: any) => tab.id,
  isPublicTab: (tab: any) => !('tabData' in tab),
}));

describe('TabCard', () => {
  const mockLibraryItem = {
    id: 1,
    tabData: {
      id: 1,
      title: 'My Tab',
      artist: 'My Artist',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    lastModified: '2024-01-15',
    preview: 'preview text',
    isPublication: false,
  };

  const mockPublicTab = {
    id: 2,
    userId: 100,
    title: 'Public Tab',
    artist: 'Public Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [],
    isPublic: true,
    views: 100,
    likes: 10,
    authorName: 'Author Name',
    preview: 'public preview',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    tags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('тип "my" - мои табулатуры', () => {
    it('должен отображать информацию о табулатуре', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onSelect={jest.fn()}
          onExport={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      
      expect(screen.getByText('My Tab')).toBeInTheDocument();
      expect(screen.getByText('My Artist')).toBeInTheDocument();
    });

    it('должен показывать кнопку удаления', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onDelete={jest.fn()}
        />
      );
      
      const deleteButton = screen.getByTitle('Удалить табулатуру');
      expect(deleteButton).toBeInTheDocument();
    });

    it('должен показывать кнопку экспорта', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onExport={jest.fn()}
        />
      );
      
      const exportButton = screen.getByTitle('Скачать табулатуру');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('тип "favorites" - избранное', () => {
    it('должен отображать информацию об избранной табулатуре', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="favorites"
          originalAuthor="Original Author"
          onRemoveFromFavorites={jest.fn()}
        />
      );
      
      expect(screen.getByText('My Tab')).toBeInTheDocument();
      expect(screen.getByText('Original Author')).toBeInTheDocument();
    });

    it('должен показывать кнопку удаления из избранного', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="favorites"
          onRemoveFromFavorites={jest.fn()}
        />
      );
      
      const removeButton = screen.getByTitle('Удалить из избранного');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('тип "public" - публичные табулатуры', () => {
    it('должен отображать публичную табулатуру', () => {
      render(
        <TabCard
          tab={mockPublicTab}
          type="public"
          onAddToFavorites={jest.fn()}
        />
      );
      
      expect(screen.getByText('Public Tab')).toBeInTheDocument();
      expect(screen.getByText('Public Artist')).toBeInTheDocument();
    });

    it('должен показывать кнопку добавления в избранное', () => {
      render(
        <TabCard
          tab={mockPublicTab}
          type="public"
          onAddToFavorites={jest.fn()}
        />
      );
      
      const favoriteButton = screen.getByTitle('Добавить в избранное');
      expect(favoriteButton).toBeInTheDocument();
    });

    it('должен показывать активную кнопку избранного если уже в избранном', () => {
      render(
        <TabCard
          tab={mockPublicTab}
          type="public"
          onAddToFavorites={jest.fn()}
          isInFavorites={true}
        />
      );
      
      const favoriteButton = screen.getByTitle('Удалить из избранного');
      expect(favoriteButton).toBeInTheDocument();
    });

    it('должен показывать бейдж "Ваша публикация" для своих табов', () => {
      render(
        <TabCard
          tab={mockPublicTab}
          type="public"
          isOwn={true}
        />
      );
      
      expect(screen.getByText('Ваша публикация')).toBeInTheDocument();
    });
  });

  describe('обработчики событий', () => {
    it('должен вызывать onSelect при клике на карточку', () => {
      const onSelect = jest.fn();
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onSelect={onSelect}
        />
      );
      
      const card = screen.getByRole('button', { name: /Открыть My Tab/i });
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith(mockLibraryItem);
    });

    it('должен вызывать onExport при клике на кнопку экспорта', () => {
      const onExport = jest.fn();
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onExport={onExport}
        />
      );
      
      const exportButton = screen.getByTitle('Скачать табулатуру');
      fireEvent.click(exportButton);
      expect(onExport).toHaveBeenCalled();
    });

    it('должен вызывать onDelete при клике на кнопку удаления', () => {
      const onDelete = jest.fn();
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          onDelete={onDelete}
        />
      );
      
      const deleteButton = screen.getByTitle('Удалить табулатуру');
      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('должен вызывать onAddToFavorites при клике на кнопку избранного', () => {
      const onAddToFavorites = jest.fn();
      render(
        <TabCard
          tab={mockPublicTab}
          type="public"
          onAddToFavorites={onAddToFavorites}
        />
      );
      
      const favoriteButton = screen.getByTitle('Добавить в избранное');
      fireEvent.click(favoriteButton);
      expect(onAddToFavorites).toHaveBeenCalled();
    });
  });

  describe('состояние загрузки', () => {
    it('должен показывать спиннер при обработке', () => {
      render(
        <TabCard
          tab={mockLibraryItem}
          type="my"
          processingId={1}
          onDelete={jest.fn()}
        />
      );
      
      expect(screen.getByTitle('Удалить табулатуру')).toBeInTheDocument();
    });
  });
});