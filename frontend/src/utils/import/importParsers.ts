/**
 * @fileoverview Парсеры для импорта табулатур из различных форматов.
 * Поддерживает JSON, Guitar Pro JSON и MusicXML.
 * 
 * @module utils/importParsers
 */

import { TabData, TabMeasure, Note } from '../../types/tab';
import { createEmptyNote, createEmptyMeasure } from '../tabFactoryUtils';

/**
 * Получение количества позиций в такте из импортируемых данных
 * 
 * @param data - Импортируемые данные
 * @returns Количество позиций (по умолчанию 16)
 * @private
 */
const getNotesPerMeasureFromData = (data: any): number => {
  if (data.notesPerMeasure) return data.notesPerMeasure;
  if (data.measures?.[0]?.notesPerMeasure) return data.measures[0].notesPerMeasure;
  if (data.measures?.[0]?.strings?.[0]?.notes?.length) return data.measures[0].strings[0].notes.length;
  return 16;
};

/**
 * Создание ноты из импортированных данных с учётом эффектов
 * 
 * @param importedNote - Импортированные данные ноты
 * @returns Объект Note с заполненными полями эффектов
 */
export const createNoteFromImport = (importedNote: any): Note => {
  if (importedNote.fret === undefined || importedNote.fret === null) return { fret: null };
  
  const note: Note = { fret: importedNote.fret };
  
  if (importedNote.bend === true || importedNote.bend === 'true' || importedNote.bend === 1) {
    note.bend = true;
  }
  
  if (importedNote.slide) {
    if (importedNote.slide === 'up') {
      note.slide = 'up';
    } else if (importedNote.slide === 'down') {
      note.slide = 'down';
    }
  }
  
  if (importedNote.hammer !== undefined && importedNote.hammer !== null) {
    if (typeof importedNote.hammer === 'object' && 'fromFret' in importedNote.hammer && 'toFret' in importedNote.hammer) {
      note.hammer = importedNote.hammer;
    } else if (typeof importedNote.hammer === 'number') {
      note.hammer = {
        fromFret: importedNote.fret,
        toFret: importedNote.hammer
      };
    } else if (importedNote.hammer === true) {
      note.hammer = true;
    }
  }
  
  if (importedNote.vibrato === true || importedNote.vibrato === 'true' || importedNote.vibrato === 1) {
    note.vibrato = true;
  }
  
  if (importedNote.effect) {
    switch (importedNote.effect) {
      case 'bend':
        note.bend = true;
        break;
      case 'hammer_on':
      case 'hammer':
        if (importedNote.hammerTarget) {
          note.hammer = {
            fromFret: importedNote.fret,
            toFret: importedNote.hammerTarget
          };
        } else {
          note.hammer = true;
        }
        break;
      case 'vibrato':
        note.vibrato = true;
        break;
      case 'slide_up':
      case 'slide':
        note.slide = 'up';
        break;
      case 'slide_down':
        note.slide = 'down';
        break;
    }
  }
  
  if (importedNote.hammerTarget !== undefined) {
    note.hammer = {
      fromFret: importedNote.fret,
      toFret: importedNote.hammerTarget
    };
  }
  
  return note;
};

/**
 * Импорт табулатуры из JSON файла.
 * Ожидает структуру с полями title, measures и опционально tuning, artist.
 * 
 * @param content - Содержимое JSON файла
 * @param tuningLength - Количество струн (по умолчанию 6)
 * @returns Объект TabData
 * @throws {Error} При неверном формате JSON (отсутствуют обязательные поля)
 */
