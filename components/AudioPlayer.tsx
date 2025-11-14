
import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Audio Decoding Helpers ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- Component ---

const AudioPlayer: React.FC<{ base64Audio: string }> = ({ base64Audio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
      setIsReady(false);
      setError(null);
      cleanup();

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const decodedBytes = decode(base64Audio);
        const buffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
        
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setCurrentTime(0);
        setIsReady(true);

      } catch (err) {
        console.error("Failed to decode or setup audio:", err);
        setError("Failed to load audio. The data might be corrupted.");
        setIsReady(false);
      }
    };
    
    setupAudio();

    return () => {
      cleanup();
      // Only close context if component is truly unmounting for good
      // audioContextRef.current?.close(); 
    };
  }, [base64Audio, cleanup]);

  const updateProgress = useCallback(() => {
    if (isPlaying && audioContextRef.current) {
      const newTime = startTimeRef.current + (audioContextRef.current.currentTime - startedAtRef.current);
      setCurrentTime(newTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  const play = useCallback(() => {
    if (!isReady || !audioContextRef.current || !audioBufferRef.current || isPlaying) return;

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBufferRef.current;
    sourceNodeRef.current.connect(audioContextRef.current.destination);

    sourceNodeRef.current.onended = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        // Check if it ended naturally
        if (currentTime >= duration - 0.1) {
            setCurrentTime(duration);
            setIsPlaying(false);
        }
    };
    
    startedAtRef.current = audioContextRef.current.currentTime;
    startTimeRef.current = currentTime; // Resume from where it was paused
    sourceNodeRef.current.start(0, currentTime);
    
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgress);

  }, [isReady, isPlaying, currentTime, duration, updateProgress]);

  const pause = useCallback(() => {
    if (!isPlaying) return;
    cleanup();
    startTimeRef.current = currentTime; // Store paused time
  }, [isPlaying, cleanup, currentTime]);

  const handlePlayPause = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (isPlaying) {
      pause();
    } else {
      if (currentTime >= duration) { // If at the end, restart
          setCurrentTime(0);
          startTimeRef.current = 0;
      }
      play();
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReady || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (x / width) * duration;
    
    cleanup();
    setCurrentTime(newTime);
    startTimeRef.current = newTime;
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (error) {
    return <div className="p-4 text-red-400 flex items-center justify-center h-full">{error}</div>;
  }
  
  if (!isReady && !error) {
     return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <svg className="animate-spin h-10 w-10 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p>Processing Audio...</p>
        </div>
     )
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full w-full">
      <div className="bg-slate-700/50 rounded-xl p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center space-x-4">
            <button
                onClick={handlePlayPause}
                disabled={!isReady}
                className="bg-blue-600 text-white rounded-full h-14 w-14 flex items-center justify-center flex-shrink-0 shadow-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1zm5 0a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
            </button>
            <div className="w-full">
                <div 
                    ref={progressBarRef}
                    onClick={handleScrub}
                    className="bg-slate-600 h-2 rounded-full cursor-pointer group"
                >
                    <div 
                        className="bg-blue-400 h-2 rounded-full relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -mt-2 h-4 w-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
