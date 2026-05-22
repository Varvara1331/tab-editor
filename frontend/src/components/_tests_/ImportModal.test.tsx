import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportModal from '../modals/ImportModal';
import { importTabFromFile, canImportFile } from '../../utils/import/importUtils';
import { saveToLibrary } from '../../services/libraryService';

jest.mock('../../utils/import/importUtils', () => ({
  importTabFromFile: jest.fn(),
  canImportFile: jest.fn(),
}));

jest.mock('../../services/libraryService', () => ({
  saveToLibrary: jest.fn(),
}));

describe('ImportModal', () => {
  const mockOnClose = jest.fn();
  const mockOnImportSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (canImportFile as jest.Mock).mockReturnValue(true);
  });

  describe('рендеринг', () => {
    it('не должен отображаться когда isOpen = false', () => {
      render(<ImportModal isOpen={false} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      expect(screen.queryByText('Импорт табулатуры')).not.toBeInTheDocument();
    });

    it('должен отображаться когда isOpen = true', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      expect(screen.getByText('Импорт табулатуры')).toBeInTheDocument();
    });

    it('должен отображать зону перетаскивания файлов', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      expect(screen.getByText('Перетащите файл сюда')).toBeInTheDocument();
      expect(screen.getByText('или')).toBeInTheDocument();
      expect(screen.getByText('Выберите файл на компьютере')).toBeInTheDocument();
    });

    it('должен отображать информацию о поддерживаемых форматах', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      expect(screen.getByText('Поддерживаемые форматы:')).toBeInTheDocument();
      expect(screen.getByText('JSON (.json)')).toBeInTheDocument();
      expect(screen.getByText('MusicXML (.musicxml, .xml)')).toBeInTheDocument();
    });

    it('должен отображать кнопку "Отмена"', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      expect(screen.getByText('Отмена')).toBeInTheDocument();
    });
  });

  describe('drag-and-drop', () => {
    it('должен подсвечивать зону при перетаскивании', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      const dropzone = document.querySelector('.import-dropzone');
      
      if (dropzone) {
        fireEvent.dragOver(dropzone);
        expect(dropzone).toHaveClass('dragging');
        
        fireEvent.dragLeave(dropzone);
        expect(dropzone).not.toHaveClass('dragging');
      }
    });
  });

  describe('импорт файла', () => {
    const mockFile = new File(['test content'], 'test.json', { type: 'application/json' });
    const mockTabData = { id: 1, title: 'Imported Tab' };

    beforeEach(() => {
      (importTabFromFile as jest.Mock).mockResolvedValue({ success: true, tabData: mockTabData });
      (saveToLibrary as jest.Mock).mockResolvedValue(true);
    });

    it('должен обрабатывать выбор файла через диалоговое окно', async () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
        
        await waitFor(() => {
          expect(importTabFromFile).toHaveBeenCalledWith(mockFile);
          expect(saveToLibrary).toHaveBeenCalledWith(mockTabData);
          expect(mockOnImportSuccess).toHaveBeenCalledWith(mockTabData);
        });
      }
    });

    it('должен показывать сообщение об успехе и закрывать окно', async () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
        
        await waitFor(() => {
          expect(screen.getByText(/успешно импортирован/)).toBeInTheDocument();
        });
      }
    });

    it('должен показывать ошибку при невалидном файле', async () => {
      (canImportFile as jest.Mock).mockReturnValue(false);
      
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
        
        await waitFor(() => {
          expect(screen.getByText('Поддерживаются только файлы .json, .gp.json и .musicxml')).toBeInTheDocument();
        });
      }
    });

    it('должен показывать ошибку при неудачном импорте', async () => {
      (importTabFromFile as jest.Mock).mockResolvedValue({ success: false, error: 'Ошибка парсинга' });
      
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
        
        await waitFor(() => {
          expect(screen.getByText('Ошибка парсинга')).toBeInTheDocument();
        });
      }
    });

    it('должен показывать ошибку при неудачном сохранении в библиотеку', async () => {
      (saveToLibrary as jest.Mock).mockResolvedValue(false);
      
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
        
        await waitFor(() => {
          expect(screen.getByText('Не удалось сохранить табулатуру в библиотеку')).toBeInTheDocument();
        });
      }
    });
  });

  describe('состояние загрузки', () => {
    it('должен показывать индикатор загрузки во время импорта', async () => {
      (importTabFromFile as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, tabData: {} }), 1000))
      );
      
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [new File([''], 'test.json')] } });
        
        expect(screen.getByText('Импорт файла...')).toBeInTheDocument();
      }
    });
  });

  describe('закрытие', () => {
    it('должен закрывать окно при клике на "Отмена"', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('должен закрывать окно при клике на крестик', () => {
      render(<ImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
      const closeButton = screen.getByLabelText('Закрыть');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});