export const importFromJson = (content: string, tuningLength: number = 6): TabData => {
  const data = JSON.parse(content);
  if (!data.title || !data.measures) throw new Error('Неверный формат JSON: отсутствуют обязательные поля');
  
  const notesPerMeasure = getNotesPerMeasureFromData(data);

  const convertedMeasures = data.measures.map((measure: any, idx: number) => {
    let strings: any[] = [];
    const measureNotesCount = measure.notesPerMeasure || notesPerMeasure;
    
    if (measure.strings && Array.isArray(measure.strings) && measure.strings.length > 0) {
      strings = measure.strings.map((string: any, stringIdx: number) => {
        let notes = string.notes || [];
        const fullNotes: Note[] = Array.from({ length: measureNotesCount }, () => createEmptyNote());
        notes.forEach((note: any, noteIdx: number) => { 
          if (noteIdx < measureNotesCount) {
            fullNotes[noteIdx] = createNoteFromImport(note);
          }
        });
        return { 
          stringNumber: string.stringNumber !== undefined ? string.stringNumber : stringIdx, 
          notes: fullNotes 
        };
      });
    }
    
    while (strings.length < tuningLength) {
      strings.push({ 
        stringNumber: strings.length, 
        notes: Array.from({ length: measureNotesCount }, () => createEmptyNote()) 
      });
    }
    
    return {
      id: measure.id || `measure-${idx}-${Date.now()}`,
      strings: strings,
      timeSignature: measure.timeSignature || [4, 4],
      tempo: measure.tempo,
    };
  });

  if (convertedMeasures.length === 0) {
    convertedMeasures.push(createEmptyMeasure(tuningLength, notesPerMeasure));
  }

  return {
    id: undefined, 
    userId: undefined, 
    title: data.title || 'Imported Tab',
    artist: data.artist || '', 
    tuning: data.tuning || ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    measures: convertedMeasures, 
    isPublic: false, 
    isOwn: true, 
    createdAt: new Date(), 
    updatedAt: new Date(),
    notesPerMeasure: notesPerMeasure
  } as TabData;
};

/**
 * Импорт табулатуры из Guitar Pro JSON формата.
 * Обрабатывает структуру, экспортированную из Guitar Pro.
 * 
 * @param content - Содержимое GP JSON файла
 * @returns Объект TabData
 */
export const importFromGpJson = (content: string): TabData => {
  const data = JSON.parse(content);
  const tuning = data.tuning || ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  const tuningLength = tuning.length;
  const globalNotesPerMeasure = data.notesPerMeasure || 16;
  const measures: TabMeasure[] = [];
  const gpMeasures = data.measures || [];

  if (gpMeasures.length > 0) {
    gpMeasures.forEach((gpMeasure: any, idx: number) => {
      const measureNotesCount = gpMeasure.notesPerMeasure || globalNotesPerMeasure;
      const strings: any[] = [];
      
      for (let i = 0; i < tuningLength; i++) {
        strings.push({ 
          stringNumber: i, 
          notes: Array.from({ length: measureNotesCount }, () => createEmptyNote()) 
        });
      }
      
      const allNotes: any[] = [];
      if (gpMeasure.notes) allNotes.push(...gpMeasure.notes);
      if (gpMeasure.voices) {
        gpMeasure.voices.forEach((voice: any) => { 
          if (voice.notes) allNotes.push(...voice.notes); 
        });
      }
      
      allNotes.forEach((note: any) => {
        const stringIndex = note.string !== undefined ? note.string - 1 : (note.stringNumber || 0);
        const fret = note.fret !== undefined ? note.fret : note.value;
        const position = note.position !== undefined ? note.position : (note.beat || 0);
        
        if (stringIndex >= 0 && stringIndex < tuningLength && fret !== undefined && fret >= 0) {
          const pos = Math.min(position, measureNotesCount - 1);
          if (strings[stringIndex] && strings[stringIndex].notes[pos]) {
            strings[stringIndex].notes[pos] = createNoteFromImport(note);
          }
        }
      });
      
      measures.push({ 
        id: `measure-${idx}-${Date.now()}`, 
        strings: strings, 
        timeSignature: gpMeasure.timeSignature || [4, 4], 
        tempo: gpMeasure.tempo 
      });
    });
  }
  
  if (measures.length === 0) {
    measures.push(createEmptyMeasure(tuningLength, globalNotesPerMeasure));
  }
  
  return {
    id: undefined, 
    userId: undefined, 
    title: data.song?.title || data.title || 'Imported Tab',
    artist: data.song?.artist || data.artist || '', 
    tuning: tuning, 
    measures: measures,
    isPublic: false, 
    isOwn: true, 
    createdAt: new Date(), 
    updatedAt: new Date(),
    notesPerMeasure: globalNotesPerMeasure
  } as TabData;
};

