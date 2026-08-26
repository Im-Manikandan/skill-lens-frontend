import { useState, useRef, useCallback, useEffect } from 'react';

const ERROR_MESSAGES = {
  'not-supported': 'Speech recognition is not supported in this browser.',
  'permission-denied': 'Microphone access denied. Enable in browser settings.',
  'service-not-allowed': 'Microphone access denied. Enable in browser settings.',
  'no-speech': 'No speech detected. Please try again.',
  'network': 'Network error. Check your connection and try again.',
  'audio-capture': 'No microphone found. Check your device settings.',
  'aborted': null,
};

// STATUS: idle | listening | error
export default function useSpeechRecognition({ lang = 'en-US', onResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);

  // Refs keep callbacks fresh without re-creating startListening on every render
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const SpeechAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

  const isSupported = !!SpeechAPI;

  const clearError = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('idle');
    setError(null);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechAPI) {
      setStatus('error');
      setError(ERROR_MESSAGES['not-supported']);
      onErrorRef.current?.('not-supported');
      return;
    }

    // Abort any in-flight session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    manualStopRef.current = false;
    setError(null);
    setStatus('listening');
    setIsListening(true);

    const recognition = new SpeechAPI();
    recognition.lang = lang;
    recognition.continuous = true;      // keep session open across pauses
    recognition.interimResults = true;  // stream partial results in real-time
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      // Concatenate ALL results (final + interim) into a running transcript.
      // Explicit space prefix on i>0 guards against Safari not adding leading spaces.
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += (i > 0 ? ' ' : '') + event.results[i][0].transcript.trim();
      }
      onResultRef.current?.(transcript.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error;
      // aborted = user triggered stopListening, not a real error
      if (code === 'aborted') {
        setStatus('idle');
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }
      // no-speech = the browser's own silence timeout, not a user-facing failure.
      // Continuous dictation naturally has pauses (e.g. mid-sentence in a demo) —
      // let onend below transparently restart the session instead of dying here.
      if (code === 'no-speech' && !manualStopRef.current) {
        return;
      }
      const message = ERROR_MESSAGES[code] ?? 'Speech recognition error. Please try again.';
      setStatus('error');
      setError(message);
      setIsListening(false);
      recognitionRef.current = null;
      onErrorRef.current?.(code);
    };

    // Fires after the session ends (abort/stop/error/browser silence-timeout).
    // Chrome ends `continuous` sessions on its own after a few seconds of silence —
    // restart transparently unless the user actually clicked stop.
    recognition.onend = () => {
      if (!recognitionRef.current) return;
      if (!manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through — treat as a real end
        }
      }
      setStatus('idle');
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setStatus('error');
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [SpeechAPI, lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { isListening, status, error, startListening, stopListening, clearError, isSupported };
}
