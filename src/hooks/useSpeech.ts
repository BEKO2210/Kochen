import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechState {
  isSupported: boolean;
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  error: Error | null;
}

interface UseSpeechReturn extends SpeechState {
  speak: (text: string, options?: SpeechOptions) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

/**
 * Hook for Web Speech API - Text to Speech
 * Used for reading cooking instructions aloud
 */
export function useSpeech(): UseSpeechReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Speech settings
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef<number>(1);
  const pitchRef = useRef<number>(1);
  const volumeRef = useRef<number>(1);

  // Check for Speech Synthesis API support
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Prefer German voice if available
        const germanVoice = availableVoices.find(
          v => v.lang.startsWith('de') && !v.localService
        ) || availableVoices.find(v => v.lang.startsWith('de'));
        
        if (germanVoice) {
          voiceRef.current = germanVoice;
        } else if (availableVoices.length > 0) {
          voiceRef.current = availableVoices[0];
        }
      };

      loadVoices();
      
      // Voices may load asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Monitor speaking state
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeaking = () => {
      setSpeaking(window.speechSynthesis.speaking);
      setPaused(window.speechSynthesis.paused);
    };

    const interval = setInterval(checkSpeaking, 100);
    
    return () => clearInterval(interval);
  }, [isSupported]);

  // Speak text
  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!isSupported) {
      setError(new Error('Speech Synthesis API is not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      utterance.voice = options.voice || voiceRef.current;
      utterance.rate = options.rate || rateRef.current;
      utterance.pitch = options.pitch || pitchRef.current;
      utterance.volume = options.volume || volumeRef.current;
      utterance.lang = options.lang || 'de-DE';

      // Event handlers
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };

      utterance.onerror = (event) => {
        setSpeaking(false);
        setPaused(false);
        
        // Don't treat user interruptions as errors
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setError(new Error(`Speech synthesis error: ${event.error}`));
        }
      };

      utterance.onpause = () => {
        setPaused(true);
      };

      utterance.onresume = () => {
        setPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to speak'));
      setSpeaking(false);
    }
  }, [isSupported]);

  // Cancel speech
  const cancel = useCallback(() => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel speech'));
    }
  }, [isSupported]);

  // Pause speech
  const pause = useCallback(() => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.pause();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause speech'));
    }
  }, [isSupported]);

  // Resume speech
  const resume = useCallback(() => {
    if (!isSupported) return;
    
    try {
      window.speechSynthesis.resume();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resume speech'));
    }
  }, [isSupported]);

  // Set voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    voiceRef.current = voice;
  }, []);

  // Set rate
  const setRate = useCallback((rate: number) => {
    rateRef.current = Math.max(0.1, Math.min(2, rate));
  }, []);

  // Set pitch
  const setPitch = useCallback((pitch: number) => {
    pitchRef.current = Math.max(0, Math.min(2, pitch));
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSupported,
    speaking,
    paused,
    voices,
    error,
    speak,
    cancel,
    pause,
    resume,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  };
}

export default useSpeech;
