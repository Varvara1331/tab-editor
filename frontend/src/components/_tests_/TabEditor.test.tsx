import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TabEditor from '../editor/TabEditor';
import { saveToLibrary, updateInLibrary } from '../../services/libraryService';
import { getCurrentUser } from '../../services/authService';

// Моки для сервисов
jest.mock('../../services/libraryService');
jest.mock('../../services/authService');

// Моки для дочерних компонентов
jest.mock('../editor/TabControls', () => (props: any) => (
  <div data-testid="tab-controls">
    <button data-testid="tool-select" onClick={() => props.onToolSelect('bend')}>Select Tool</button>
    <button data-testid="notes-change" onClick={() => props.onNotesPerMeasureChange?.(8)}>Change Notes</button>
  </div>
));

jest.mock('../editor/TabString', () => (props: any) => (
  <div data-testid="tab-string" data-active={props.isActive}>
    {props.notes.map((note: any, idx: number) => (
      <span key={idx} data-testid={`note-${idx}`} onClick={() => props.onClick(idx)}>
        {note.fret !== null ? note.fret : '-'}
      </span>
    ))}
  </div>
));

jest.mock('../editor/TabPlayer', () => () => <div data-testid="tab-player">Tab Player</div>);
jest.mock('../editor/GuitarTuner', () => ({ isOpen, onTuningMismatch }: any) => (
  isOpen ? <div data-testid="guitar-tuner">Guitar Tuner</div> : null
));
jest.mock('../modals/ExportModal', () => ({ isOpen, onClose }: any) => (
  isOpen ? <div data-testid="export-modal">Export Modal</div> : null
));

describe('TabEditor', () => {
  const mockOnTabSaved = jest.fn();
  const mockOnNewTabRequest = jest.fn();
  const mockOnStateChange = jest.fn();
  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', createdAt: '2024-01-01' };

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
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
      expect(screen.getByTestId('tab-player')).toBeInTheDocument();
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
    it('должен показывать баннер для чужих табулатур', () => {
      const readOnlyTab = { ...mockTabData, isOwn: false };
      render(<TabEditor initialTabData={readOnlyTab} />);
      expect(screen.getByText(/Режим просмотра/)).toBeInTheDocument();
    });

    it('должен отключать поля ввода для чужих табулатур', () => {
      const readOnlyTab = { ...mockTabData, isOwn: false };
      render(<TabEditor initialTabData={readOnlyTab} />);
      expect(screen.getByDisplayValue('Test Song')).toBeDisabled();
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
    it('должен открывать тюнер при клике на кнопку', () => {
      render(<TabEditor />);
      
      const tunerButton = screen.getByTitle('Тюнер');
      fireEvent.click(tunerButton);
      
      expect(screen.getByTestId('guitar-tuner')).toBeInTheDocument();
    });
  });

  describe('экспорт', () => {
    it('должен открывать модальное окно экспорта', () => {
      render(<TabEditor />);
      
      const downloadButton = screen.getByTitle('Скачать');
      fireEvent.click(downloadButton);
      
      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
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

  describe('изменение размера такта', () => {
    it('должен изменять количество нот в такте', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      
      const changeNotesButton = screen.getByTestId('notes-change');
      fireEvent.click(changeNotesButton);
      
      // Проверяем, что компонент не упал
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  describe('выбор инструмента', () => {
    it('должен изменять выбранный инструмент', () => {
      render(<TabEditor />);
      
      const toolSelectButton = screen.getByTestId('tool-select');
      fireEvent.click(toolSelectButton);
      
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });
});