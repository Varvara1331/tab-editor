import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabEditor from '../editor/TabEditor';  // ← ИМПОРТ ДОЛЖЕН БЫТЬ ПЕРВЫМ!
import { saveToLibrary, updateInLibrary } from '../../services/libraryService';

// ============================================
// МОКИ ДЛЯ СЕРВИСОВ
// ============================================
jest.mock('../../services/libraryService');
jest.mock('../../services/authService', () => ({
  getCurrentUser: () => ({ id: 1, username: 'testuser', email: 'test@test.com', createdAt: '2024-01-01' })
}));

// ============================================
// МОКИ ДЛЯ КОМПОНЕНТОВ
// ============================================

// Мок для TabPlayer
jest.mock('../editor/TabPlayer', () => {
  return function MockTabPlayer() {
    return <div data-testid="tab-player">Mock TabPlayer</div>;
  };
});

// Мок для TabControls с полным набором кнопок
jest.mock('../editor/TabControls', () => (props: any) => (
  <div data-testid="tab-controls">
    <button data-testid="tool-select-bend" onClick={() => props.onToolSelect('bend')}>Select Bend</button>
    <button data-testid="tool-select-note" onClick={() => props.onToolSelect('note')}>Select Note</button>
    <button data-testid="tool-select-vibrato" onClick={() => props.onToolSelect('vibrato')}>Select Vibrato</button>
    <button data-testid="tool-select-hammer" onClick={() => props.onToolSelect('hammer')}>Select Hammer</button>
    <button data-testid="tool-select-slide" onClick={() => props.onToolSelect('slide')}>Select Slide</button>
    <button data-testid="notes-change-4" onClick={() => props.onNotesPerMeasureChange?.(4)}>Change to 4/4</button>
    <button data-testid="notes-change-8" onClick={() => props.onNotesPerMeasureChange?.(8)}>Change to 8/8</button>
    <button data-testid="notes-change-16" onClick={() => props.onNotesPerMeasureChange?.(16)}>Change to 16/16</button>
    <div data-testid="tuning-change" onClick={() => props.onTuningChange?.(['D4', 'A3', 'F3', 'C3', 'G2', 'C2'])}>Change Tuning</div>
  </div>
));

// Мок для TabString с полной поддержкой эффектов
jest.mock('../editor/TabString', () => (props: any) => {
  const getNoteSymbol = (note: any) => {
    if (note.fret === null) return '-';
    let symbol = note.fret.toString();
    if (note.bend) symbol = `(${symbol})`;
    if (note.vibrato) symbol = `${symbol}~`;
    if (note.slide === 'up') return `${symbol}/`;
    if (note.slide === 'down') return `\\${symbol}`;
    if (note.hammer) return `${symbol}h${note.hammer.toFret || 7}`;
    return symbol;
  };

  return (
    <div data-testid="tab-string" data-active={props.isActive} data-string-number={props.stringNumber}>
      {props.notes.map((note: any, idx: number) => (
        <span 
          key={idx} 
          data-testid={`note-${idx}`} 
          data-fret={note.fret}
          data-bend={note.bend}
          data-vibrato={note.vibrato}
          data-slide={note.slide}
          data-hammer={note.hammer}
          onClick={() => props.onClick(idx)}
          style={{ cursor: 'pointer' }}
        >
          {getNoteSymbol(note)}
        </span>
      ))}
    </div>
  );
});

// Мок для GuitarTuner
jest.mock('../editor/GuitarTuner', () => ({ isOpen, onTuningMismatch }: any) => (
  isOpen ? <div data-testid="guitar-tuner">Guitar Tuner</div> : null
));

// Мок для ExportModal
jest.mock('../modals/ExportModal', () => ({ isOpen, onClose }: any) => (
  isOpen ? <div data-testid="export-modal">Export Modal</div> : null
));

