import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCache, setCache, clearCache } from '../../lib/cache';

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('should store and retrieve data', () => {
    const data = { products: [{ id: 1, name: 'Test' }] };
    setCache('products', data);
    expect(getCache('products')).toEqual(data);
  });

  it('should return null for missing keys', () => {
    expect(getCache('nonexistent')).toBeNull();
  });

  it('should expire after TTL', () => {
    setCache('temp', 'value', 1000); // 1 second TTL
    expect(getCache('temp')).toBe('value');

    vi.advanceTimersByTime(1500);
    expect(getCache('temp')).toBeNull();
  });

  it('should handle invalid JSON gracefully', () => {
    localStorage.setItem('kiora_cache_v1:corrupt', 'not-json');
    expect(getCache('corrupt')).toBeNull();
  });

  it('should clear all cached entries', () => {
    setCache('a', 1);
    setCache('b', 2);
    clearCache();
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBeNull();
  });

  it('should clear entries matching pattern', () => {
    setCache('products:all', []);
    setCache('categories:all', []);
    setCache('other', 'x');
    clearCache('products');
    expect(getCache('products:all')).toBeNull();
    expect(getCache('categories:all')).toEqual([]);
    expect(getCache('other')).toBe('x');
  });

  it('should handle localStorage errors', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setCache('key', 'value')).not.toThrow();
    setItem.mockRestore();
  });

  it('should handle getCache when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    expect(getCache('key')).toBeNull();
  });
});
