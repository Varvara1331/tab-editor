/**
 * @fileoverview Экспорт табулатур в различные форматы (MusicXML, PDF, текст, JSON, GP).
 * 
 * @module utils/exportFormats
 */

import { TabData, Note } from '../../types/tab';
import { escapeHtml, escapeXml } from '../stringUtils';

/**
 * Получение количества позиций в такте из первой струны
 * 
 * @param measure - Такт табулатуры
 * @returns Количество позиций (нот) в такте
 * @private
 */
const getNotesPerMeasure = (measure: any): number => {
  return measure.strings?.[0]?.notes?.length || 16;
};

/**
 * Преобразование количества позиций в отображаемый размер такта
 * 
 * @param notesPerMeasure - Количество позиций в такте
 * @returns Строка размера такта (например, '4/4', '16/16')
 * @private
 */
const getDisplayTimeSignature = (notesPerMeasure: number): string => {
  switch (notesPerMeasure) {
    case 4: return '4/4';
    case 8: return '8/8';
    case 16: return '16/16';
    default: return `${notesPerMeasure}/16`;
  }
};

/**
 * Получение целевого лада для хаммера
 * 
 * @param note - Нота
 * @returns Целевой лад или null
 * @private
 */
const getHammerTarget = (note: Note): number | null => {
  if (typeof note.hammer === 'number') return note.hammer;
  if (note.hammer && typeof note.hammer === 'object' && 'toFret' in note.hammer) {
    return (note.hammer as any).toFret;
  }
  return null;
};

/**
 * Получение целевого лада для пулла
 * 
 * @param note - Нота
 * @returns Целевой лад или null
 * @private
 */
const getPullTarget = (note: Note): number | null => {
  if (typeof note.pull === 'number') return note.pull;
  if (note.pull && typeof note.pull === 'object' && 'toFret' in note.pull) {
    return (note.pull as any).toFret;
  }
  return null;
};

/**
 * Экспорт табулатуры в формат MusicXML.
 * Генерирует XML-документ, совместимый со стандартом MusicXML 3.1.
 * Поддерживает нотацию TAB, строй гитары, бенды, хаммеры, пуллы, слайды и вибрато.
 * 
 * @param tabData - Данные табулатуры
 * @returns XML строка в формате MusicXML
 */
