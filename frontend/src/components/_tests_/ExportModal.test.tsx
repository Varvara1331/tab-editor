import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportModal from '../modals/ExportModal';
import { downloadTab } from '../../utils/export/exportUtils';

jest.mock('../../utils/export/exportUtils', () => ({
  downloadTab: jest.fn().mockResolvedValue(undefined),
}));

describe('ExportModal', () => {
  const mockTabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [{ id: '1', strings: [] }],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('рендеринг', () => {
    it('не должен отображаться когда isOpen = false', () => {
      render(<ExportModal tabData={mockTabData} isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Экспорт табулатуры')).not.toBeInTheDocument();
    });

    it('должен отображаться когда isOpen = true', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Экспорт табулатуры')).toBeInTheDocument();
    });

    it('должен отображать поле ввода имени файла', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Имя файла:')).toBeInTheDocument();
    });

    it('должен отображать варианты форматов экспорта', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('PDF документ (.pdf)')).toBeInTheDocument();
      expect(screen.getByText('JSON (.json)')).toBeInTheDocument();
      expect(screen.getByText('MusicXML (.musicxml)')).toBeInTheDocument();
    });

    it('должен отображать информацию о табулатуре', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      // Текст находится внутри элемента li
      expect(screen.getByText(/Test Song/)).toBeInTheDocument();
      expect(screen.getByText(/Test Artist/)).toBeInTheDocument();
    });

    it('должен отображать кнопки "Отмена" и "Скачать"', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Отмена')).toBeInTheDocument();
      expect(screen.getByText('Скачать')).toBeInTheDocument();
    });
  });

  describe('изменение имени файла', () => {
    it('должен обновлять имя файла при вводе', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const filenameInput = screen.getByLabelText('Имя файла:');
      fireEvent.change(filenameInput, { target: { value: 'my-song' } });
      expect(filenameInput).toHaveValue('my-song');
    });
  });

  describe('выбор формата', () => {
    it('PDF должен быть выбран по умолчанию', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const pdfRadio = screen.getByDisplayValue('pdf');
      expect(pdfRadio).toBeChecked();
    });

    it('должен переключать формат при выборе', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const jsonRadio = screen.getByDisplayValue('json');
      fireEvent.click(jsonRadio);
      expect(jsonRadio).toBeChecked();
    });
  });

  describe('экспорт', () => {
    it('должен вызывать downloadTab и закрывать окно при клике на "Скачать"', async () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      
      const downloadButton = screen.getByText('Скачать');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(downloadTab).toHaveBeenCalledWith(mockTabData, 'pdf', expect.any(String));
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('закрытие', () => {
    it('должен закрывать окно при клике на "Отмена"', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('должен закрывать окно при клике на крестик', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByLabelText('Закрыть');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('должен закрывать окно при клике на оверлей', () => {
      render(<ExportModal tabData={mockTabData} isOpen={true} onClose={mockOnClose} />);
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });
});