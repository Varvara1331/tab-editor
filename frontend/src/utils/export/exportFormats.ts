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
 * Получение целевого лада для хаммера (поддержка обоих форматов: число или объект)
 */
const getHammerTarget = (note: Note): number | null => {
  if (typeof note.hammer === 'number') return note.hammer;
  if (note.hammer && typeof note.hammer === 'object' && 'toFret' in note.hammer) {
    return (note.hammer as any).toFret;
  }
  return null;
};

/**
 * Получение целевого лада для пулла (поддержка обоих форматов: число или объект)
 */
const getPullTarget = (note: Note): number | null => {
  if (typeof note.pull === 'number') return note.pull;
  if (note.pull && typeof note.pull === 'object' && 'toFret' in note.pull) {
    return (note.pull as any).toFret;
  }
  return null;
};

/**
 * Экспорт табулатуры в формат MusicXML
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
    
    // Настройка струн
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
    
    // Генерируем каждую позицию в такте
    for (let position = 0; position < measureSize; position++) {
      // Собираем ВСЕ ноты на этой конкретной позиции со всех струн
      const notesAtThisPosition: Array<{
        stringIndex: number;
        fret: number;
        midi: number;
        noteName: { step: string; alter: number; octave: number };
        effects: Note;
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
              effects: note
            });
          }
        }
      }
      
      if (notesAtThisPosition.length === 0) {
        // Пауза
        xml += `
        <note>
          <rest/>
          <duration>${DURATION}</duration>
          <voice>1</voice>
          <type>${NOTE_TYPE}</type>
        </note>`;
      } else {
        // Сортируем ноты аккорда по номеру струны (от нижней к верхней)
        notesAtThisPosition.sort((a, b) => a.stringIndex - b.stringIndex);
        
        // Генерируем все ноты аккорда
        for (let i = 0; i < notesAtThisPosition.length; i++) {
          const note = notesAtThisPosition[i];
          
          // Открываем тег note
          xml += `
        <note>`;
          
          // Добавляем тег chord для всех нот, кроме первой
          if (i > 0) {
            xml += `
          <chord/>`;
          }
          
          // Добавляем pitch
          xml += `
          <pitch>
            <step>${note.noteName.step}</step>
            ${note.noteName.alter !== 0 ? `<alter>${note.noteName.alter}</alter>` : ''}
            <octave>${note.noteName.octave}</octave>
          </pitch>
          <duration>${DURATION}</duration>
          <voice>1</voice>
          <type>${NOTE_TYPE}</type>`;
          
          // Добавляем notations с эффектами
          xml += `
          <notations>
            <technical>
              <string>${note.stringIndex}</string>
              <fret>${note.fret}</fret>`;
          
          // Бенд
          if (note.effects.bend) {
            xml += `
              <bend>
                <bend-alter>2</bend-alter>
              </bend>`;
          }
          
          // Слайд
          if (note.effects.slide === 'up') {
            xml += `
              <slide type="start"/>`;
          } else if (note.effects.slide === 'down') {
            xml += `
              <slide type="start"/>`;
          }
          
          // Хаммер
          const hammerTarget = getHammerTarget(note.effects);
          if (hammerTarget !== null) {
            xml += `
              <hammer-on>${hammerTarget}</hammer-on>`;
          }
          
          // Пулл
          const pullTarget = getPullTarget(note.effects);
          if (pullTarget !== null) {
            xml += `
              <pull-off>${pullTarget}</pull-off>`;
          }
          
          xml += `
            </technical>`;
          
          // Вибрато (в ornaments, не в technical)
          if (note.effects.vibrato) {
            xml += `
            <ornaments>
              <wavy-line type="start"/>
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
 * Экспорт табулатуры в PDF
 * 
 * @param tabData - Данные табулатуры
 * @returns Promise с Blob PDF файла
 */
