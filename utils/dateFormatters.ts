/**
 * French date/time formatting utilities for journal timestamps
 * Uses native Intl.RelativeTimeFormat and Intl.DateTimeFormat for proper French localization
 */

/**
 * Format a timestamp in French with relative time for recent entries
 * and absolute format for older entries
 * 
 * Examples:
 * - < 1 minute: "À l'instant"
 * - < 60 minutes: "Il y a 5 minutes"
 * - < 24 hours: "Il y a 3 heures"
 * - ≥ 24 hours: "23 janv. à 14:30"
 * 
 * @param timestamp Unix timestamp in milliseconds (from Date.now())
 * @returns Formatted French timestamp string
 */
export function formatTimestampFrench(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Less than 1 minute ago
  if (diffSeconds < 60) {
    return "À l'instant";
  }
  
  // Less than 60 minutes ago
  if (diffMinutes < 60) {
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    return rtf.format(-diffMinutes, 'minute');
  }
  
  // Less than 24 hours ago
  if (diffHours < 24) {
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    return rtf.format(-diffHours, 'hour');
  }
  
  // 24 hours or older: absolute format "23 janv. à 14:30"
  const date = new Date(timestamp);
  
  // Format date part: "23 janv."
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const datePart = dateFormatter.format(date);
  
  // Format time part: "14:30"
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timePart = timeFormatter.format(date);
  
  return `${datePart} à ${timePart}`;
}

/**
 * Format a duration in milliseconds as French text
 * Used for debug/diagnostics
 * 
 * Examples:
 * - 500 → "500ms"
 * - 5000 → "5s"
 * - 65000 → "1 min 5s"
 * 
 * @param durationMs Duration in milliseconds
 * @returns Formatted French duration string
 */
export function formatDurationFrench(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  const seconds = Math.floor(durationMs / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  
  return `${minutes} min ${remainingSeconds}s`;
}
