import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTTS } from './useTTS';

// Mock the Web Speech API
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
};

const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
}));

// Mock global objects
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance,
});

describe('useTTS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTTS());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('should speak text when speak function is called', () => {
    const { result } = renderHook(() => useTTS());
    const testText = 'Hello, this is a test';

    act(() => {
      result.current.speak(testText);
    });

    expect(mockSpeechSynthesisUtterance).toHaveBeenCalledWith(testText);
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
  });

  it('should stop speech when stop function is called', () => {
    const { result } = renderHook(() => useTTS());

    act(() => {
      result.current.stop();
    });

    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should pause speech when pause function is called', () => {
    const { result } = renderHook(() => useTTS());

    act(() => {
      result.current.pause();
    });

    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
  });

  it('should resume speech when resume function is called', () => {
    const { result } = renderHook(() => useTTS());

    act(() => {
      result.current.resume();
    });

    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
  });

  it('should handle unsupported browsers gracefully', () => {
    // Temporarily remove speechSynthesis to simulate unsupported browser
    const originalSpeechSynthesis = window.speechSynthesis;
    delete (window as any).speechSynthesis;

    const { result } = renderHook(() => useTTS());

    expect(result.current.isSupported).toBe(false);

    // Restore speechSynthesis
    window.speechSynthesis = originalSpeechSynthesis;
  });

  it('should update state when speech starts and ends', () => {
    const { result } = renderHook(() => useTTS());
    const testText = 'Test speech';

    act(() => {
      result.current.speak(testText);
    });

    // Get the utterance that was created
    const utteranceCall = mockSpeechSynthesisUtterance.mock.calls[0];
    const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;

    // Simulate speech start
    act(() => {
      if (utterance.onstart) {
        utterance.onstart(new Event('start'));
      }
    });

    expect(result.current.isPlaying).toBe(true);

    // Simulate speech end
    act(() => {
      if (utterance.onend) {
        utterance.onend(new Event('end'));
      }
    });

    expect(result.current.isPlaying).toBe(false);
  });
});