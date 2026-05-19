import { exportToText, exportToJSON, exportToGP, exportToMusicXML } from '../exportFormats';
import { TabData } from '../../../types/tab';

describe('exportFormats', () => {
  const mockTabData: TabData = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: [
      {
        id: 'measure-1',
        strings: [
          {
            stringNumber: 0,
            notes: [
              { fret: 0 },
              { fret: 3 },
              { fret: 5 },
              { fret: null },
              { fret: 7 },
              { fret: 8 },
              { fret: null },
              { fret: 10 },
              { fret: 12 },
              { fret: null },
              { fret: 0 },
              { fret: 3 },
              { fret: 5 },
              { fret: null },
              { fret: 7 },
              { fret: 8 }
            ]
          },
          {
            stringNumber: 1,
            notes: Array(16).fill({ fret: null })
          }
        ],
        timeSignature: [4, 4]
      }
    ],
    isPublic: false,
    notesPerMeasure: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('exportToText', () => {
    it('should generate text representation of tab', () => {
      const result = exportToText(mockTabData);
      
      expect(result).toContain('Test Song');
      expect(result).toContain('Test Artist');
      expect(result).toContain('Строй: E4 B3 G3 D3 A2 E2');
      expect(result).toContain('Такт 1 (16/16)');
    });

    it('should handle empty artist', () => {
      const tabWithoutArtist = { ...mockTabData, artist: undefined };
      const result = exportToText(tabWithoutArtist);
      expect(result).not.toContain('undefined');
    });

    it('should handle notes with effects', () => {
      const tabWithEffects: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [
              { fret: 5, bend: true },
              { fret: 7, vibrato: true },
              { fret: 5, slide: 'up' as const },
              { fret: 8, slide: 'down' as const }
            ]
          }]
        }]
      };
      
      const result = exportToText(tabWithEffects);
      expect(result).toContain('(05)');
      expect(result).toContain('07~');
    });
  });

  describe('exportToJSON', () => {
    it('should generate JSON blob', () => {
      const blob = exportToJSON(mockTabData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should include version and metadata', () => {
      const blob = exportToJSON(mockTabData);
      // Используем FileReader вместо blob.text()
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const text = reader.result as string;
          const data = JSON.parse(text);
          
          expect(data.version).toBe('1.1');
          expect(data.displayTimeSignature).toBe('16/16');
          expect(data.title).toBe('Test Song');
          resolve(true);
        };
        reader.readAsText(blob);
      });
    });
  });

  describe('exportToGP', () => {
    it('should generate Guitar Pro JSON blob', () => {
      const blob = exportToGP(mockTabData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should include GP format flag', () => {
      const blob = exportToGP(mockTabData);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const text = reader.result as string;
          const data = JSON.parse(text);
          
          expect(data.format).toBe('guitar-pro-compatible');
          expect(data.version).toBe('1.0');
          resolve(true);
        };
        reader.readAsText(blob);
      });
    });
  });

  describe('exportToMusicXML', () => {
    it('should generate valid MusicXML string', () => {
      const result = exportToMusicXML(mockTabData);
      
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<score-partwise');
      expect(result).toContain('<work-title>Test Song</work-title>');
      expect(result).toContain('<creator type="composer">Test Artist</creator>');
    });

    it('should include staff tuning information', () => {
      const result = exportToMusicXML(mockTabData);
      
      expect(result).toContain('<staff-tuning line="6">');
      expect(result).toContain('<tuning-step>E</tuning-step>');
      expect(result).toContain('<tuning-octave>4</tuning-octave>');
    });

    it('should handle empty title and artist', () => {
      const tabWithoutTitle = { ...mockTabData, title: '', artist: '' };
      const result = exportToMusicXML(tabWithoutTitle);
      
      expect(result).toContain('<work-title>Untitled</work-title>');
      expect(result).toContain('<creator type="composer">Unknown</creator>');
    });

    it('should include notes in output', () => {
      const result = exportToMusicXML(mockTabData);
      
      expect(result).toContain('<note>');
      expect(result).toContain('<pitch>');
      expect(result).toContain('<technical>');
      expect(result).toContain('<fret>');
    });
  });
});