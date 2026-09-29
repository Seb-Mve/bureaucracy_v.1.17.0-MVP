/**
 * Simulateur d'équilibrage de l'acte I.
 * Usage : node scripts/simulate-acte1.ts [tapsParSeconde] [minutesMax]
 *
 * Un joueur-robot tamponne, règle le rejet au maximum, achète les notes dès
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

const { BALANCE } = await import('../constants/balance.ts');
const E = await import('../data/engine.ts');
const { NOTES, NOTES_PAR_ID } = await import('../data/notes.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 180);

let s = E.signerCerfa(E.etatInitial(0), 'Robot', 0);
const jalons: Record<string, number> = {};
const marquer = (k: string, t: number) => {
  if (jalons[k] === undefined) jalons[k] = t;
};
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

const EXTENSIONS = ['tilleuls', 'commune', 'canton'] as const;
let tapsDemandes = 0;
let tapsTraites = 0;
let serieVide = 0;
let pireSerie = 0;
let pireSerieA = 0;

for (let t = 1; t <= minutesMax * 60; t++) {
  const now = t * 1000;
  const puissance = E.getModifiers(s, now).tapPower;
  for (let i = 0; i < taps; i++) {
    const r = E.tamponner(s, now);
    tapsDemandes += puissance;
    tapsTraites += r.ev.traites;
    s = r.s;
  }
  s = E.tick(s, 1, now).s;
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

  if (m.rejetVisible) {
    marquer('rejet débloqué', t);
    s = E.reglerTauxRejet(s, m.rejetMax, now);
  }

  // Notes : achat immédiat si possible.
  for (const id of E.notesVisibles(s)) {
    if (E.peutAcheterNote(s, id)) {
      s = E.acheterNote(s, id, now);
      marquer(`note ${id}`, t);
    }
  }

  // Formulaires : garder 20 s de consommation.
  const conso = (E.vitesseCollegues(s, m) + m.tapPower * taps) * m.pieces * 20;
  if (!m.commandeAuto && s.formulaires < conso) {
    s = E.acheterRamettes(s, Math.ceil((conso - s.formulaires) / BALANCE.ramette), now);
  }

  // Collègues : le meilleur ratio vitesse/coût, sans affamer la prochaine note.
  const enAttente = NOTES.filter((n) => s.notes[n.id] === undefined && n.visible(s) && n.cout > 0);
  const reserve = enAttente.length ? Math.min(...enAttente.map((n) => n.cout)) : 0;
  for (;;) {
    const choix = m.agentsDisponibles
      .map((id) => ({ id, cout: E.coutAgent(id, s.agents[id]), gain: E.gainAgent(s, id, m) }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    if (!choix || s.budget < choix.cout || (reserve > 0 && choix.cout > reserve * 0.5 && s.budget - choix.cout < reserve)) break;
    s = E.acheterAgent(s, choix.id, now);
    marquer('premier collègue', t);
    if (choix.id === 'stagiaire' && t >= 20 * 60) marquer('stagiaire recruté après 20 min', t);
  }

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
console.log(`  efficacité des taps : ${((tapsTraites / Math.max(1, tapsDemandes)) * 100).toFixed(1)} %`);
console.log(`  plus longue file vide : ${pireSerie} s (finie à ${mn(pireSerieA)})`);
