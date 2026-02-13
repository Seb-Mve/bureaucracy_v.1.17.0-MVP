/**
 * Format a number according to French conventions
 * - Uses comma (,) as decimal separator
 * - Uses space as thousands separator
 * - Uses lowercase abbreviations: k (thousands), M (millions)
 * 
 * Examples:
 * - 1234 → "1 234"
 * - 1500 → "1,5 k"
 * - 2500000 → "2,5 M"
 */
export function formatNumberFrench(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    // Format with French decimal separator
    const formatted = millions.toFixed(2).replace('.', ',');
    // Remove trailing zeros after comma
    return formatted.replace(/,?0+$/, '') + ' M';
  } else if (value >= 1000) {
    const thousands = value / 1000;
    // Format with French decimal separator
    const formatted = thousands.toFixed(2).replace('.', ',');
    // Remove trailing zeros after comma
    return formatted.replace(/,?0+$/, '') + ' k';
  } else if (value >= 100) {
    // Format with French thousands separator
    return Math.floor(value).toLocaleString('fr-FR');
  } else if (value >= 10) {
    return value.toFixed(1).replace('.', ',');
  } else {
    return value.toFixed(2).replace('.', ',');
  }
}

/**
 * Format large numbers with French thousands separator (space)
 * Example: 123456 → "123 456"
 */
export function formatLargeNumber(value: number): string {
  return Math.floor(value).toLocaleString('fr-FR');
}
