import { useEffect } from 'react';

/**
 * Locks the document body scroll while `locked` is true.
 * Automatically restores the original overflow on cleanup.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}
