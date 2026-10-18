"use client";

import { useCallback, useEffect, useState } from "react";

type Options = {
  /** When false, never read/write localStorage (API mode workspace data). */
  persist?: boolean;
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: Options = {},
) {
  const persist = options.persist !== false;
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(!persist);

  useEffect(() => {
    if (!persist) {
      setIsHydrated(true);
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key, persist]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        if (persist) {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
          }
        }
        return next;
      });
    },
    [key, persist],
  );

  return [storedValue, setValue, isHydrated] as const;
}
