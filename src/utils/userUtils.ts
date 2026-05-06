/**
 * Generates initials from a full name.
 * Example: "Camilo Torres" -> "CT"
 * Example: "Admin" -> "AD"
 */
export function getInitials(name?: string): string {
  if (!name) return 'UN';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