export const exportToMusicXML = (tabData: TabData): string => {
  const noteToMidi = (noteName: string): number => {
    const notes: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    const match = noteName.match(/^([A-Ga-g][#b]?)(\d+)$/);
    if (!match) return 40;
    const note = match[1].toUpperCase();
    const octave = parseInt(match[2]);
    const semitone = notes[note] || 0;
    return (octave + 1) * 12 + semitone;
  };
  
  const midiToNoteName = (midi: number): { step: string; alter: number; octave: number } => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    let step = noteNames[noteIndex];
    let alter = 0;
    if (step.includes('#')) { alter = 1; step = step[0]; }
    else if (step.includes('b')) { alter = -1; step = step[0]; }
    return { step, alter, octave };
  };
  
  const notesPerMeasure = tabData.notesPerMeasure || 
    tabData.measures[0]?.strings[0]?.notes?.length || 16;
  
  const DIVISIONS = notesPerMeasure;
  const DURATION = 1;
  const NOTE_TYPE = notesPerMeasure === 4 ? 'quarter' : notesPerMeasure === 8 ? 'eighth' : '16th';
  const numStrings = tabData.tuning.length;
  
  let slurCounter = 1;
  let slideCounter = 1;
  
  const activeSlurs: Map<string, { number: number; targetNote: { measureIndex: number; stringIndex: number; position: number } }> = new Map();
  const activeSlides: Map<string, { number: number; targetNote: { measureIndex: number; stringIndex: number; position: number } }> = new Map();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(tabData.title || 'Untitled')}</work-title>
  </work>
  <identification>
    <creator type="composer">${escapeXml(tabData.artist || 'Unknown')}</creator>
    <encoding>
      <software>Tab Editor</software>
      <encoding-date>${new Date().toISOString()}</encoding-date>
    </encoding>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Guitar</part-name>
      <part-abbreviation>Gtr.</part-abbreviation>
      <score-instrument id="P1-I1">
        <instrument-name>Acoustic Guitar</instrument-name>
      </score-instrument>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-program>25</midi-program>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">`;
  
  tabData.measures.forEach((measure, measureIndex) => {
    const measureSize = measure.strings[0]?.notes?.length || notesPerMeasure;
    const timeSignature = measure.timeSignature || 
      (measureSize === 4 ? [4,4] : measureSize === 8 ? [8,8] : [16,16]);
    
    xml += `
    <measure number="${measureIndex + 1}">
      <attributes>
        <divisions>${DIVISIONS}</divisions>
        <key>
          <fifths>0</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>${timeSignature[0]}</beats>
          <beat-type>${timeSignature[1]}</beat-type>
        </time>
        <clef>
          <sign>TAB</sign>
          <line>5</line>
        </clef>
        <staff-details>
          <staff-lines>${numStrings}</staff-lines>`;
    
    for (let i = 0; i < numStrings; i++) {
      const line = numStrings - i;
      const tuningNote = tabData.tuning[i];
      const match = tuningNote.match(/^([A-Ga-g][#b]?)(\d+)$/);
      
      if (match) {
        let step = match[1].toUpperCase();
        let alter = 0;
        
        const alterMap: { [key: string]: { step: string; alter: number } } = {
          'C#': { step: 'C', alter: 1 }, 'Db': { step: 'C', alter: -1 },
          'D#': { step: 'D', alter: 1 }, 'Eb': { step: 'D', alter: -1 },
          'F#': { step: 'F', alter: 1 }, 'Gb': { step: 'F', alter: -1 },
          'G#': { step: 'G', alter: 1 }, 'Ab': { step: 'G', alter: -1 },
          'A#': { step: 'A', alter: 1 }, 'Bb': { step: 'A', alter: -1 }
        };
        
        if (alterMap[step]) {
          step = alterMap[step].step;
          alter = alterMap[step].alter;
        }
        
        xml += `
          <staff-tuning line="${line}">
            <tuning-step>${step}</tuning-step>
            ${alter !== 0 ? `<tuning-alter>${alter}</tuning-alter>` : ''}
            <tuning-octave>${parseInt(match[2])}</tuning-octave>
          </staff-tuning>`;
      }
    }
    
    xml += `
        </staff-details>
      </attributes>`;
    
    for (let position = 0; position < measureSize; position++) {
      const notesAtThisPosition: Array<{
        stringIndex: number;
        fret: number;
        midi: number;
        noteName: { step: string; alter: number; octave: number };
        effects: Note;
        measureIndex: number;
        position: number;
      }> = [];
      
      for (let stringIdx = 0; stringIdx < numStrings; stringIdx++) {
        const stringNotes = measure.strings[stringIdx]?.notes;
        if (stringNotes && position < stringNotes.length) {
          const note = stringNotes[position];
          if (note && note.fret !== null && note.fret >= 0) {
            const baseMidi = noteToMidi(tabData.tuning[stringIdx]);
            const midiNumber = baseMidi + note.fret;
            const noteName = midiToNoteName(midiNumber);
            
            notesAtThisPosition.push({
              stringIndex: stringIdx + 1,
              fret: note.fret,
              midi: midiNumber,
              noteName,
              effects: note,
              measureIndex: measureIndex,
              position: position
            });
          }
        }
      }
      
      if (notesAtThisPosition.length === 0) {
        xml += `
        <note>
          <rest/>
          <duration>${DURATION}</duration>
          <voice>1</voice>
          <type>${NOTE_TYPE}</type>
        </note>`;
      } else {
        notesAtThisPosition.sort((a, b) => a.stringIndex - b.stringIndex);
        
        for (let i = 0; i < notesAtThisPosition.length; i++) {
          const note = notesAtThisPosition[i];
          const effect = note.effects;
          const noteKey = `${measureIndex}-${note.stringIndex}-${position}`;
          
          let isHammerTarget = false;
          let activeSlur = null;
          for (const [key, value] of activeSlurs.entries()) {
            if (value.targetNote.measureIndex === measureIndex &&
                value.targetNote.stringIndex === note.stringIndex &&
                value.targetNote.position === position) {
              isHammerTarget = true;
              activeSlur = value;
              break;
            }
          }
          
          let isSlideTarget = false;
          let activeSlide = null;
          for (const [key, value] of activeSlides.entries()) {
            if (value.targetNote.measureIndex === measureIndex &&
                value.targetNote.stringIndex === note.stringIndex &&
                value.targetNote.position === position) {
              isSlideTarget = true;
              activeSlide = value;
              break;
            }
          }
          
          xml += `
        <note>`;
          
          if (i > 0) {
            xml += `
          <chord/>`;
          }
          
          xml += `
          <pitch>
            <step>${note.noteName.step}</step>
            ${note.noteName.alter !== 0 ? `<alter>${note.noteName.alter}</alter>` : ''}
            <octave>${note.noteName.octave}</octave>
          </pitch>
          <duration>${DURATION}</duration>
          <voice>1</voice>
          <type>${NOTE_TYPE}</type>
          <notations>
            <technical>
              <string>${note.stringIndex}</string>
              <fret>${note.fret}</fret>`;
          
          if (effect.bend) {
            xml += `
              <bend>
                <bend-alter>2</bend-alter>
              </bend>`;
          }
          
          const hammerTarget = getHammerTarget(effect);
          const pullTarget = getPullTarget(effect);
          
          if (hammerTarget !== null && !isHammerTarget) {
            const slurNumber = slurCounter++;
            activeSlurs.set(noteKey, {
              number: slurNumber,
              targetNote: { measureIndex, stringIndex: note.stringIndex, position: position + 1 }
            });
            xml += `
              <hammer-on type="start" number="${slurNumber}">${hammerTarget}</hammer-on>`;
          } else if (pullTarget !== null && !isHammerTarget) {
            const slurNumber = slurCounter++;
            activeSlurs.set(noteKey, {
              number: slurNumber,
              targetNote: { measureIndex, stringIndex: note.stringIndex, position: position + 1 }
            });
            xml += `
              <pull-off type="start" number="${slurNumber}">${pullTarget}</pull-off>`;
          }
          
          if (isHammerTarget && activeSlur) {
            xml += `
              <hammer-on type="stop" number="${activeSlur.number}"/>`;
            activeSlurs.delete(noteKey);
          }
          
          if (effect.slide === 'up' || effect.slide === 'down') {
            const slideNumber = slideCounter++;
            activeSlides.set(noteKey, {
              number: slideNumber,
              targetNote: { measureIndex, stringIndex: note.stringIndex, position: position + 1 }
            });
            xml += `
              <slide line-type="solid" type="start" number="${slideNumber}"/>`;
          }
          
          if (isSlideTarget && activeSlide) {
            xml += `
              <slide line-type="solid" type="stop" number="${activeSlide.number}"/>`;
            activeSlides.delete(noteKey);
          }
          
          xml += `
            </technical>`;
          
          if ((hammerTarget !== null || pullTarget !== null) && !isHammerTarget) {
            const slurNumber = slurCounter - 1;
            xml += `
            <slur type="start" number="${slurNumber}"/>`;
          } else if (isHammerTarget && activeSlur) {
            xml += `
            <slur type="stop" number="${activeSlur.number}"/>`;
          }
          
          if ((effect.slide === 'up' || effect.slide === 'down') && !isSlideTarget) {
            const slideSlurNumber = slideCounter - 1;
            xml += `
            <slur type="start" number="${slideSlurNumber}"/>`;
          } else if (isSlideTarget && activeSlide) {
            xml += `
            <slur type="stop" number="${activeSlide.number}"/>`;
          }
          
          if (effect.vibrato) {
            xml += `
            <ornaments>
              <vibrato/>
            </ornaments>`;
          }
          
          xml += `
          </notations>
        </note>`;
        }
      }
    }
    
    xml += `
    </measure>`;
  });
  
  xml += `
  </part>
</score-partwise>`;
  
  return xml;
};

/**
 * Экспорт табулатуры в PDF.
 * Генерирует PDF-документ с нотацией табулатуры в виде стандартных шестилинейных табов.
 * Поддерживает многостраничный вывод, заголовок, информацию о табулатуре и номера страниц.
 * 
 * @param tabData - Данные табулатуры
 * @returns Promise с Blob PDF файла
 */
export const exportToPDF = async (tabData: TabData): Promise<Blob> => {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default;
  const jspdfModule = await import('jspdf');
  const jsPDF = jspdfModule.default;

  const numStrings = tabData.tuning.length;
  const firstMeasureSize = tabData.measures[0] ? getNotesPerMeasure(tabData.measures[0]) : 16;
  const displayTimeSignature = getDisplayTimeSignature(firstMeasureSize);
  
  const STRING_SPACING = 41;
  const STAFF_HEIGHT = (numStrings - 1) * STRING_SPACING;
  const STAFF_TOP_OFFSET = 22;
  const POSITION_WIDTH = 79;
  
  let MEASURES_PER_ROW = 4;
  if (firstMeasureSize === 8) {
    MEASURES_PER_ROW = 2;
  } else if (firstMeasureSize === 16) {
    MEASURES_PER_ROW = 1;
  }
  
  const ROW_HEIGHT = STAFF_HEIGHT + STAFF_TOP_OFFSET + 50;
  const HEADER_HEIGHT = 230;
  const FOOTER_HEIGHT = 70;
  const PAGE_HEIGHT_PX = 1123;
  const CONTENT_HEIGHT = PAGE_HEIGHT_PX - HEADER_HEIGHT - FOOTER_HEIGHT;
  const MAX_ROWS_PER_PAGE = 5;
  
  const rows: typeof tabData.measures[] = [];
  for (let i = 0; i < tabData.measures.length; i += MEASURES_PER_ROW) {
    rows.push(tabData.measures.slice(i, i + MEASURES_PER_ROW));
  }
  
  const pages: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += MAX_ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + MAX_ROWS_PER_PAGE));
  }
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx];
    const pageNumber = pageIdx + 1;
    const totalPages = pages.length;
    
    const pageContainer = document.createElement('div');
    pageContainer.style.cssText = `
      width: 1300px;
      background: white;
      padding: 20px;
      font-family: monospace;
      position: absolute;
      left: -9999px;
      top: -9999px;
    `;
    
    let pageHtml = `
      <div style="font-family:monospace;background:#ffffff;">
        <div style="text-align:center;margin-bottom:30px;">
          <h1 style="color:#000000;margin:0 0 15px 0;font-size:35px;font-weight:bold;">${escapeHtml(tabData.title)}</h1>`;
    
    if (tabData.artist) {
      pageHtml += `<h3 style="color:#000000;margin:0 0 22px 0;font-size:26px;">${escapeHtml(tabData.artist)}</h3>`;
    }
    
    pageHtml += `
          <div style="text-align:center;margin-bottom:35px;color:#000000;font-size:17px;">
            <p style="margin:5px 0;"><strong>Строй:</strong> ${tabData.tuning.join(' ')} &nbsp;|&nbsp; 
               <strong>Размер такта:</strong> ${displayTimeSignature} &nbsp;|&nbsp;
               <strong>Количество тактов:</strong> ${tabData.measures.length}</p>
          </div>
          <hr style="border-color:#000000;margin-bottom:30px;width:100%;"/>
        </div>`;
    
    pageRows.forEach((row, rowIndex) => {
      const actualWidth = row.reduce((sum, measure) => sum + (getNotesPerMeasure(measure) * POSITION_WIDTH), 0);
      
      pageHtml += `<div style="margin-bottom:22px;margin-left:-50px;">
        <div style="position:relative;">`;
      
      pageHtml += `<div style="display:flex;margin-left:115px;margin-bottom:12px;">`;
      row.forEach((measure) => {
        const notesPerMeasure = getNotesPerMeasure(measure);
        const measureWidth = notesPerMeasure * POSITION_WIDTH;
        const globalMeasureIndex = tabData.measures.findIndex(m => m.id === measure.id);
        pageHtml += `<div style="width:${measureWidth}px;text-align:center;font-size:19px;font-weight:bold;color:#000000;">
          ${globalMeasureIndex + 1}
        </div>`;
      });
      pageHtml += `</div>`;
      
      pageHtml += `<div style="position:relative;margin-left:115px;width:${actualWidth}px;">`;
      
      for (let s = 0; s < numStrings; s++) {
        const lineTop = s * STRING_SPACING + STAFF_TOP_OFFSET;
        pageHtml += `<div style="position:absolute;left:0;right:0;top:${lineTop}px;height:2.5px;background:#000000;"></div>`;
      }
      
      const startLineTop = STAFF_TOP_OFFSET - 8;
      const lineHeight = STAFF_HEIGHT + 16;
      pageHtml += `<div style="position:absolute;left:-8px;top:${startLineTop}px;width:3px;height:${lineHeight}px;background:#000000;"></div>`;
      
      pageHtml += `<div style="position:absolute;left:-115px;top:0;width:105px;">`;
      for (let s = 0; s < numStrings; s++) {
        const lineY = s * STRING_SPACING + STAFF_TOP_OFFSET - 15;
        pageHtml += `<div style="position:absolute;left:0;top:${lineY}px;width:105px;text-align:right;font-family:monospace;font-size:20px;font-weight:bold;padding-right:12px;color:#000000;">
          ${escapeHtml(tabData.tuning[numStrings - 1 - s])}
        </div>`;
      }
      pageHtml += `</div>`;
      
      let measureStartPosition = 0;
      
      row.forEach((measure, measureIdx) => {
        const notesPerMeasure = getNotesPerMeasure(measure);
        const measureStartX = measureStartPosition * POSITION_WIDTH;
        
        if (measureIdx > 0) {
          const lineTop = STAFF_TOP_OFFSET - 8;
          const lineHeight = STAFF_HEIGHT + 16;
          pageHtml += `<div style="position:absolute;left:${measureStartX}px;top:${lineTop}px;width:2.5px;height:${lineHeight}px;background:#000000;"></div>`;
        }
        
        for (let pos = 0; pos < notesPerMeasure; pos++) {
          const cellLeft = (measureStartPosition + pos) * POSITION_WIDTH;
          
          for (let s = 0; s < numStrings; s++) {
            const stringNotes = measure.strings[s]?.notes || [];
            if (pos < stringNotes.length) {
              const note = stringNotes[pos];
              
              let isSlideTarget = false;
              let slideFromFret: number | null = null;
              let slideDirection: string | null = null;
              
              if (pos > 0) {
                const prevNotes = measure.strings[s]?.notes;
                if (prevNotes && prevNotes[pos - 1]) {
                  const prevNote = prevNotes[pos - 1];
                  if (prevNote.slide === 'up' || prevNote.slide === 'down') {
                    isSlideTarget = true;
                    slideFromFret = prevNote.fret;
                    slideDirection = prevNote.slide;
                  }
                }
              }
              
              if (isSlideTarget) {
                continue;
              }
              
              if (note && note.fret !== null && note.fret >= 0) {
                const lineY = s * STRING_SPACING + STAFF_TOP_OFFSET - 15;
                
                let symbol = note.fret.toString();
                let effectHtml = '';
                
                if (note.bend) {
                  effectHtml = `<span style="font-size:32px;font-weight:bold;margin-left:4px;">⤴</span>`;
                } else if (note.slide === 'up') {
                  let nextFret: number | null = null;
                  
                  if (pos + 1 < notesPerMeasure) {
                    const nextNotes = measure.strings[s]?.notes;
                    if (nextNotes && nextNotes[pos + 1] && nextNotes[pos + 1].fret !== null) {
                      nextFret = nextNotes[pos + 1].fret;
                    }
                  }
                  
                  if (nextFret !== null) {
                    effectHtml = `<span style="font-size:28px;font-weight:bold;margin-left:4px;margin-right:4px;">/</span><span style="font-size:32px;font-weight:bold;">${nextFret}</span>`;
                  } else {
                    effectHtml = `<span style="font-size:32px;font-weight:bold;margin-left:4px;">/</span>`;
                  }
                } else if (note.slide === 'down') {
                  let nextFret: number | null = null;
                  
                  if (pos + 1 < notesPerMeasure) {
                    const nextNotes = measure.strings[s]?.notes;
                    if (nextNotes && nextNotes[pos + 1] && nextNotes[pos + 1].fret !== null) {
                      nextFret = nextNotes[pos + 1].fret;
                    }
                  }
                  
                  if (nextFret !== null) {
                    effectHtml = `<span style="font-size:28px;font-weight:bold;margin-left:4px;margin-right:4px;">\\</span><span style="font-size:32px;font-weight:bold;">${nextFret}</span>`;
                  } else {
                    effectHtml = `<span style="font-size:32px;font-weight:bold;margin-left:4px;">\\</span>`;
                  }
                } else if (getHammerTarget(note) !== null) {
                  const target = getHammerTarget(note);
                  effectHtml = `<span style="font-size:28px;font-weight:bold;margin-left:4px;">h${target}</span>`;
                } else if (getPullTarget(note) !== null) {
                  const target = getPullTarget(note);
                  effectHtml = `<span style="font-size:28px;font-weight:bold;margin-left:4px;">p${target}</span>`;
                } else if (note.vibrato) {
                  effectHtml = `<span style="font-size:32px;font-weight:bold;margin-left:4px;">~</span>`;
                }
                
                const textX = cellLeft + (POSITION_WIDTH / 2);
                
                pageHtml += `<div style="position:absolute;left:${textX}px;top:${lineY}px;transform:translateX(-50%);text-align:center;font-family:monospace;font-size:32px;font-weight:bold;background:#ffffff;color:#000000;z-index:10;white-space:nowrap;">
                  ${escapeHtml(symbol)}${effectHtml}
                </div>`;
              }
            }
          }
        }
        
        const measureEndX = (measureStartPosition + notesPerMeasure) * POSITION_WIDTH;
        const lineTop = STAFF_TOP_OFFSET - 8;
        const lineHeightTotal = STAFF_HEIGHT + 16;
        pageHtml += `<div style="position:absolute;left:${measureEndX}px;top:${lineTop}px;width:2.5px;height:${lineHeightTotal}px;background:#000000;"></div>`;
        
        measureStartPosition += notesPerMeasure;
      });
      
      pageHtml += `<div style="height:${STAFF_HEIGHT + STAFF_TOP_OFFSET + 30}px;"></div>`;
      pageHtml += `</div>`;
      pageHtml += `</div></div>`;
    });
    
    pageHtml += `
      <div style="text-align:center;margin-top:30px;">
        <hr style="border-color:#000000;width:100%;margin:10px auto;"/>
        <p style="font-size:15px;color:#666666;margin:5px 0;">
          ${escapeHtml(tabData.title)}${tabData.artist ? ` - ${escapeHtml(tabData.artist)}` : ''} • Страница ${pageNumber} из ${totalPages} • ${new Date().toLocaleString()}
        </p>
      </div>
    </div>`;
    
    pageContainer.innerHTML = pageHtml;
    document.body.appendChild(pageContainer);
    
    const canvas = await html2canvas(pageContainer, {
      logging: false,
      useCORS: false,
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    if (pageIdx > 0) {
      pdf.addPage();
    }
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const xOffset = (210 - imgWidth) / 2;
    
    pdf.addImage(imgData, 'PNG', xOffset, 10, imgWidth, imgHeight);
    
    document.body.removeChild(pageContainer);
  }
  
  return pdf.output('blob');
};

/**
 * Экспорт табулатуры в текстовый формат.
 * Генерирует ASCII-представление табулатуры с номерами ладов и эффектами.
 * 
 * @param tabData - Данные табулатуры
 * @returns Текстовая строка с табулатурой в ASCII-формате
 */
export const exportToText = (tabData: TabData): string => {
  const { title, artist, tuning, measures } = tabData;
  const firstMeasureSize = measures[0] ? getNotesPerMeasure(measures[0]) : 16;
  const displayTimeSignature = getDisplayTimeSignature(firstMeasureSize);
  
  let result = `${title}\n`;
  if (artist) result += `${artist}\n`;
  result += `${'='.repeat(50)}\n`;
  result += `Строй: ${tuning.join(' ')}\n`;
  result += `Размер такта: ${displayTimeSignature}\n`;
  result += `Количество тактов: ${measures.length}\n`;
  result += `${'='.repeat(50)}\n\n`;
  
  measures.forEach((measure, mIndex) => {
    const notesPerMeasure = getNotesPerMeasure(measure);
    const measureDisplaySize = getDisplayTimeSignature(notesPerMeasure);
    result += `Такт ${mIndex + 1} (${measureDisplaySize})\n`;
    
    for (let s = 0; s < tuning.length; s++) {
      const stringNotes = measure.strings[s]?.notes || [];
      result += `${tuning[s]}│`;
      
      stringNotes.forEach((note: Note) => {
        if (note.fret === null) {
          result += '--';
        } else {
          const fretStr = note.fret.toString().padStart(2, '0');
          if (note.bend) {
            result += `(${fretStr})`;
          } else if (note.slide === 'up') {
            result += `${fretStr}/`;
          } else if (note.slide === 'down') {
            result += `\\${fretStr}`;
          } else if (getHammerTarget(note) !== null) {
            const target = getHammerTarget(note);
            result += `${fretStr}h${target}`;
          } else if (getPullTarget(note) !== null) {
            const target = getPullTarget(note);
            result += `${fretStr}p${target}`;
          } else if (note.vibrato) {
            result += `${fretStr}~`;
          } else {
            result += fretStr;
          }
        }
      });
      result += '\n';
    }
    result += '\n';
  });
  
  return result;
};

/**
 * Экспорт табулатуры в JSON формат.
 * Сохраняет полные данные табулатуры в структурированном JSON-формате для последующего импорта.
 * 
 * @param tabData - Данные табулатуры
 * @returns Blob с JSON данными
 */
export const exportToJSON = (tabData: TabData): Blob => {
  const notesPerMeasure = tabData.measures[0]?.strings[0]?.notes?.length || 16;
  const exportData = {
    version: "1.1",
    notesPerMeasure: notesPerMeasure,
    displayTimeSignature: getDisplayTimeSignature(notesPerMeasure),
    ...tabData
  };
  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
};

/**
 * Экспорт табулатуры в Guitar Pro JSON формат.
 * Генерирует JSON, совместимый с форматом Guitar Pro, для совместимости с другими приложениями.
 * 
 * @param tabData - Данные табулатуры
 * @returns Blob с GP JSON данными
 */
export const exportToGP = (tabData: TabData): Blob => {
  const notesPerMeasure = tabData.measures[0]?.strings[0]?.notes?.length || 16;
  
  const gpData = {
    version: "1.0",
    format: "guitar-pro-compatible",
    title: tabData.title,
    artist: tabData.artist || "",
    tuning: tabData.tuning,
    notesPerMeasure: notesPerMeasure,
    displayTimeSignature: getDisplayTimeSignature(notesPerMeasure),
    measures: tabData.measures.map(measure => ({
      id: measure.id,
      timeSignature: measure.timeSignature || [4, 4],
      notesPerMeasure: getNotesPerMeasure(measure),
      strings: measure.strings.map(string => ({
        stringNumber: string.stringNumber,
        notes: string.notes.map(note => {
          if (note.fret === null) return { fret: null };
          
          const gpNote: any = { fret: note.fret };
          
          if (note.bend) {
            gpNote.effect = "bend";
          } else if (note.slide === 'up') {
            gpNote.effect = "slide_up";
          } else if (note.slide === 'down') {
            gpNote.effect = "slide_down";
          } else if (getHammerTarget(note) !== null) {
            gpNote.effect = "hammer_on";
            gpNote.hammerTarget = getHammerTarget(note);
          } else if (getPullTarget(note) !== null) {
            gpNote.effect = "pull_off";
            gpNote.pullTarget = getPullTarget(note);
          } else if (note.vibrato) {
            gpNote.effect = "vibrato";
          }
          
          return gpNote;
        })
      }))
    }))
  };
  
  return new Blob([JSON.stringify(gpData, null, 2)], { 
    type: 'application/json' 
  });
};