/**
 * Извлечение эффектов из MusicXML ноты
 * 
 * @param noteElement - XML элемент ноты
 * @returns Объект с эффектами (bend, vibrato, slide, hammer, hammerTarget)
 * @private
 */
function extractEffectsFromMusicXMLNote(noteElement: Element): {
  bend?: boolean;
  vibrato?: boolean;
  slide?: 'up' | 'down';
  hammer?: boolean;
  hammerTarget?: number;
} {
  const effects: {
    bend?: boolean;
    vibrato?: boolean;
    slide?: 'up' | 'down';
    hammer?: boolean;
    hammerTarget?: number;
  } = {};
  
  const notations = noteElement.querySelector('notations');
  if (!notations) return effects;
  
  const technical = notations.querySelector('technical');
  const ornaments = notations.querySelector('ornaments');
  
  if (technical) {
    const bend = technical.querySelector('bend');
    if (bend) {
      effects.bend = true;
    }
  }
  
  if (ornaments) {
    const bend = ornaments.querySelector('bend');
    if (bend) {
      effects.bend = true;
    }
    
    const vibrato = ornaments.querySelector('vibrato');
    const wavyLine = ornaments.querySelector('wavy-line');
    if (vibrato || wavyLine) {
      effects.vibrato = true;
    }
  }
  
  if (technical) {
    const vibrato = technical.querySelector('vibrato');
    if (vibrato) {
      effects.vibrato = true;
    }
  }
  
  if (technical) {
    const hammerOn = technical.querySelector('hammer-on');
    if (hammerOn) {
      const type = hammerOn.getAttribute('type');
      if (type === 'start') {
        effects.hammer = true;
        const hammerText = hammerOn.textContent;
        if (hammerText && !isNaN(parseInt(hammerText))) {
          effects.hammerTarget = parseInt(hammerText);
        }
      }
    }
    
    const slide = technical.querySelector('slide');
    if (slide) {
      const type = slide.getAttribute('type');
      if (type === 'start') {
        effects.slide = 'up';
      }
    }
  }
  
  return effects;
}

/**
 * Импорт табулатуры из MusicXML формата.
 * Парсит XML-документ и извлекает структуру табулатуры, включая настройку струн,
 * временные сигнатуры, ноты и эффекты.
 * 
 * @param content - Содержимое MusicXML файла
 * @returns Promise с объектом TabData
 * @throws {Error} При ошибке парсинга XML
 */
