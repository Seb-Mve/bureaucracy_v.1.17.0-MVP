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

/** Débit (dossiers par seconde) : même écriture que les montants (« 0,30 », « 115 », « 12,4 k »). */
export function formatDebit(value: number): string {
  return formatEuros(value);
}

/** Montant complet, symbole compris, avec une espace insécable (« 1 240 € », « 0,20 € »). */
export function formatMontant(value: number): string {
  return `${formatEuros(value)}\u00a0€`;
}

/** Pourcentage à une décimale, partout la même écriture (« 0,2 », « 100,0 »). */
export function formatPourcent(value: number): string {
  return (Math.floor(value * 10) / 10).toFixed(1).replace('.', ',');
}
