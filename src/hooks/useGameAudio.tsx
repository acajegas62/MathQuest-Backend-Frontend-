import { useEffect, useRef, useState } from 'react';

export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for background music
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    
    // Start playing
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Auto-play was prevented, will play after user interaction
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const toggleMute = () => setIsMuted(prev => !prev);
  const setVolumeLevel = (level: number) => setVolume(Math.max(0, Math.min(1, level)));

  return { isMuted, volume, toggleMute, setVolumeLevel };
}
