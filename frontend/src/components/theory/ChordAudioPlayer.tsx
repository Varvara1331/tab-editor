// src/components/theory/ChordAudioPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import Soundfont from 'soundfont-player';

interface ChordAudioPlayerProps {
  chordName: string;
  notes: string[];
}

export const ChordAudioPlayer: React.FC<ChordAudioPlayerProps> = ({ chordName, notes }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentRef = useRef<any>(null);
  const activeNotesRef = useRef<any[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  };

  const stopAllSounds = () => {
    clearAllTimeouts();
    activeNotesRef.current.forEach(note => {
      try {
        if (note && typeof note.stop === 'function') {
          note.stop();
        }
      } catch (e) {
      }
    });
    activeNotesRef.current = [];
  };

  const initializeInstrument = async () => {
    if (instrumentRef.current) return instrumentRef.current;
    
    if (!isMountedRef.current) return null;
    setIsLoading(true);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const instrument = await Soundfont.instrument(audioContext, 'acoustic_guitar_steel', {
        gain: 0.5,
        destination: audioContext.destination
      });
      
      instrumentRef.current = instrument;
      return instrument;
    } catch (error) {
      console.error('Failed to load SoundFont instrument:', error);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const playStrumDown = async (instrument: any, notesArray: string[]) => {
    if (!audioContextRef.current) return [];
    
    const activeNotes: any[] = [];
    const now = audioContextRef.current.currentTime;
    
    const stringDelay = 0.035;
    
    const chordDuration = 2.5;
    
    const playableNotes = notesArray.filter(note => note !== 'x');
    
    if (playableNotes.length === 0) return [];
    
    for (let i = 0; i < notesArray.length; i++) {
      const note = notesArray[i];
      if (note === 'x') continue;
      
      const delay = i * stringDelay;
      const startTime = now + delay;
      
      const noteDuration = Math.max(chordDuration - delay, 0.5);
      
      try {
        const playedNote = instrument.play(note, startTime, {
          duration: noteDuration,
          gain: 0.35
        });
        activeNotes.push(playedNote);
      } catch (err) {
        console.warn(`Failed to play note ${note}:`, err);
      }
    }
    
    return activeNotes;
  };

  const playChord = async () => {
    if (isPlaying) {
      stopAllSounds();
      setIsPlaying(false);
      return;
    }

    try {
      const instrument = await initializeInstrument();
      
      if (!instrument || !audioContextRef.current || !isMountedRef.current) {
        console.error('Instrument not ready');
        return;
      }
      
      const audioContext = audioContextRef.current;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      stopAllSounds();
      
      const activeNotes = await playStrumDown(instrument, notes);
      activeNotesRef.current = activeNotes;
      
      if (!isMountedRef.current) return;
      setIsPlaying(true);
      
      const totalDuration = 2600;
      
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          stopAllSounds();
          setIsPlaying(false);
        }
      }, totalDuration);
      
      timeoutsRef.current.push(timeout);
      
    } catch (error) {
      console.error('Error playing chord:', error);
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopAllSounds();
      if (instrumentRef.current) {
        instrumentRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.warn);
      }
      audioContextRef.current = null;
    };
  }, []);

  return (
    <button
      className="chord-play-btn"
      onClick={playChord}
      disabled={isLoading}
      title={`Прослушать аккорд ${chordName}`}
      type="button"
    >
      {isLoading ? (
        <Loader2 size={16} className="spinner" />
      ) : isPlaying ? (
        <VolumeX size={16} />
      ) : (
        <Volume2 size={16} />
      )}
    </button>
  );
};