export const importFromMusicXML = async (content: string): Promise<TabData> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) throw new Error('Ошибка парсинга MusicXML файла');

  const title = xmlDoc.querySelector('work-title')?.textContent || 'Imported Tab';
  const artist = xmlDoc.querySelector('creator')?.textContent || '';
  
  const tuning: string[] = [];
  const staffDetails = xmlDoc.querySelector('staff-details');
  if (staffDetails) {
    const staffTunings = staffDetails.querySelectorAll('staff-tuning');
    staffTunings.forEach((staffTuning) => {
      const step = staffTuning.querySelector('tuning-step')?.textContent || 'E';
      const alter = staffTuning.querySelector('tuning-alter')?.textContent;
      let finalStep = step;
      if (alter === '1') finalStep = step + '#';
      if (alter === '-1') finalStep = step + 'b';
      const octave = staffTuning.querySelector('tuning-octave')?.textContent || '4';
      tuning.push(`${finalStep}${octave}`);
    });
  }
  
  const finalTuning = tuning.length >= 4 ? tuning : ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  const tuningLength = finalTuning.length;
  const measures: TabMeasure[] = [];
  let globalNotesPerMeasure = 16;

  const measureElements = xmlDoc.querySelectorAll('measure');
  
  for (let measureIdx = 0; measureIdx < measureElements.length; measureIdx++) {
    const measure = measureElements[measureIdx];
    
    let divisions = 4;
    const attributes = measure.querySelector('attributes');
    if (attributes) {
      const divisionsElem = attributes.querySelector('divisions');
      if (divisionsElem && divisionsElem.textContent) {
        divisions = parseInt(divisionsElem.textContent);
      }
    }
    
    let beats = 4;
    let beatType = 4;
    if (attributes) {
      const timeSig = attributes.querySelector('time');
      if (timeSig) {
        const beatsElem = timeSig.querySelector('beats');
        const beatTypeElem = timeSig.querySelector('beat-type');
        if (beatsElem && beatsElem.textContent) beats = parseInt(beatsElem.textContent);
        if (beatTypeElem && beatTypeElem.textContent) beatType = parseInt(beatTypeElem.textContent);
      }
    }
    
    const SIXTEENTH_DIVISIONS = divisions / 4;
    
    const notesAtPositions: Map<number, Map<number, Note>> = new Map();
    let currentPosition = 0;
    
    const notes = measure.querySelectorAll('note');
    let pendingChord: Array<{
      stringIndex: number;
      fret: number;
      effects: ReturnType<typeof extractEffectsFromMusicXMLNote>;
    }> = [];
    let currentDuration = SIXTEENTH_DIVISIONS;
    
    for (let i = 0; i < notes.length; i++) {
      const noteElement = notes[i];
      const isRest = noteElement.querySelector('rest') !== null;
      const isChord = noteElement.getAttribute('chord') !== null;
      
      const durationElem = noteElement.querySelector('duration');
      if (durationElem && durationElem.textContent) {
        currentDuration = parseInt(durationElem.textContent);
      }
      
      let durationInSixteenths = Math.max(1, Math.round(currentDuration / SIXTEENTH_DIVISIONS));
      
      if (isRest) {
        if (pendingChord.length > 0) {
          pendingChord = [];
        }
        currentPosition += durationInSixteenths;
        continue;
      }
      
      const technical = noteElement.querySelector('technical');
      const stringEl = technical?.querySelector('string');
      const fretEl = technical?.querySelector('fret');
      
      if (stringEl && fretEl && stringEl.textContent && fretEl.textContent) {
        const stringIndex = parseInt(stringEl.textContent) - 1;
        const fret = parseInt(fretEl.textContent);
        
        if (stringIndex >= 0 && stringIndex < tuningLength && fret >= 0) {
          const effects = extractEffectsFromMusicXMLNote(noteElement);
          
          if (isChord) {
            pendingChord.push({ stringIndex, fret, effects });
          } else {
            if (pendingChord.length > 0) {
              if (!notesAtPositions.has(currentPosition)) {
                notesAtPositions.set(currentPosition, new Map());
              }
              const positionMap = notesAtPositions.get(currentPosition)!;
              
              pendingChord.forEach(({ stringIndex: idx, fret: f, effects: eff }) => {
                const note: Note = { fret: f };
                if (eff.bend) note.bend = true;
                if (eff.vibrato) note.vibrato = true;
                if (eff.slide) note.slide = eff.slide;
                
                if (eff.hammer) {
                  if (eff.hammerTarget) {
                    note.hammer = {
                      fromFret: f,
                      toFret: eff.hammerTarget
                    };
                  } else {
                    note.hammer = true;
                  }
                }
                
                positionMap.set(idx, note);
              });
              pendingChord = [];
              currentPosition += durationInSixteenths;
            }
            
            if (!notesAtPositions.has(currentPosition)) {
              notesAtPositions.set(currentPosition, new Map());
            }
            const positionMap = notesAtPositions.get(currentPosition)!;
            
            const note: Note = { fret };
            if (effects.bend) note.bend = true;
            if (effects.vibrato) note.vibrato = true;
            if (effects.slide) note.slide = effects.slide;
            
            if (effects.hammer) {
              if (effects.hammerTarget) {
                note.hammer = {
                  fromFret: fret,
                  toFret: effects.hammerTarget
                };
              } else {
                note.hammer = true;
              }
            }
            
            positionMap.set(stringIndex, note);
            
            const nextNote = notes[i + 1];
            if (nextNote && nextNote.getAttribute('chord') !== null) {
              pendingChord.push({ stringIndex, fret, effects });
            } else {
              currentPosition += durationInSixteenths;
            }
          }
        }
      }
    }
    
    if (pendingChord.length > 0) {
      if (!notesAtPositions.has(currentPosition)) {
        notesAtPositions.set(currentPosition, new Map());
      }
      const positionMap = notesAtPositions.get(currentPosition)!;
      
      pendingChord.forEach(({ stringIndex, fret, effects }) => {
        const note: Note = { fret };
        if (effects.bend) note.bend = true;
        if (effects.vibrato) note.vibrato = true;
        if (effects.slide) note.slide = effects.slide;
        
        if (effects.hammer) {
          if (effects.hammerTarget) {
            note.hammer = {
              fromFret: fret,
              toFret: effects.hammerTarget
            };
          } else {
            note.hammer = true;
          }
        }
        
        positionMap.set(stringIndex, note);
      });
      currentPosition += 1;
    }
    
    const positions = Array.from(notesAtPositions.keys()).sort((a, b) => a - b);
    const maxPosition = positions.length > 0 ? Math.max(...positions) + 1 : (beats === 4 && beatType === 4 ? 16 : beats);
    
    if (measureIdx === 0) {
      globalNotesPerMeasure = maxPosition;
    }
    
    const strings: any[] = [];
    for (let i = 0; i < tuningLength; i++) {
      const fullNotes: Note[] = Array.from({ length: maxPosition }, () => createEmptyNote());
      
      for (const [position, positionMap] of notesAtPositions.entries()) {
        const note = positionMap.get(i);
        if (note && position < maxPosition) {
          fullNotes[position] = note;
        }
      }
      
      strings.push({
        stringNumber: i,
        notes: fullNotes
      });
    }
    
    measures.push({
      id: `measure-${measureIdx}-${Date.now()}`,
      strings: strings,
      timeSignature: [beats, beatType],
      tempo: undefined
    });
  }

  if (measures.length === 0) {
    measures.push(createEmptyMeasure(tuningLength, globalNotesPerMeasure));
  }

  return {
    id: undefined, 
    userId: undefined, 
    title: title, 
    artist: artist, 
    tuning: finalTuning,
    measures: measures, 
    isPublic: false, 
    isOwn: true, 
    createdAt: new Date(), 
    updatedAt: new Date(),
    notesPerMeasure: globalNotesPerMeasure
  } as TabData;
};

