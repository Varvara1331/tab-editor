import { render, screen, fireEvent } from '@testing-library/react';
import TabString from '../editor/TabString';
import { Note } from '../../types/tab';

describe('TabString', () => {
  const defaultNotes: Note[] = [
    { fret: 0 },
    { fret: 3 },
    { fret: 5 },
    { fret: null },
    { fret: 7 },
    { fret: 8 },
    { fret: 12 },
  ];

  const defaultProps = {
    stringNote: 'E4',
    stringNumber: 1,
    notes: defaultNotes,
    isActive: false,
    cursorPosition: 0,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('рендеринг', () => {
    it('должен отображать название струны', () => {
      render(<TabString {...defaultProps} showStringLabel={true} />);
      expect(screen.getByText('E4│1')).toBeInTheDocument();
    });

    it('не должен отображать название струны если showStringLabel = false', () => {
      render(<TabString {...defaultProps} showStringLabel={false} />);
      expect(screen.queryByText('E4│1')).not.toBeInTheDocument();
    });

    it('должен отображать все ноты', () => {
      render(<TabString {...defaultProps} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('должен отображать пустую ноту как "-"', () => {
      render(<TabString {...defaultProps} />);
      const emptyNotes = screen.getAllByText('-');
      expect(emptyNotes.length).toBeGreaterThan(0);
    });

    it('должен отображать разделители между нотами', () => {
      render(<TabString {...defaultProps} />);
      const separators = document.querySelectorAll('.separator');
      expect(separators.length).toBe(defaultNotes.length - 1);
    });
  });

  describe('активная струна', () => {
    it('должен иметь класс active когда струна активна', () => {
      const { container } = render(<TabString {...defaultProps} isActive={true} />);
      expect(container.firstChild).toHaveClass('active');
    });

    it('должен подсвечивать позицию курсора', () => {
      render(<TabString {...defaultProps} isActive={true} cursorPosition={2} />);
      const cursorCell = document.querySelector('.note-cell.cursor');
      expect(cursorCell).toBeInTheDocument();
    });
  });

  describe('эффекты нот', () => {
    it('должен отображать бенд в скобках', () => {
      const notesWithBend: Note[] = [{ fret: 5, bend: true }];
      render(<TabString {...defaultProps} notes={notesWithBend} />);
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('должен отображать вибрато с тильдой', () => {
      const notesWithVibrato: Note[] = [{ fret: 7, vibrato: true }];
      render(<TabString {...defaultProps} notes={notesWithVibrato} />);
      expect(screen.getByText('7~')).toBeInTheDocument();
    });

    it('должен отображать хаммер в формате "5h7"', () => {
      const notesWithHammer: Note[] = [{ fret: 5, hammer: { fromFret: 5, toFret: 7 } }];
      render(<TabString {...defaultProps} notes={notesWithHammer} />);
      expect(screen.getByText('5h7')).toBeInTheDocument();
    });
  });

  describe('слайд', () => {
    const slideNotes: Note[] = [
      { fret: 5, slide: 'up' as const },
      { fret: 7 },
    ];

    it('должен отображать разделитель "/" для слайда вверх', () => {
      render(<TabString {...defaultProps} notes={slideNotes} />);
      const separator = document.querySelector('.separator');
      expect(separator).toHaveTextContent('/');
      expect(separator).toHaveClass('slide-connector');
    });

    const slideDownNotes: Note[] = [
      { fret: 7, slide: 'down' as const },
      { fret: 5 },
    ];

    it('должен отображать разделитель "\\" для слайда вниз', () => {
      render(<TabString {...defaultProps} notes={slideDownNotes} />);
      const separator = document.querySelector('.separator');
      expect(separator).toHaveTextContent('\\');
    });
  });

  describe('позиция воспроизведения', () => {
    const playingPosition = { measureIndex: 0, stringIndex: 0, noteIndex: 2 };

    it('должен подсвечивать играющую ноту', () => {
      render(
        <TabString
          {...defaultProps}
          playingPosition={playingPosition}
          measureIndex={0}
        />
      );
      const playingNote = document.querySelector('.note-cell.playing');
      expect(playingNote).toBeInTheDocument();
    });

    it('не должен подсвечивать ноту если measureIndex не совпадает', () => {
      render(
        <TabString
          {...defaultProps}
          playingPosition={playingPosition}
          measureIndex={1}
        />
      );
      const playingNote = document.querySelector('.note-cell.playing');
      expect(playingNote).not.toBeInTheDocument();
    });
  });

  describe('обработчики событий', () => {
    it('должен вызывать onClick при клике на ноту', () => {
      render(<TabString {...defaultProps} />);
      
      const firstNote = screen.getByText('0').closest('.note-cell');
      if (firstNote) {
        fireEvent.click(firstNote);
        expect(defaultProps.onClick).toHaveBeenCalledWith(0);
      }
    });

    it('должен вызывать onPositionDrag при mouseDown на ноте', () => {
      const onPositionDrag = jest.fn();
      render(
        <TabString
          {...defaultProps}
          measureIndex={0}
          onPositionDrag={onPositionDrag}
        />
      );
      
      const firstNote = screen.getByText('0').closest('.note-cell');
      if (firstNote) {
        fireEvent.mouseDown(firstNote);
        expect(onPositionDrag).toHaveBeenCalledWith(0, 0);
      }
    });
  });

  describe('подсветка слайда', () => {
    const slideRangeNotes: Note[] = [
      { fret: 5, slide: 'up' as const },
      { fret: 6 },
      { fret: 7 },
      { fret: 8 },
    ];

    it('должен подсвечивать start, between и end ячейки слайда', () => {
      render(
        <TabString
          {...defaultProps}
          notes={slideRangeNotes}
          slideStartCell={0}
          slideEndCell={3}
        />
      );
      
      const cells = document.querySelectorAll('.note-cell');
      expect(cells[0]).toHaveClass('slide-start');
      expect(cells[1]).toHaveClass('slide-between');
      expect(cells[2]).toHaveClass('slide-between');
      expect(cells[3]).toHaveClass('slide-end');
    });
  });
});