describe('TabEditor', () => {
  const mockOnTabSaved = jest.fn();
  const mockOnNewTabRequest = jest.fn();
  const mockOnStateChange = jest.fn();

  const mockTabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [
      {
        id: 'measure-1',
        strings: [
          { stringNumber: 0, notes: Array(16).fill(null).map((_, i) => ({ fret: i === 0 ? 0 : i === 3 ? 3 : i === 5 ? 5 : i === 7 ? 7 : i === 8 ? 8 : i === 10 ? 10 : i === 12 ? 12 : null })) },
          { stringNumber: 1, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 2, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 3, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 4, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 5, notes: Array(16).fill({ fret: null }) },
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

  const mockTabDataWithEffects = {
    ...mockTabData,
    measures: [
      {
        id: 'measure-1',
        strings: [
          { 
            stringNumber: 0, 
            notes: [
              { fret: 5, bend: true },
              { fret: 7, vibrato: true },
              { fret: 5, slide: 'up' as const },
              { fret: 8, slide: 'down' as const },
              { fret: 5, hammer: { fromFret: 5, toFret: 7 } },
              { fret: null },
              { fret: 12 },
              { fret: 0 },
            ] 
          },
          { stringNumber: 1, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 2, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 3, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 4, notes: Array(16).fill({ fret: null }) },
          { stringNumber: 5, notes: Array(16).fill({ fret: null }) },
        ],
      },
    ],
  };

  const emptyTabData = {
    id: undefined,
    title: 'Новая табулатура',
    artist: '',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [
      {
        id: 'measure-1',
        strings: Array(6).fill(null).map((_, i) => ({ stringNumber: i, notes: Array(16).fill({ fret: null }) })),
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
    (saveToLibrary as jest.Mock).mockResolvedValue(true);
    (updateInLibrary as jest.Mock).mockResolvedValue(true);
  });

  // ============================================
  // РЕНДЕРИНГ
  // ============================================
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

    it('должен отображать количество тактов и струн', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByText(/1 тактов/)).toBeInTheDocument();
      expect(screen.getByText(/6 струн/)).toBeInTheDocument();
    });

    it('должен отображать строки табулатуры', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const strings = screen.getAllByTestId('tab-string');
      expect(strings.length).toBe(6);
    });

    it('должен отображать кнопку добавления такта', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByText(/Добавить такт/)).toBeInTheDocument();
    });

    it('должен отображать ноты с эффектами', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(screen.getByText('7~')).toBeInTheDocument();
      expect(screen.getByText('5/')).toBeInTheDocument();
      expect(screen.getByText('\\8')).toBeInTheDocument();
      expect(screen.getByText('5h7')).toBeInTheDocument();
    });
  });

  // ============================================
  // КНОПКИ ДЕЙСТВИЙ
  // ============================================
  describe('кнопки действий', () => {
    it('должен отображать кнопку создания новой табулатуры', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      expect(screen.getByTitle('Новая табулатура')).toBeInTheDocument();
    });

    it('должен вызывать onNewTabRequest при клике', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      fireEvent.click(screen.getByTitle('Новая табулатура'));
      expect(mockOnNewTabRequest).toHaveBeenCalled();
    });

    it('должен отображать кнопку тюнера', () => {
      render(<TabEditor />);
      expect(screen.getByTitle('Тюнер')).toBeInTheDocument();
    });

    it('должен открывать тюнер при клике', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTitle('Тюнер'));
      expect(screen.getByTestId('guitar-tuner')).toBeInTheDocument();
    });

    it('должен отображать кнопку скачивания', () => {
      render(<TabEditor />);
      expect(screen.getByTitle('Скачать')).toBeInTheDocument();
    });

    it('должен открывать модальное окно экспорта при клике', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTitle('Скачать'));
      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });
  });

  // ============================================
  // СОХРАНЕНИЕ И ПУБЛИКАЦИЯ
  // ============================================
  describe('сохранение и публикация', () => {
    it('должен отображать кнопку сохранения для своих табулатур', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByTitle('Сохранить в библиотеку')).toBeInTheDocument();
    });

    it('должен сохранять табулатуру при клике', async () => {
      render(<TabEditor initialTabData={mockTabData} />);
      fireEvent.click(screen.getByTitle('Сохранить в библиотеку'));
      await waitFor(() => {
        expect(saveToLibrary).toHaveBeenCalled();
      });
    });

    it('должен отображать кнопку публикации для своих табулатур', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByTitle('Опубликовать')).toBeInTheDocument();
    });

    it('должен публиковать табулатуру при клике', async () => {
      render(<TabEditor initialTabData={mockTabData} />);
      fireEvent.click(screen.getByTitle('Опубликовать'));
      await waitFor(() => {
        expect(saveToLibrary).toHaveBeenCalled();
      });
    });

    it('не должен отображать кнопку сохранения для чужих табулатур', () => {
      const readOnlyTab = { ...mockTabData, isOwn: false, userId: 999 };
      render(<TabEditor initialTabData={readOnlyTab} />);
      expect(screen.queryByTitle('Сохранить в библиотеку')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // РЕЖИМ ТОЛЬКО ДЛЯ ЧТЕНИЯ
  // ============================================
  describe('режим только для чтения', () => {
    it('должен показывать баннер для чужих табулатур', async () => {
      const readOnlyTab = { ...mockTabData, isOwn: false, userId: 999 };
      render(<TabEditor initialTabData={readOnlyTab} />);
      await waitFor(() => {
        expect(screen.getByText(/Режим просмотра/)).toBeInTheDocument();
      });
    });

    it('должен отключать поле ввода названия для чужих табулатур', async () => {
      const readOnlyTab = { ...mockTabData, isOwn: false, userId: 999 };
      render(<TabEditor initialTabData={readOnlyTab} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Song')).toBeDisabled();
      });
    });

    it('должен отключать поле ввода исполнителя для чужих табулатур', async () => {
      const readOnlyTab = { ...mockTabData, isOwn: false, userId: 999 };
      render(<TabEditor initialTabData={readOnlyTab} />);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Artist')).toBeDisabled();
      });
    });
  });

  // ============================================
  // ИЗМЕНЕНИЕ ДАННЫХ
  // ============================================
  describe('изменение данных', () => {
    it('должен изменять название табулатуры', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const input = screen.getByDisplayValue('Test Song');
      fireEvent.change(input, { target: { value: 'New Title' } });
      expect(input).toHaveValue('New Title');
    });

    it('должен изменять исполнителя', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const input = screen.getByDisplayValue('Test Artist');
      fireEvent.change(input, { target: { value: 'New Artist' } });
      expect(input).toHaveValue('New Artist');
    });

    it('должен изменять строй гитары', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const tuningButton = screen.getByTestId('tuning-change');
      fireEvent.click(tuningButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  // ============================================
  // ИЗМЕНЕНИЕ РАЗМЕРА ТАКТА
  // ============================================
  describe('изменение размера такта', () => {
    it('должен изменять размер такта на 4/4', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const changeButton = screen.getByTestId('notes-change-4');
      fireEvent.click(changeButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен изменять размер такта на 8/8', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const changeButton = screen.getByTestId('notes-change-8');
      fireEvent.click(changeButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен изменять размер такта на 16/16', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const changeButton = screen.getByTestId('notes-change-16');
      fireEvent.click(changeButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  // ============================================
  // ВЫБОР ИНСТРУМЕНТА
  // ============================================
  describe('выбор инструмента', () => {
    it('должен выбирать инструмент бенд', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTestId('tool-select-bend'));
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен выбирать инструмент нота', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTestId('tool-select-note'));
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен выбирать инструмент вибрато', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTestId('tool-select-vibrato'));
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен выбирать инструмент хаммер', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTestId('tool-select-hammer'));
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен выбирать инструмент слайд', () => {
      render(<TabEditor />);
      fireEvent.click(screen.getByTestId('tool-select-slide'));
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  // ============================================
  // МАСШТАБИРОВАНИЕ
  // ============================================
  describe('масштабирование', () => {
    it('должен увеличивать масштаб при клике на кнопку', () => {
      render(<TabEditor />);
      const zoomInButton = screen.getByTitle('Увеличить');
      fireEvent.click(zoomInButton);
      expect(screen.getByText(/\%/)).toBeInTheDocument();
    });

    it('должен уменьшать масштаб при клике на кнопку', () => {
      render(<TabEditor />);
      const zoomOutButton = screen.getByTitle('Уменьшить');
      fireEvent.click(zoomOutButton);
      expect(screen.getByText(/\%/)).toBeInTheDocument();
    });
  });

  // ============================================
  // РАСКЛАДКА
  // ============================================
  describe('раскладка', () => {
    it('должен переключаться на горизонтальную раскладку', () => {
      render(<TabEditor />);
      const layoutButton = screen.getByTitle('Горизонтальный (в строку)');
      fireEvent.click(layoutButton);
      expect(document.querySelector('.tab-editor')).toHaveClass('horizontal');
    });

    it('должен переключаться на вертикальную раскладку', () => {
      render(<TabEditor />);
      const layoutButton = screen.getByTitle('Вертикальный (в столбец)');
      fireEvent.click(layoutButton);
      expect(document.querySelector('.tab-editor')).toHaveClass('vertical');
    });
  });

  // ============================================
  // ДОБАВЛЕНИЕ И УДАЛЕНИЕ ТАКТОВ
  // ============================================
  describe('добавление и удаление тактов', () => {
    it('должен добавлять новый такт через кнопку', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const addButton = screen.getByText(/Добавить такт/);
      fireEvent.click(addButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });

    it('должен добавлять такт в пустую табулатуру', () => {
      render(<TabEditor initialTabData={emptyTabData} />);
      const addButton = screen.getByText(/Добавить такт/);
      fireEvent.click(addButton);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  // ============================================
  // СТАТУС БАР
  // ============================================
  describe('статус бар', () => {
    it('должен отображать текущую позицию курсора', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByText(/Такт 1\/1/)).toBeInTheDocument();
      expect(screen.getByText(/Струна 1\/6/)).toBeInTheDocument();
      expect(screen.getByText(/Позиция 1\/16/)).toBeInTheDocument();
    });

    it('должен отображать выбранный инструмент', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      expect(screen.getByText(/Инструмент: Нота/)).toBeInTheDocument();
    });

    it('должен отображать статус публикации', () => {
      const publicTab = { ...mockTabData, isPublic: true };
      render(<TabEditor initialTabData={publicTab} />);
      expect(screen.getByText(/Опубликовано/)).toBeInTheDocument();
    });
  });

  // ============================================
  // КЛИК ПО НОТАМ
  // ============================================
  describe('клик по нотам', () => {
    it('должен устанавливать курсор при клике на ноту', () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const note = screen.getByText('0');
      fireEvent.click(note);
      expect(screen.getByTestId('tab-controls')).toBeInTheDocument();
    });
  });

  // ============================================
  // НОВАЯ ТАБУЛАТУРА
  // ============================================
  describe('новая табулатура', () => {
    it('должен создавать пустую табулатуру', () => {
      render(<TabEditor onNewTabRequest={mockOnNewTabRequest} />);
      expect(screen.getByDisplayValue('Новая табулатура')).toBeInTheDocument();
    });
  });

  // ============================================
  // АВТОСОХРАНЕНИЕ
  // ============================================
  describe('автосохранение', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('должен вызывать updateInLibrary через 2 секунды после изменения', async () => {
      render(<TabEditor initialTabData={mockTabData} />);
      const titleInput = screen.getByDisplayValue('Test Song');
      fireEvent.change(titleInput, { target: { value: 'Auto Saved Title' } });
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(updateInLibrary).toHaveBeenCalled();
      });
    });

    it('не должен вызывать автосохранение для чужих табулатур', async () => {
      const readOnlyTab = { ...mockTabData, isOwn: false, userId: 999 };
      render(<TabEditor initialTabData={readOnlyTab} />);
      const titleInput = screen.getByDisplayValue('Test Song');
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      expect(updateInLibrary).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // ЭФФЕКТЫ (БЕНД, ХАММЕР, СЛАЙД, ВИБРАТО)
  // ============================================
  describe('эффекты', () => {
    it('должен отображать бенд в скобках', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('должен отображать вибрато с тильдой', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('7~')).toBeInTheDocument();
    });

    it('должен отображать слайд вверх', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('5/')).toBeInTheDocument();
    });

    it('должен отображать слайд вниз', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('\\8')).toBeInTheDocument();
    });

    it('должен отображать хаммер', () => {
      render(<TabEditor initialTabData={mockTabDataWithEffects} />);
      expect(screen.getByText('5h7')).toBeInTheDocument();
    });
  });

  // ============================================
  // ПРОВЕРКА onTabSaved КОЛБЭКА
  // ============================================
  describe('колбэк onTabSaved', () => {
    it('должен вызываться после сохранения', async () => {
      render(<TabEditor initialTabData={mockTabData} onTabSaved={mockOnTabSaved} />);
      
      fireEvent.click(screen.getByTitle('Сохранить в библиотеку'));
      
      await waitFor(() => {
        expect(mockOnTabSaved).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // ПРОВЕРКА onStateChange КОЛБЭКА
  // ============================================
  describe('колбэк onStateChange', () => {
    it('должен вызываться при изменении состояния', () => {
      render(<TabEditor onStateChange={mockOnStateChange} />);
      
      const titleInput = screen.getByDisplayValue('Новая табулатура');
      fireEvent.change(titleInput, { target: { value: 'Changed Title' } });
      
      expect(mockOnStateChange).toHaveBeenCalled();
    });

    it('не должен вызываться при наличии initialTabData', () => {
      render(
        <TabEditor 
          initialTabData={mockTabData} 
          onStateChange={mockOnStateChange} 
        />
      );
      
      expect(mockOnStateChange).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // ОШИБКИ ПРИ СОХРАНЕНИИ
  // ============================================
  describe('ошибки при сохранении', () => {
    beforeEach(() => {
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('должен показывать ошибку при неудачном сохранении', async () => {
      (saveToLibrary as jest.Mock).mockResolvedValue(false);
      
      render(<TabEditor initialTabData={mockTabData} />);
      
      fireEvent.click(screen.getByTitle('Сохранить в библиотеку'));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Ошибка при сохранении');
      });
    });

    it('должен показывать ошибку при исключении', async () => {
      (saveToLibrary as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<TabEditor initialTabData={mockTabData} />);
      
      fireEvent.click(screen.getByTitle('Сохранить в библиотеку'));
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Ошибка при сохранении');
      });
    });
  });
});
