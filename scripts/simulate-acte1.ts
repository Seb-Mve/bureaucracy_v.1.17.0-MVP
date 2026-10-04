/**
 * Simulateur d'équilibrage de l'acte I.
 * Usage : node scripts/simulate-acte1.ts [tapsParSeconde] [minutesMax]
 *
 * Un joueur-robot (scripts/robots.ts) tamponne, règle le rejet au maximum, achète les notes dès
 * qu'il peut et recrute le collègue le plus rentable. Affiche les jalons.
 */
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (specifier.startsWith('.')) return next(`${specifier}.ts`, context);
      throw e;
    }
  },
});

const E = await import('../data/engine.ts');
const { NOTES, NOTES_PAR_ID } = await import('../data/notes.ts');
const { robotActe1 } = await import('./robots.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 180);

let s = E.signerCerfa(E.etatInitial(0), 'Robot', 0);
const jalons: Record<string, number> = {};
const marquer = (k: string, t: number) => {
  if (jalons[k] === undefined) jalons[k] = t;
};
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

const EXTENSIONS = ['tilleuls', 'commune', 'canton'] as const;
const mesures = { tapsDemandes: 0, tapsTraites: 0 };
let serieVide = 0;
let pireSerie = 0;
let pireSerieA = 0;

for (let t = 1; t <= minutesMax * 60; t++) {
  const now = t * 1000;
  const avant = s;
  s = robotActe1(s, now, taps, mesures);
  const m = E.getModifiers(s, now);
  // Série de file vide, excusée si une extension de périmètre attend d'être achetée.
  const extensionEnAttente = EXTENSIONS.some((id) => s.notes[id] === undefined && NOTES_PAR_ID[id].visible(s));
  if (E.dossiersEnAttente(s) < 1 && !extensionEnAttente) {
    serieVide += 1;
    if (serieVide > pireSerie) {
      pireSerie = serieVide;
      pireSerieA = t;
    }
  } else {
    serieVide = 0;
  }

  if (m.rejetVisible) marquer('rejet débloqué', t);
  for (const n of NOTES) if (s.notes[n.id] !== undefined) marquer(`note ${n.id}`, t);
  const recrues = Object.values(s.agents).reduce((a, b) => a + b, 0);
  if (recrues > 0) marquer('premier collègue', t);
  if (s.agents.stagiaire > avant.agents.stagiaire && t >= 20 * 60) marquer('stagiaire recruté après 20 min', t);

  if (m.conformiteVisible) marquer('conformité révélée', t);
  if (E.conformite(s) >= 100) marquer('conformité 100 %', t);
  if (s.acteTermine) {
    marquer('fin de l’acte', t);
    break;
  }

  if (t % 600 === 0) {
    console.log(
      `${mn(t).padStart(9)} | tampons ${Math.round(s.tampons).toString().padStart(8)} | budget ${Math.round(s.budget).toString().padStart(7)} € | pop ${Math.round(s.population)}/${E.perimetre(s, now)} | abandons ${Math.round(s.abandons)} | file ${Math.round(E.dossiersEnAttente(s))} | ${E.vitesseCollegues(s, m).toFixed(1)} d/s | rejet ${Math.round(s.tauxRejet * 100)} % | conf ${E.conformite(s).toFixed(1)} %`,
    );
  }
}

console.log('\nJalons :');
for (const [k, t] of Object.entries(jalons).sort((a, b) => a[1] - b[1])) {
  console.log(`  ${mn(t).padStart(9)}  ${k}`);
}

console.log('\nMesures :');
console.log(`  efficacité des taps : ${((mesures.tapsTraites / Math.max(1, mesures.tapsDemandes)) * 100).toFixed(1)} %`);
console.log(`  collègues : ${Object.entries(s.agents).map(([id, n]) => `${id} ${n}`).join(', ')}`);
console.log(`  plus longue file vide : ${pireSerie} s (finie à ${mn(pireSerieA)})`);
