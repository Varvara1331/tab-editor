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
 * Создание ноты из импортированных данных с эффектами
 * 
 * @param importedNote - Импортированные данные ноты
 * @returns Объект Note
 */
export const createNoteFromImport = (importedNote: any): Note => {
  if (importedNote.fret === undefined || importedNote.fret === null) return { fret: null };
  
  const note: Note = { fret: importedNote.fret };
  
  // Обработка bend
  if (importedNote.bend === true || importedNote.bend === 'true' || importedNote.bend === 1) {
    note.bend = true;
  }
  
  // Обработка slide
  if (importedNote.slide) {
    if (importedNote.slide === 'up') {
      note.slide = 'up';
    } else if (importedNote.slide === 'down') {
      note.slide = 'down';
    }
  }
  
  // Обработка hammer
  if (importedNote.hammer === true || importedNote.hammer === 'true' || importedNote.hammer === 1) {
    note.hammer = true;
  }
  
  // Обработка pull
  if (importedNote.pull === true || importedNote.pull === 'true' || importedNote.pull === 1) {
    note.pull = true;
  }
  
  // Обработка vibrato
  if (importedNote.vibrato === true || importedNote.vibrato === 'true' || importedNote.vibrato === 1) {
    note.vibrato = true;
  }
  
  // Обработка effect (из Guitar Pro формата)
  if (importedNote.effect) {
    switch (importedNote.effect) {
      case 'bend':
        note.bend = true;
        break;
      case 'hammer_on':
      case 'hammer':
        note.hammer = true;
        break;
      case 'pull_off':
      case 'pull':
        note.pull = true;
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
  
  // Обработка эффектов из MusicXML
  if (importedNote.notations) {
    const notations = importedNote.notations;
    if (notations.ornaments) {
      if (notations.ornaments.bend) note.bend = true;
      if (notations.ornaments.wavyLine) note.vibrato = true;
    }
    if (notations.technical) {
      if (notations.technical.hammerOn) note.hammer = true;
      if (notations.technical.pullOff) note.pull = true;
      if (notations.technical.slide) {
        note.slide = notations.technical.slide === 'up' ? 'up' : 'down';
      }
    }
  }
  
  return note;
};

/**
 * Импорт табулатуры из JSON файла
 * 
 * @param content - Содержимое JSON файла
 * @param tuningLength - Количество струн (по умолчанию 6)
 * @returns Объект TabData
 * @throws {Error} При неверном формате JSON
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
    
    // Добавляем недостающие струны
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
 * Импорт табулатуры из Guitar Pro JSON формата
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
      
      // Инициализируем пустые струны
      for (let i = 0; i < tuningLength; i++) {
        strings.push({ 
          stringNumber: i, 
          notes: Array.from({ length: measureNotesCount }, () => createEmptyNote()) 
        });
      }
      
      // Собираем все ноты из разных мест
      const allNotes: any[] = [];
      if (gpMeasure.notes) allNotes.push(...gpMeasure.notes);
      if (gpMeasure.voices) {
        gpMeasure.voices.forEach((voice: any) => { 
          if (voice.notes) allNotes.push(...voice.notes); 
        });
      }
      
      // Распределяем ноты по позициям
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
 * Импорт табулатуры из MusicXML формата
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
  
  // Извлекаем настройку струн из MusicXML
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
  
  // Если не нашли настройку, используем стандартную
  const finalTuning = tuning.length === 6 ? tuning : ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  const tuningLength = finalTuning.length;
  const measures: TabMeasure[] = [];
  let globalNotesPerMeasure = 16;

  const measureElements = xmlDoc.querySelectorAll('measure');
  
  for (let measureIdx = 0; measureIdx < measureElements.length; measureIdx++) {
    const measure = measureElements[measureIdx];
    
    // Получаем divisions (количество делений на четверть)
    let divisions = 16;
    const attributes = measure.querySelector('attributes');
    if (attributes) {
      const divisionsElem = attributes.querySelector('divisions');
      if (divisionsElem && divisionsElem.textContent) {
        divisions = parseInt(divisionsElem.textContent);
      }
    }
    
    // Получаем временную сигнатуру
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
    
    // Вычисляем количество 16-х нот в такте
    let notesPerMeasure = beats;
    
    // Для первого такта сохраняем глобальный размер
    if (measureIdx === 0) {
      globalNotesPerMeasure = notesPerMeasure;
    }
    
    // Создаем пустые струны с правильным количеством позиций
    const strings: any[] = [];
    for (let i = 0; i < tuningLength; i++) {
      strings.push({ 
        stringNumber: i, 
        notes: Array.from({ length: notesPerMeasure }, () => createEmptyNote()) 
      });
    }
    
    // Собираем все ноты такта
    const notes = measure.querySelectorAll('note');
    let currentSixteenthPosition = 0;
    let chordNotes: { stringIndex: number; fret: number; effects: any }[] = [];
    
    for (let i = 0; i < notes.length; i++) {
      const noteElement = notes[i];
      const isRest = noteElement.querySelector('rest') !== null;
      const isChord = noteElement.getAttribute('chord') !== null;
      
      let durationDivisions = 0;
      const durationElem = noteElement.querySelector('duration');
      if (durationElem && durationElem.textContent) {
        durationDivisions = parseInt(durationElem.textContent);
      }
      
      let durationInSixteenths = 1;
      if (durationDivisions > 0 && divisions > 0) {
        durationInSixteenths = (durationDivisions * 16) / divisions;
        durationInSixteenths = Math.max(1, Math.round(durationInSixteenths));
      }
      
      if (isRest) {
        if (chordNotes.length > 0) {
          chordNotes.forEach(({ stringIndex, fret, effects }) => {
            if (currentSixteenthPosition < notesPerMeasure && strings[stringIndex]?.notes[currentSixteenthPosition]) {
              strings[stringIndex].notes[currentSixteenthPosition] = { fret, ...effects };
            }
          });
          chordNotes = [];
        }
        currentSixteenthPosition += durationInSixteenths;
      } else {
        const technical = noteElement.querySelector('technical');
        const stringEl = technical?.querySelector('string');
        const fretEl = technical?.querySelector('fret');
        
        if (stringEl && fretEl && stringEl.textContent && fretEl.textContent) {
          const stringIndex = parseInt(stringEl.textContent) - 1;
          const fret = parseInt(fretEl.textContent);
          
          if (stringIndex >= 0 && stringIndex < tuningLength && fret >= 0) {
            const effects: any = {};
            const notations = noteElement.querySelector('notations');
            if (notations) {
              const ornaments = notations.querySelector('ornaments');
              const technical2 = notations.querySelector('technical');
              
              if (ornaments) {
                if (ornaments.querySelector('bend')) effects.bend = true;
                if (ornaments.querySelector('wavy-line')) effects.vibrato = true;
              }
              if (technical2) {
                if (technical2.querySelector('hammer-on')) effects.hammer = true;
                if (technical2.querySelector('pull-off')) effects.pull = true;
                if (technical2.querySelector('slide')) effects.slide = 'up';
              }
            }
            
            if (isChord) {
              chordNotes.push({ stringIndex, fret, effects });
            } else {
              if (chordNotes.length > 0) {
                chordNotes.forEach(({ stringIndex: idx, fret: f, effects: eff }) => {
                  if (currentSixteenthPosition < notesPerMeasure && strings[idx]?.notes[currentSixteenthPosition]) {
                    strings[idx].notes[currentSixteenthPosition] = { fret: f, ...eff };
                  }
                });
                chordNotes = [];
                currentSixteenthPosition += durationInSixteenths;
              }
              
              const nextNote = notes[i + 1];
              if (nextNote && nextNote.getAttribute('chord') !== null) {
                chordNotes.push({ stringIndex, fret, effects });
              } else {
                if (currentSixteenthPosition < notesPerMeasure && strings[stringIndex]?.notes[currentSixteenthPosition]) {
                  strings[stringIndex].notes[currentSixteenthPosition] = { fret, ...effects };
                }
                currentSixteenthPosition += durationInSixteenths;
              }
            }
          }
        } else {
          if (chordNotes.length > 0) {
            chordNotes = [];
          }
          currentSixteenthPosition += durationInSixteenths;
        }
      }
    }
    
    if (chordNotes.length > 0) {
      chordNotes.forEach(({ stringIndex, fret, effects }) => {
        if (currentSixteenthPosition < notesPerMeasure && strings[stringIndex]?.notes[currentSixteenthPosition]) {
          strings[stringIndex].notes[currentSixteenthPosition] = { fret, ...effects };
        }
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
 * Извлечение эффектов из MusicXML ноты
 * 
 * @param noteElement - XML элемент ноты
 * @returns Объект с эффектами
 * @private
 */
function extractEffectsFromMusicXMLNote(noteElement: Element): any {
  const effectNote: any = {};
  const notations = noteElement.querySelector('notations');
  
  if (notations) {
    const ornaments = notations.querySelector('ornaments');
    const technical = notations.querySelector('technical');
    
    if (ornaments) {
      if (ornaments.querySelector('bend')) effectNote.bend = true;
      if (ornaments.querySelector('wavy-line')) effectNote.vibrato = true;
    }
    
    if (technical) {
      if (technical.querySelector('hammer-on')) effectNote.hammer = true;
      if (technical.querySelector('pull-off')) effectNote.pull = true;
      if (technical.querySelector('slide')) {
        const slide = technical.querySelector('slide');
        const slideType = slide?.getAttribute('type');
        effectNote.slide = slideType === 'slide-up' || slideType === 'up' ? 'up' : 'down';
      }
    }
  }
  
  return effectNote;
}