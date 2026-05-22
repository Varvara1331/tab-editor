// frontend/src/components/_tests_/TabEditor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { saveToLibrary, updateInLibrary } from '../../services/libraryService';
import { getCurrentUser } from '../../services/authService';

// Мокаем все сервисы
jest.mock('../../services/libraryService');
jest.mock('../../services/authService');

// Мокаем тяжелые зависимости
jest.mock('tone', () => ({}));
jest.mock('soundfont-player', () => ({}));
jest.mock('pitchy', () => ({}));

// Мокаем компоненты, которые используют Audio API
jest.mock('../editor/GuitarTuner', () => {
  return function MockGuitarTuner({ isOpen }: { isOpen: boolean }) {
    return isOpen ? <div data-testid="guitar-tuner">Guitar Tuner Modal</div> : null;
  };
});

jest.mock('../modals/ExportModal', () => {
  return function MockExportModal({ isOpen }: { isOpen: boolean }) {
    return isOpen ? <div data-testid="export-modal">Export Modal</div> : null;
  };
});

// Импортируем компонент ПОСЛЕ моков
import TabEditor from '../editor/TabEditor';

describe('TabEditor', () => {
  const mockOnTabSaved = jest.fn();
  const mockOnNewTabRequest = jest.fn();
  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };

  const mockTabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [
      {
        id: 'measure-1',
        strings: [
          { stringNumber: 0, notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }] },
          { stringNumber: 1, notes: [{ fret: null }, { fret: null }, { fret: null }] },
        ],
      },
    ],
    notesPerMeasure: 16,
    isPublic: false,
    isOwn: true,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (saveToLibrary as jest.Mock).mockResolvedValue(true);
    (updateInLibrary as jest.Mock).mockResolvedValue(true);
  });

  describe('рендеринг', () => {
    it('должен отображать редактор', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      expect(screen.getByPlaceholderText('Название композиции')).toBeInTheDocument();
      expect(screen.getByTitle('Новая табулатура')).toBeInTheDocument();
      expect(screen.getByTitle('Тюнер')).toBeInTheDocument();
    });

    it('должен отображать название табулатуры', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument();
    });

    it('должен отображать исполнителя', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument();
    });

    it('должен отображать кнопку создания новой табулатуры', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      expect(screen.getByTitle('Новая табулатура')).toBeInTheDocument();
    });

    it('должен отображать кнопку тюнера', () => {
      render(<TabEditor />);
      expect(screen.getByTitle('Тюнер')).toBeInTheDocument();
    });

    it('должен отображать кнопку публикации для своих табулатур', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByTitle('Опубликовать')).toBeInTheDocument();
    });

    it('должен отображать кнопку сохранения', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByTitle('Сохранить в библиотеку')).toBeInTheDocument();
    });

    it('должен отображать кнопку скачивания', () => {
      render(<TabEditor />);
      expect(screen.getByTitle('Скачать')).toBeInTheDocument();
    });
  });

  describe('режим только для чтения', () => {
    it('должен показывать, что поле ввода названия НЕ заблокировано для своих табулатур', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const titleInput = screen.getByDisplayValue('Test Song');
      expect(titleInput).not.toHaveAttribute('disabled');
    });

    it('должен показывать, что поле ввода названия заблокировано для чужих табулатур', () => {
      // Создаем табулатуру с другим пользователем
      const readOnlyTab = { 
        ...mockTabData, 
        userId: 999,
        isOwn: false  // Явно устанавливаем флаг
      };
      render(<TabEditor initialTabData={readOnlyTab} />);
      
      // Проверяем, что поле ввода имеет атрибут disabled
      const titleInput = screen.getByDisplayValue('Test Song');
      expect(titleInput).toHaveAttribute('disabled');
    });
  });

  describe('сохранение', () => {
    it('должен сохранять табулатуру при клике на кнопку сохранения', async () => {
      render(<TabEditor initialTabData={mockTabData} />);
      
      const saveButton = screen.getByTitle('Сохранить в библиотеку');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(saveToLibrary).toHaveBeenCalled();
      });
    });
  });

  describe('публикация', () => {
    it('должен публиковать табулатуру при клике', async () => {
      render(<TabEditor initialTabData={mockTabData} />);
      
      const publishButton = screen.getByTitle('Опубликовать');
      fireEvent.click(publishButton);
      
      await waitFor(() => {
        expect(saveToLibrary).toHaveBeenCalled();
      });
    });
  });

  describe('тюнер', () => {
    it('должен открывать тюнер при клике на кнопку', async () => {
      render(<TabEditor />);
      
      const tunerButton = screen.getByTitle('Тюнер');
      fireEvent.click(tunerButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('guitar-tuner')).toBeInTheDocument();
      });
    });
  });

  describe('экспорт', () => {
    it('должен открывать модальное окно экспорта', async () => {
      render(<TabEditor />);
      
      const downloadButton = screen.getByTitle('Скачать');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument();
      });
    });
  });

  describe('создание новой табулатуры', () => {
    it('должен вызывать onNewTabRequest при клике', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      
      const newTabButton = screen.getByTitle('Новая табулатура');
      fireEvent.click(newTabButton);
      
      expect(mockOnNewTabRequest).toHaveBeenCalled();
    });
  });
});