/**
 * Основная функция импорта табулатуры с автоопределением формата.
 * Определяет формат по содержимому файла и вызывает соответствующий парсер.
 * Поддерживаемые форматы: JSON, Guitar Pro JSON, MusicXML.
 * 
 * @param content - Содержимое файла
 * @param fileName - Имя файла (опционально, используется для определения формата по расширению)
 * @returns Promise с объектом TabData
 * @throws {Error} При неизвестном формате или ошибке парсинга
 */
export const importTabFromFile = async (content: string, fileName?: string): Promise<TabData> => {
  const trimmedContent = content.trim();
  
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    try {
      const data = JSON.parse(trimmedContent);
      
      if (data.format === 'guitar-pro-compatible' || data.song || data.measures?.[0]?.voices) {
        return importFromGpJson(trimmedContent);
      }
      
      return importFromJson(trimmedContent);
    } catch (e) {
      // Невалидный JSON, пробуем другие форматы
    }
  }
  
  if (trimmedContent.startsWith('<?xml') || trimmedContent.startsWith('<score-partwise')) {
    return await importFromMusicXML(trimmedContent);
  }
  
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'musicxml' || ext === 'xml') {
      return await importFromMusicXML(content);
    }
    if (ext === 'gpjson' || ext === 'gp') {
      return importFromGpJson(content);
    }
    if (ext === 'json') {
      try {
        return importFromJson(content);
      } catch (e) {
        return importFromGpJson(content);
      }
    }
  }
  
  throw new Error('Неизвестный формат файла. Поддерживаются форматы: JSON, Guitar Pro JSON, MusicXML');
};