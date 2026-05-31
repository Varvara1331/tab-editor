// src/components/theory/ChordDiagram.tsx
import React from 'react';
import { ChordAudioPlayer } from './ChordAudioPlayer';


const chordNotes: Record<string, string[]> = {
  Am: ['x', 'A2', 'E3', 'A3', 'C4', 'E4'],
  
  A: ['x', 'A2', 'E3', 'A3', 'C#4', 'E4'],
  
  C: ['x', 'C3', 'E3', 'G3', 'C4', 'E4'],
  
  D: ['x', 'x', 'D3', 'A3', 'D4', 'F#4'],
  
  Dm: ['x', 'x', 'D3', 'A3', 'D4', 'F4'],
  
  E: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
  
  Em: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
  
  G: ['G2', 'D3', 'G3', 'B3', 'D4', 'G4'],
};

const chordImagePaths: Record<string, string> = {
  Am: '/images/theory/part3/chords/Am.svg',
  A: '/images/theory/part3/chords/A.svg',
  C: '/images/theory/part3/chords/C.svg',
  D: '/images/theory/part3/chords/D.svg',
  Dm: '/images/theory/part3/chords/Dm.svg',
  E: '/images/theory/part3/chords/E.svg',
  Em: '/images/theory/part3/chords/Em.svg',
  G: '/images/theory/part3/chords/G.svg',
};

type ChordName = keyof typeof chordImagePaths;

interface ChordDiagramProps {
  chord: ChordName;
  showLabel?: boolean;
  showAudio?: boolean;
}

const chordLabels: Record<ChordName, string> = {
  Am: 'Ля минор',
  A: 'Ля мажор',
  C: 'До мажор',
  D: 'Ре мажор',
  Dm: 'Ре минор',
  E: 'Ми мажор',
  Em: 'Ми минор',
  G: 'Соль мажор',
};

export const ChordDiagram: React.FC<ChordDiagramProps> = ({ 
  chord, 
  showLabel = true,
  showAudio = true 
}) => {
  return (
    <div className="chord-diagram-container">
      <div className="chord-diagram-image-wrapper">
        <img 
          src={chordImagePaths[chord]} 
          alt={`${chord} аккорд`}
          className="chord-diagram-img"
        />
        {showAudio && (
          <div className="chord-audio-overlay">
            <ChordAudioPlayer chordName={`${chord} (${chordLabels[chord]})`} notes={chordNotes[chord]} />
          </div>
        )}
      </div>
      {showLabel && (
        <div className="chord-diagram-label">
          {chord} ({chordLabels[chord]})
        </div>
      )}
    </div>
  );
};