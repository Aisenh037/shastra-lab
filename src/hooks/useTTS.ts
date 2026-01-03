import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isSupported: false,
    isSpeaking: false,
    isPaused: false,
    voices: [],
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const isSupported = 'speechSynthesis' in window;
    
    if (!isSupported) {
      setState((prev) => ({ ...prev, isSupported: false }));
      return;
    }

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setState((prev) => ({ ...prev, isSupported: true, voices }));
    };

    // Voices may load asynchronously
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number; voice?: string }) => {
      if (!state.isSupported) return;

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;

      // Try to find a good English voice
      if (options?.voice) {
        const selectedVoice = state.voices.find((v) => v.name === options.voice);
        if (selectedVoice) utterance.voice = selectedVoice;
      } else {
        // Prefer natural-sounding English voices
        const preferredVoice = state.voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setState((prev) => ({ ...prev, isSpeaking: true, isPaused: false }));
      };

      utterance.onend = () => {
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [state.isSupported, state.voices]
  );

  const pause = useCallback(() => {
    if (state.isSpeaking && !state.isPaused) {
      speechSynthesis.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isSpeaking, state.isPaused]);

  const resume = useCallback(() => {
    if (state.isSpeaking && state.isPaused) {
      speechSynthesis.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isSpeaking, state.isPaused]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
  }, []);

  const toggle = useCallback(() => {
    if (state.isPaused) {
      resume();
    } else if (state.isSpeaking) {
      pause();
    }
  }, [state.isSpeaking, state.isPaused, pause, resume]);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    toggle,
  };
}
