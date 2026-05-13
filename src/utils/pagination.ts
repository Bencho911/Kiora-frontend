/**
 * Páginas a mostrar con elipsis cuando hay muchas (p. ej. 1 … 8 9 10 … 50).
 */
export function getPaginationPages(
  current: number,
  total: number
): (number | 'ellipsis')[] {
  if (total < 1) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (unused, i) => i + 1);
  }

  const delta = 2;
  const range: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  const result: (number | 'ellipsis')[] = [];
  let prev: number | undefined;

  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) {
        result.push(prev + 1);
      } else if (i - prev > 1) {
        result.push('ellipsis');
      }
    }
    result.push(i);
    prev = i;
  }

  return result;
}
