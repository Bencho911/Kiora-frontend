/**
 * Formats a date string or object to a human-readable format.
 * Example: "2024-04-24T11:30:37Z" -> "24 abr 2024"
 */
export function formatDate(date?: string | Date | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}


