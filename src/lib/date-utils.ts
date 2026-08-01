/**
 * Normalizes SQLite local-formatted timestamps to ISO-8601 UTC strings
 * so that they can be parsed correctly by the browser/client.
 */
export function toUtcIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  if (dateStr.includes('T') || dateStr.endsWith('Z')) return dateStr;
  return dateStr.replace(' ', 'T') + 'Z';
}
