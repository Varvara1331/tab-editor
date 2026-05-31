import { exportToText, exportToJSON, exportToGP, exportToMusicXML } from '../exportFormats';
import { TabData } from '../../../types/tab';

// Helper для чтения Blob в тестах
const readBlobAsText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
};

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
          },
          {
            stringNumber: 2,
            notes: Array(16).fill({ fret: null })
          },
          {
            stringNumber: 3,
            notes: Array(16).fill({ fret: null })
          },
          {
            stringNumber: 4,
            notes: Array(16).fill({ fret: null })
          },
          {
            stringNumber: 5,
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

  const mockTabDataWithEffects: TabData = {
    ...mockTabData,
    measures: [{
      id: 'measure-1',
      strings: [{
        stringNumber: 0,
        notes: [
          { fret: 5, bend: true },
          { fret: 7, vibrato: true },
          { fret: 5, slide: 'up' as const },
          { fret: 8, slide: 'down' as const },
          { fret: 5, hammer: { fromFret: 5, toFret: 7 } as any },
          { fret: 7, pull: { fromFret: 7, toFret: 5 } as any },
          { fret: 12 },
          { fret: 0 }
        ]
      }]
    }]
  };

  const mockTabDataWithCustomTuning: TabData = {
    ...mockTabData,
    tuning: ['D4', 'A3', 'F#3', 'D3', 'A2', 'D2'],
    measures: [{
      id: 'measure-1',
      strings: [{
        stringNumber: 0,
        notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }]
      }]
    }]
  };

  describe('exportToText', () => {
    it('should generate text representation of tab', () => {
      const result = exportToText(mockTabData);
      
      expect(result).toContain('Test Song');
      expect(result).toContain('Test Artist');
      expect(result).toContain('Строй: E4 B3 G3 D3 A2 E2');
      expect(result).toContain('Такт 1 (16/16)');
      expect(result).toContain('E4│');
    });

    it('should handle empty artist', () => {
      const tabWithoutArtist = { ...mockTabData, artist: '' };
      const result = exportToText(tabWithoutArtist);
      expect(result).toContain('Test Song');
      expect(result).not.toContain('undefined');
    });

    it('should handle notes with effects - bend', () => {
      const tabWithEffects: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 5, bend: true }]
          }]
        }]
      };
      
      const result = exportToText(tabWithEffects);
      expect(result).toContain('(05)');
    });

    it('should handle notes with effects - vibrato', () => {
      const tabWithEffects: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 7, vibrato: true }]
          }]
        }]
      };
      
      const result = exportToText(tabWithEffects);
      expect(result).toContain('07~');
    });

    it('should handle slide up effect', () => {
      const tabWithSlide: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 5, slide: 'up' as const }]
          }]
        }]
      };
      
      const result = exportToText(tabWithSlide);
      expect(result).toContain('05/');
    });

    it('should handle slide down effect', () => {
      const tabWithSlide: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 8, slide: 'down' as const }]
          }]
        }]
      };
      
      const result = exportToText(tabWithSlide);
      expect(result).toContain('\\08');
    });

    it('should handle hammer effect', () => {
      const tabWithHammer: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 5, hammer: { fromFret: 5, toFret: 7 } as any }]
          }]
        }]
      };
      
      const result = exportToText(tabWithHammer);
      expect(result).toContain('05h7');
    });

    it('should handle pull effect', () => {
      const tabWithPull: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 7, pull: { fromFret: 7, toFret: 5 } as any }]
          }]
        }]
      };
      
      const result = exportToText(tabWithPull);
      expect(result).toContain('07p5');
    });

    it('should handle 4/4 time signature', () => {
      const tabWith4Notes: TabData = {
        ...mockTabData,
        notesPerMeasure: 4,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }, { fret: 7 }]
          }]
        }]
      };
      
      const result = exportToText(tabWith4Notes);
      expect(result).toContain('Такт 1 (4/4)');
    });

    it('should handle 8/8 time signature', () => {
      const tabWith8Notes: TabData = {
        ...mockTabData,
        notesPerMeasure: 8,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: Array(8).fill({ fret: 0 })
          }]
        }]
      };
      
      const result = exportToText(tabWith8Notes);
      expect(result).toContain('Такт 1 (8/8)');
    });
  });

  describe('exportToJSON', () => {
    it('should generate JSON blob', () => {
      const blob = exportToJSON(mockTabData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should include version and metadata', async () => {
      const blob = exportToJSON(mockTabData);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      expect(data.version).toBe('1.1');
      expect(data.displayTimeSignature).toBe('16/16');
      expect(data.title).toBe('Test Song');
      expect(data.artist).toBe('Test Artist');
    });

    it('should include all measures data', async () => {
      const blob = exportToJSON(mockTabData);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      expect(data.measures).toHaveLength(1);
      expect(data.measures[0].strings).toHaveLength(6);
    });

    it('should handle effects in JSON export', async () => {
      const blob = exportToJSON(mockTabDataWithEffects);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      expect(data.measures[0].strings[0].notes[0].bend).toBe(true);
      expect(data.measures[0].strings[0].notes[1].vibrato).toBe(true);
      expect(data.measures[0].strings[0].notes[2].slide).toBe('up');
    });
  });

  describe('exportToGP', () => {
    it('should generate Guitar Pro JSON blob', () => {
      const blob = exportToGP(mockTabData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should include GP format flag', async () => {
      const blob = exportToGP(mockTabData);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      expect(data.format).toBe('guitar-pro-compatible');
      expect(data.version).toBe('1.0');
      expect(data.title).toBe('Test Song');
    });

    it('should convert effects to GP format', async () => {
      const blob = exportToGP(mockTabDataWithEffects);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      const notes = data.measures[0].strings[0].notes;
      expect(notes[0].effect).toBe('bend');
      expect(notes[1].effect).toBe('vibrato');
      expect(notes[2].effect).toBe('slide_up');
      expect(notes[3].effect).toBe('slide_down');
      expect(notes[4].effect).toBe('hammer_on');
      expect(notes[5].effect).toBe('pull_off');
    });

    it('should handle null notes in GP export', async () => {
      const blob = exportToGP(mockTabData);
      const text = await readBlobAsText(blob);
      const data = JSON.parse(text);
      
      const nullNote = data.measures[0].strings[0].notes.find((n: any) => n.fret === null);
      expect(nullNote).toBeDefined();
      expect(nullNote.fret).toBeNull();
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

    it('should include notes with pitch in output', () => {
      const result = exportToMusicXML(mockTabData);
      
      expect(result).toContain('<note>');
      expect(result).toContain('<pitch>');
      expect(result).toContain('<technical>');
      expect(result).toContain('<fret>');
    });

    it('should handle rest notes', () => {
      const result = exportToMusicXML(mockTabData);
      
      expect(result).toContain('<rest/>');
    });

    it('should handle 4/4 time signature correctly', () => {
      const tabWith4Notes: TabData = {
        ...mockTabData,
        notesPerMeasure: 4,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }, { fret: 7 }]
          }]
        }]
      };
      
      const result = exportToMusicXML(tabWith4Notes);
      expect(result).toContain('<beats>4</beats>');
      expect(result).toContain('<beat-type>4</beat-type>');
    });

    it('should handle 8/8 time signature correctly', () => {
      const tabWith8Notes: TabData = {
        ...mockTabData,
        notesPerMeasure: 8,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: Array(8).fill({ fret: 0 })
          }]
        }]
      };
      
      const result = exportToMusicXML(tabWith8Notes);
      expect(result).toContain('<beats>8</beats>');
      expect(result).toContain('<beat-type>8</beat-type>');
    });

    it('should handle bend effect in MusicXML', () => {
      const result = exportToMusicXML(mockTabDataWithEffects);
      
      expect(result).toContain('<bend>');
      expect(result).toContain('<bend-alter>2</bend-alter>');
    });

    it('should handle vibrato effect in MusicXML', () => {
      const result = exportToMusicXML(mockTabDataWithEffects);
      
      expect(result).toContain('<vibrato/>');
    });

    it('should handle hammer-on effect in MusicXML', () => {
      const result = exportToMusicXML(mockTabDataWithEffects);
      
      expect(result).toContain('<hammer-on');
      expect(result).toContain('type="start"');
    });

    it('should handle pull-off effect in MusicXML', () => {
      const result = exportToMusicXML(mockTabDataWithEffects);
      
      expect(result).toContain('<pull-off');
      expect(result).toContain('type="start"');
    });

    it('should handle slide effect in MusicXML', () => {
      const result = exportToMusicXML(mockTabDataWithEffects);
      
      expect(result).toContain('<slide line-type="solid" type="start"');
    });

    it('should handle custom tuning with sharps', () => {
      const result = exportToMusicXML(mockTabDataWithCustomTuning);
      
      expect(result).toContain('<tuning-step>F#</tuning-step>');
    });

    it('should handle chord notes correctly', () => {
      const chordTabData: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [
            { stringNumber: 0, notes: [{ fret: 0 }] },
            { stringNumber: 1, notes: [{ fret: 2 }] },
            { stringNumber: 2, notes: [{ fret: 2 }] }
          ]
        }]
      };
      
      const result = exportToMusicXML(chordTabData);
      expect(result).toContain('<chord/>');
    });
  });

  describe('edge cases', () => {
    it('should handle empty measures array', () => {
      const emptyTabData: TabData = {
        ...mockTabData,
        measures: []
      };
      
      const textResult = exportToText(emptyTabData);
      expect(textResult).toContain('Test Song');
      
      const xmlResult = exportToMusicXML(emptyTabData);
      expect(xmlResult).toContain('<score-partwise');
    });

    it('should handle undefined notes per measure', () => {
      const tabWithoutNotesPerMeasure: TabData = {
        ...mockTabData,
        notesPerMeasure: undefined as any,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: [{ fret: 0 }, { fret: 3 }, { fret: 5 }]
          }]
        }]
      };
      
      const result = exportToMusicXML(tabWithoutNotesPerMeasure);
      expect(result).toBeDefined();
    });

    it('should handle measure without timeSignature', () => {
      const tabWithoutTimeSignature: TabData = {
        ...mockTabData,
        measures: [{
          id: 'measure-1',
          strings: [{
            stringNumber: 0,
            notes: Array(16).fill({ fret: 0 })
          }]
        }]
      };
      
      const result = exportToMusicXML(tabWithoutTimeSignature);
      expect(result).toContain('<beats>16</beats>');
    });
  });
});
