/**
 * Imprime la ligne JavaScript qui charge une sauvegarde de vérification dans le navigateur
 * (dans le jeu, l'écran /test fait la même chose : ?test sur n'importe quelle adresse).
 * Usage : node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/resoudre-ts.ts scripts/save-acte2.ts <préréglage>
 * Préréglages : acte1Debut, acte1Milieu, finActeI, debut, atelier, compliquer, achats, pieceService, avantBoucle,
 * boucle, demat, fin, reforme, cerfa2
 * (voir data/presets.ts).
 */
import { CLE_SAUVEGARDE } from '../data/save';
import { PRESETS, sauvegardePreset } from '../data/presets';

const demande = process.argv[2] ?? 'debut';
const preset = PRESETS.find((p) => p === demande);
if (!preset) {
  console.error(
    `Préréglage inconnu : ${demande}. Préréglages : ${PRESETS.join(', ')}.`,
  );
  process.exit(1);
}
const s = sauvegardePreset(preset, Date.now());
console.log(
  `localStorage.setItem(${JSON.stringify(CLE_SAUVEGARDE)}, ${JSON.stringify(JSON.stringify(s))});`,
);
