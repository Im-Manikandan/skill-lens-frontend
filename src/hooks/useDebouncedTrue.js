import { useEffect, useState } from 'react';

// Returns true only once `value` has been continuously true for `delayMs`.
// Flips back to false the instant `value` goes false. Used to avoid flashing
// a loading spinner for requests that resolve fast (e.g. a cache-hit warmup
// check) while still showing it for genuinely slow ones.
export default function useDebouncedTrue(value, delayMs) {
  const [debounced, setDebounced] = useState(false);

  useEffect(() => {
    if (!value) {
      setDebounced(false);
      return undefined;
    }
    const timer = setTimeout(() => setDebounced(true), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
