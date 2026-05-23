const CACHE_PREFIX = 'kiora_cache_v1:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // localStorage lleno o deshabilitado — ignorar silenciosamente
  }
}

export function clearCache(pattern?: string): void {
  try {
    const prefix = pattern ? `${CACHE_PREFIX}${pattern}` : CACHE_PREFIX;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}
