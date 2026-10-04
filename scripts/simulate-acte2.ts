/**
 * Simulateur d'équilibrage de l'acte II, Réforme comprise.
 * Usage : node scripts/simulate-acte2.ts [tapsParSeconde] [minutesMax] [réformeÀ | balayage] [découverte]
 *
 * Un joueur-robot entre dans l'acte II avec le compteur d'une fin d'acte I et joue (scripts/robots.ts).
 * Sans troisième argument, il ne réforme pas. Avec `réformeÀ` (en % de dématérialisation), il réforme
 * dès ce taux atteint, achète sa Jurisprudence, rejoue l'acte I, revient à l'acte II et le termine.
 * `balayage` compare la fin de l'acte sans Réforme et avec une Réforme à 0, 20, 40, 50, 60, 70 et 80 %.
 * Il construit la boucle instantanément : un humain mettra plus longtemps.
 */
import { registerHooks } from 'node:module';
import type { GameState } from '../types/game.ts';

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

const D = await import('../data/acte2/moteur.ts');
const { BALANCE } = await import('../constants/balance.ts');
const R = await import('../data/reforme.ts');
const { finActeIRobot, robotActe1, robotActe2, robotReforme } = await import('./robots.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 300);
const mode = process.argv[4];
/** Minutes qu'un humain met à comprendre la note n° 8 (première partie seulement). */
const decouverte = Number(process.argv[5] ?? 0) * 60;

const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

/** Part des recettes de la partie dépensée en ramettes (à la main ou par le Service des achats), en %. */
const partFournitures = (s: GameState): number =>
  (100 * (s.stats.formulairesAchetes / BALANCE.ramette) * D.prixRamette2(s)) /
  Math.max(1, s.stats.budgetGagne);

interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
  /** Part des fournitures dans les recettes tant que tout se fait en ×1 (avant le curseur Exemplaires). */
  partX1: number | null;
}

/** Joue depuis l'entrée dans l'acte II ; réforme une fois à `reformeA` % de dématérialisation (null : jamais). */
function jouer(reformeA: number | null, journal: boolean): Partie {
  let s = D.entrerActe2({ ...finActeIRobot(), finActeVue: true }, 0);
  const jalons: Record<string, number> = {};
  const marquer = (k: string, t: number) => {
    if (jalons[k] === undefined) jalons[k] = t;
  };
  const tour = () => (s.reformes.nombre > 0 ? ' (après la Réforme)' : '');
  let partX1: number | null = null;
  for (let t = 1; t <= minutesMax * 60; t++) {
    const now = t * 1000;
    if (s.acte === 1) {
      s = robotActe1(s, now, taps);
      if (s.acteTermine) {
        marquer('acte I rejoué', t);
        s = D.entrerActe2({ ...s, finActeVue: true }, now);
      }
      continue;
    }
    // Le temps de compréhension de l'indice ne compte qu'à la première partie : ensuite, le joueur sait.
    if (partX1 === null && s.reformes.nombre === 0 && D.getModifiers2(s, now).exemplairesVisible)
      partX1 = partFournitures(s);
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
    for (const id of Object.keys(x.notes)) marquer(`note ${id}${tour()}`, t);
    if (x.agents.instructeur > 0) marquer(`premier agent${tour()}`, t);
    if (x.agents.chefBureau > 0) marquer(`premier chef de bureau${tour()}`, t);
    if (D.getModifiers2(s, now).atelierVisible) marquer(`atelier${tour()}`, t);
    if (x.premiereBoucle !== null) marquer(`première boucle${tour()}`, t);
    if (R.peutReformer(s, now)) marquer('réforme débloquée', t);
    for (const pct of [25, 50, 75, 100]) if (D.dematerialisation(x) >= pct) marquer(`dématérialisation ${pct} %${tour()}`, t);
    if (reformeA !== null && s.reformes.nombre === 0 && D.dematerialisation(x) >= reformeA && R.peutReformer(s, now)) {
      const gain = R.trombonesReforme(s);
      s = robotReforme(s, now);
      marquer(`réforme (${gain} trombones : ${s.reformes.jurisprudence.join(', ') || 'aucun bonus'})`, t);
      continue;
    }
    if (x.acteTermine) {
      marquer('fin de l’acte II', t);
      return { jalons, fin: t, s, partX1 };
    }
    if (journal && t % 600 === 0) {
      console.log(
        `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${x.guichets} | agents ${x.agents.instructeur}/${x.agents.chefBureau}/${x.agents.sousDirecteur} | boucle ${Math.round(D.dossiersEnBoucle(x))} | rendement ${D.rendementDemat(s, x).toFixed(2)} | démat ${D.dematerialisation(x).toFixed(1)} %`,
      );
    }
  }
  return { jalons, fin: null, s, partX1 };
}

if (mode === 'balayage') {
  const sans = jouer(null, false);
  console.log(`Sans Réforme : fin de l’acte II à ${sans.fin === null ? `plus de ${minutesMax} min` : mn(sans.fin)}`);
  for (const a of [0, 20, 40, 50, 60, 70, 80]) {
    const p = jouer(a, false);
    const reforme = Object.entries(p.jalons).find(([k]) => k.startsWith('réforme ('));
    const gagne = p.fin !== null && (sans.fin === null || p.fin < sans.fin);
    console.log(
      `Réforme à ${a} % : ${reforme ? `${reforme[0]} à ${mn(reforme[1])}` : 'pas de Réforme'} · acte I rejoué ${p.jalons['acte I rejoué'] !== undefined ? mn(p.jalons['acte I rejoué']) : '—'} · fin ${p.fin === null ? '—' : mn(p.fin)} · ${gagne ? 'rentable' : 'pas rentable'}`,
    );
  }
} else {
  const p = jouer(mode === undefined ? null : Number(mode), true);
  console.log('\nJalons :');
  for (const [k, t] of Object.entries(p.jalons).sort((a, b) => a[1] - b[1])) console.log(`  ${mn(t).padStart(9)}  ${k}`);
  const fin = p.s.acte2;
  if (fin) {
    console.log('\nMesures :');
    console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
    console.log(
      `  fournitures : ${p.partX1 === null ? '—' : p.partX1.toFixed(1)} % des recettes en ×1, ${partFournitures(p.s).toFixed(1)} % sur l’acte`,
    );
    console.log(`  procédures : ${Object.entries(fin.procedures).map(([q, e]) => `${q} [${e.map((v) => v.type).join(', ')}]`).join(' · ')}`);
  }
}