export const exportToPDF = async (tabData: TabData): Promise<Blob> => {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default;
  const jspdfModule = await import('jspdf');
  const jsPDF = jspdfModule.default;

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1200px;background:white;padding:20px;font-family:monospace';
  
  const firstMeasureSize = tabData.measures[0] ? getNotesPerMeasure(tabData.measures[0]) : 16;
  const displayTimeSignature = getDisplayTimeSignature(firstMeasureSize);
  
  let html = `<div style="font-family:monospace;max-width:1100px;margin:0 auto">
    <h1 style="text-align:center">${escapeHtml(tabData.title)}</h1>`;
  
  if (tabData.artist) {
    html += `<h3 style="text-align:center">${escapeHtml(tabData.artist)}</h3>`;
  }
  
  html += `
    <div style="text-align:center;margin-bottom:20px">
      <p><strong>Строй:</strong> ${tabData.tuning.join(' ')}</p>
      <p><strong>Размер такта:</strong> ${displayTimeSignature}</p>
      <p><strong>Количество тактов:</strong> ${tabData.measures.length}</p>
    </div>
    <hr/>`;
  
  // Группируем такты в строки
  type MeasureRow = typeof tabData.measures;
  const rows: MeasureRow[] = [];
  let currentRow: MeasureRow = [];
  let currentRowPositions = 0;
  
  tabData.measures.forEach((measure) => {
    const notesPerMeasure = getNotesPerMeasure(measure);
    
    if (currentRowPositions + notesPerMeasure > 16 && currentRow.length > 0) {
      rows.push([...currentRow]);
      currentRow = [measure];
      currentRowPositions = notesPerMeasure;
    } else {
      currentRow.push(measure);
      currentRowPositions += notesPerMeasure;
    }
  });
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  const ROW_WIDTH = 900;
  
  rows.forEach((row) => {
    const totalPositionsInRow = row.reduce((sum, measure) => sum + getNotesPerMeasure(measure), 0);
    const positionWidth = ROW_WIDTH / totalPositionsInRow;
    
    html += `<div style="margin-bottom:30px;page-break-inside:avoid">
      <div style="display:flex;align-items:stretch;gap:0;border:1px solid #ccc;background:#fff;">`;
    
    // Левая колонка с названиями струн
    html += `<div style="flex-shrink:0;width:60px;background:#f9f9f9;border-right:2px solid #000;">`;
    for (let s = 0; s < tabData.tuning.length; s++) {
      html += `<div style="height:30px;padding:4px 8px;font-weight:bold;border-bottom:1px solid #ddd;text-align:right">${escapeHtml(tabData.tuning[s])}</div>`;
    }
    html += `</div>`;
    
    // Такты в строке
    html += `<div style="display:flex;flex:1;gap:0;">`;
    
    row.forEach((measure, idx) => {
      const notesPerMeasure = getNotesPerMeasure(measure);
      const measureWidth = notesPerMeasure * positionWidth;
      const isLastInRow = idx === row.length - 1;
      
      html += `<div style="flex-shrink:0;width:${measureWidth}px;border-right:${isLastInRow ? '2px solid #000' : '1px solid #ccc'};">`;
      
      const globalMeasureIndex = tabData.measures.findIndex(m => m.id === measure.id);
      html += `<div style="text-align:center;padding:4px;font-size:12px;font-weight:bold;border-bottom:1px solid #ccc;background:#f0f0f0">
        ${globalMeasureIndex + 1}
      </div>`;
      
      for (let s = 0; s < tabData.tuning.length; s++) {
        const stringNotes = measure.strings[s]?.notes || [];
        html += `<div style="display:flex;height:30px;border-bottom:1px solid #ddd;">`;
        
        stringNotes.forEach((note: Note) => {
          const cellWidth = positionWidth;
          if (note.fret === null) {
            html += `<div style="width:${cellWidth}px;text-align:center;padding:4px;font-family:monospace;font-size:12px">--</div>`;
          } else {
            let symbol = note.fret.toString();
            if (note.bend) {
              symbol = `(${symbol})`;
            } else if (note.slide === 'up') {
              symbol = `${symbol}/`;
            } else if (note.slide === 'down') {
              symbol = `\\${symbol}`;
            } else if (getHammerTarget(note) !== null) {
              const target = getHammerTarget(note);
              symbol = `${symbol}h${target}`;
            } else if (getPullTarget(note) !== null) {
              const target = getPullTarget(note);
              symbol = `${symbol}p${target}`;
            } else if (note.vibrato) {
              symbol = `${symbol}~`;
            }
            html += `<div style="width:${cellWidth}px;text-align:center;padding:4px;font-family:monospace;font-size:12px;font-weight:bold">${escapeHtml(symbol)}</div>`;
          }
        });
        
        html += `</div>`;
      }
      
      html += `</div>`;
    });
    
    html += `</div></div></div>`;
  });
  
  html += `
    <hr/>
    <p style="font-size:10px;color:#666;text-align:center;margin-top:20px">
      Экспортировано из Tab Editor • ${new Date().toLocaleString()}
    </p>
  </div>`;
  
  container.innerHTML = html;
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, { 
      logging: false, 
      useCORS: false,
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4' 
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const pageHeight = 277;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Экспорт табулатуры в текстовый формат
 * 
 * @param tabData - Данные табулатуры
 * @returns Текстовая строка с табулатурой
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
 * Экспорт табулатуры в JSON формат
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
 * Экспорт табулатуры в Guitar Pro JSON формат
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
          
          // Определяем эффект в порядке приоритета
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