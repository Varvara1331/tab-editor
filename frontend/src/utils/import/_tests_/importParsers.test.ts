import { 
  createNoteFromImport, 
  importFromJson, 
  importFromGpJson, 
  importFromMusicXML,
  importTabFromFile
} from '../importParsers';

describe('importParsers', () => {
  describe('createNoteFromImport', () => {
    it('should create empty note for null fret', () => {
      const result = createNoteFromImport({ fret: null });
      expect(result.fret).toBeNull();
    });

    it('should create note with bend', () => {
      const result = createNoteFromImport({ fret: 5, bend: true });
      expect(result.fret).toBe(5);
      expect(result.bend).toBe(true);
    });

    it('should create note with slide up', () => {
      const result = createNoteFromImport({ fret: 7, slide: 'up' });
      expect(result.slide).toBe('up');
    });

    it('should create note with hammer from object', () => {
      const result = createNoteFromImport({ 
        fret: 5, 
        hammer: { fromFret: 5, toFret: 7 } 
      });
      expect(result.hammer).toEqual({ fromFret: 5, toFret: 7 });
    });

    it('should create note with hammer from number', () => {
      const result = createNoteFromImport({ fret: 5, hammer: 7 });
      expect(result.hammer).toEqual({ fromFret: 5, toFret: 7 });
    });

    it('should create note with effect from GP format', () => {
      const result = createNoteFromImport({ fret: 5, effect: 'bend' });
      expect(result.bend).toBe(true);
    });
  });

  describe('importFromJson', () => {
    const validJson = JSON.stringify({
      title: 'Imported Song',
      artist: 'Imported Artist',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [{
        strings: [{
          stringNumber: 0,
          notes: [{ fret: 5 }, { fret: 7 }, { fret: null }]
        }]
      }]
    });

    it('should import valid JSON', () => {
      const result = importFromJson(validJson);
      expect(result.title).toBe('Imported Song');
      expect(result.artist).toBe('Imported Artist');
      expect(result.measures).toHaveLength(1);
    });

    it('should throw error for missing title', () => {
      const invalidJson = JSON.stringify({ measures: [] });
      expect(() => importFromJson(invalidJson)).toThrow();
    });

    it('should throw error for missing measures', () => {
      const invalidJson = JSON.stringify({ title: 'Song' });
      expect(() => importFromJson(invalidJson)).toThrow();
    });

    it('should use default tuning if not provided', () => {
      const jsonWithoutTuning = JSON.stringify({
        title: 'Song',
        measures: [{ strings: [] }]
      });
      const result = importFromJson(jsonWithoutTuning);
      expect(result.tuning).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
    });
  });

  describe('importFromGpJson', () => {
    const gpJson = JSON.stringify({
      title: 'GP Song',
      artist: 'GP Artist',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      measures: [{
        notes: [
          { string: 1, fret: 5, position: 0 },
          { string: 1, fret: 7, position: 1 }
        ]
      }]
    });

    it('should import GP JSON format', () => {
      const result = importFromGpJson(gpJson);
      expect(result.title).toBe('GP Song');
      expect(result.artist).toBe('GP Artist');
    });

    it('should handle empty measures', () => {
      const emptyGpJson = JSON.stringify({
        title: 'Empty',
        tuning: ['E4', 'B3']
      });
      const result = importFromGpJson(emptyGpJson);
      expect(result.measures).toHaveLength(1);
    });
  });

  describe('importFromMusicXML', () => {
    const musicXml = `<?xml version="1.0" encoding="UTF-8"?>
    <score-partwise version="3.1">
      <work>
        <work-title>XML Song</work-title>
      </work>
      <identification>
        <creator type="composer">XML Artist</creator>
      </identification>
      <part-list>
        <score-part id="P1">
          <part-name>Guitar</part-name>
        </score-part>
      </part-list>
      <part id="P1">
        <measure number="1">
          <attributes>
            <divisions>4</divisions>
            <time>
              <beats>4</beats>
              <beat-type>4</beat-type>
            </time>
          </attributes>
          <note>
            <pitch>
              <step>E</step>
              <octave>4</octave>
            </pitch>
            <duration>1</duration>
            <type>quarter</type>
            <notations>
              <technical>
                <string>1</string>
                <fret>5</fret>
              </technical>
            </notations>
          </note>
        </measure>
      </part>
    </score-partwise>`;

    it('should import MusicXML format', async () => {
      const result = await importFromMusicXML(musicXml);
      expect(result.title).toBe('XML Song');
      expect(result.artist).toBe('XML Artist');
    });

    it('should throw error for invalid XML', async () => {
      await expect(importFromMusicXML('invalid xml')).rejects.toThrow();
    });
  });

  describe('importTabFromFile', () => {
    it('should detect and import JSON format', async () => {
      const jsonContent = JSON.stringify({
        title: 'JSON Tab',
        measures: [{ strings: [] }]
      });
      const result = await importTabFromFile(jsonContent);
      expect(result.title).toBe('JSON Tab');
    });

    it('should detect and import GP JSON format', async () => {
      const gpContent = JSON.stringify({
        format: 'guitar-pro-compatible',
        title: 'GP Tab',
        measures: []
      });
      const result = await importTabFromFile(gpContent);
      expect(result.title).toBe('GP Tab');
    });

    it('should detect and import MusicXML format', async () => {
      const xmlContent = `<?xml version="1.0"?>
      <score-partwise>
        <work>
          <work-title>XML Tab</work-title>
        </work>
        <part id="P1">
          <measure number="1"></measure>
        </part>
      </score-partwise>`;
      const result = await importTabFromFile(xmlContent);
      expect(result.title).toBe('XML Tab');
    });

    it('should throw error for unknown format', async () => {
      await expect(importTabFromFile('unknown format')).rejects.toThrow();
    });

    it('should use file extension for detection', async () => {
      const jsonContent = JSON.stringify({
        title: 'File Extension Tab',
        measures: [{ strings: [] }]
      });
      const result = await importTabFromFile(jsonContent, 'test.json');
      expect(result.title).toBe('File Extension Tab');
    });
  });
});