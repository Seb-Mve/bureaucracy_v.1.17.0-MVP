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

/** Au-delà de ce seuil, les quantités et les montants passent en écriture compacte (« 124 k »). */
const SEUIL_COMPACT = 100000;

const UNITES: [number, string][] = [
  [1e9, 'Md'],
  [1e6, 'M'],
  [1e3, 'k'],
];

/**
 * Écriture compacte à 3 chiffres significatifs, arrondie vers le bas (on n'affiche jamais
 * plus que ce qu'on a) : 12 450 → « 12,4 k », 401 190 → « 401 k », 4 471 000 → « 4,47 M ».
 */
export function formatCompact(value: number): string {
  const v = Math.max(0, value);
  const [diviseur, unite] = UNITES.find(([d]) => v >= d) ?? [1, ''];
  const x = v / diviseur;
  const decimales = x < 10 ? 2 : x < 100 ? 1 : 0;
  const facteur = 10 ** decimales;
  const tronque = (Math.floor(x * facteur + 1e-9) / facteur).toFixed(decimales);
  const texte = tronque.includes('.') ? tronque.replace(/\.?0+$/, '') : tronque;
  return `${texte.replace('.', ',')}${unite ? ` ${unite}` : ''}`;
}

/**
 * Formate une quantité entière (dossiers, formulaires, tampons) :
 * chiffres complets jusqu'à 99 999 (« 70 440 »), puis écriture compacte (« 124 k »).
 */
export function formatEntier(value: number): string {
  const v = Math.max(0, Math.floor(value));
  return v < SEUIL_COMPACT ? v.toLocaleString('fr-FR') : formatCompact(v);
}

/**
 * Formate un montant en euros (sans le symbole), même règle que les quantités :
 * « 1,50 » sous 10, « 70 440 » jusqu'à 99 999, puis « 401 k », « 4,47 M ».
 */
export function formatEuros(value: number): string {
  // Sous 10 € : toujours deux décimales (« 0,20 », « 9,10 »), jamais une seule.
  if (value < 10) return (Math.floor(Math.max(0, value) * 100) / 100).toFixed(2).replace('.', ',');
  if (value < SEUIL_COMPACT) return Math.floor(value).toLocaleString('fr-FR');
  return formatCompact(value);
}

/** Montant complet, symbole compris, avec une espace insécable (« 1 240 € », « 0,20 € »). */
export function formatMontant(value: number): string {
  return `${formatEuros(value)}\u00a0€`;
}

/** Pourcentage à une décimale, partout la même écriture (« 0,2 », « 100,0 »). */
export function formatPourcent(value: number): string {
  return (Math.floor(value * 10) / 10).toFixed(1).replace('.', ',');
}
