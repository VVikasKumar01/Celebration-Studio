/**
 * @file src/hooks/useLocalStorage.ts
 * @description Generic hook that synchronises a React state value with
 * `localStorage`.  Writes are debounced to avoid thrashing storage on every
 * keystroke or rapid state update.
 */

import { useState, useEffect } from 'react';

/**
 * Reads, writes, and debounces a value in `localStorage`.
 *
 * @template T    - Shape of the stored value.
 * @param key     - `localStorage` key to read from / write to.
 * @param initialValue - Factory function (or plain value) used when no
 *                       persisted data exists or parsing fails.
 * @param debounceMs   - Milliseconds to wait before flushing a write
 *                       (default: 400 ms).
 * @returns `[value, setValue]` — identical interface to `useState`.
 *
 * @example
 * const [events, setEvents] = useLocalStorage<EventState[]>(
 *   STORAGE_KEY,
 *   () => [SAMPLE_WEDDING],
 *   400,
 * );
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  debounceMs = 400,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Could not read key "${key}":`, err);
    }
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  });

  // Debounced write — avoids CPU/storage thrash on rapid updates
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (err) {
        console.error(`[useLocalStorage] Could not persist key "${key}":`, err);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [key, storedValue, debounceMs]);

  return [storedValue, setStoredValue];
}
