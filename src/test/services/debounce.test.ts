import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    expect(result.current).toBe('a');

    // Change value immediately
    rerender({ value: 'b', delay: 300 });
    expect(result.current).toBe('a'); // still old value

    // Advance time partially
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('a'); // still old value

    // Complete the debounce
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('b');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(200); }); // almost there

    rerender({ value: 'c' }); // change again - resets timer
    act(() => { vi.advanceTimersByTime(200); }); // not enough
    expect(result.current).toBe('a'); // still original

    act(() => { vi.advanceTimersByTime(100); }); // complete
    expect(result.current).toBe('c'); // latest value
  });
});
