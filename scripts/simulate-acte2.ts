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
const { valeurDocument } = await import('../data/acte2/production.ts');
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

/** Documents délivrés depuis l'entrée dans l'acte : aux usagers, et pour les dossiers du service. */
function delivres(s: GameState): { usagers: number; service: number } {
  const x = s.acte2!;
  const somme = (r: Record<string, number>) => Object.values(r).reduce((a, v) => a + v, 0);
  return { usagers: somme(x.stats.delivresUsagers), service: somme(x.stats.delivresService) };
}

/** Ce que l'on mesure 10 minutes après la première boucle (critère de la spec 011, § 10). */
interface ApresBoucle {
  usagers: number;
  usagersMax: number;
  /** Documents délivrés pendant ces 10 minutes. */
  delivresUsagers: number;
  delivresService: number;
  /** Usagers en cours à 0, 2, 4, 6 et 10 min après la première boucle. */
  trajectoire: { min: number; usagers: number }[];
}

interface Partie {
  jalons: Record<string, number>;
  fin: number | null;
  s: GameState;
  /** Part des fournitures dans les recettes tant que tout se fait en ×1 (avant le curseur Exemplaires). */
  partX1: number | null;
  /** Mesures 10 min après la première boucle (null : pas de boucle, ou partie trop courte). */
  apresBoucle: ApresBoucle | null;
  /** L'état à l'ouverture de l'Atelier (première partie), pour comparer un joueur prudent et un agressif. */
  atelier: { s: GameState; t: number } | null;
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
  let usagersMax = 0;
  let apresBoucle: ApresBoucle | null = null;
  let atelier: { s: GameState; t: number } | null = null;
  let aLaBoucle: { usagers: number; service: number } | null = null;
  const trajectoire: { min: number; usagers: number }[] = [];
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
    if (atelier === null && D.getModifiers2(s, now).atelierVisible) atelier = { s, t };
    s = robotActe2(s, now, taps, s.reformes.nombre === 0 ? decouverte : 0);
    const x = s.acte2!;
    const enCours = D.usagersAvecDemarche(x);
    if (s.reformes.nombre === 0) usagersMax = Math.max(usagersMax, enCours);
    if (s.reformes.nombre === 0 && x.premiereBoucle !== null) {
      for (const m of [0, 2, 4, 6])
        if (trajectoire.length === [0, 2, 4, 6].indexOf(m) && now >= x.premiereBoucle + m * 60_000)
          trajectoire.push({ min: m, usagers: enCours });
      if (aLaBoucle === null) aLaBoucle = delivres(s);
      else if (apresBoucle === null && now >= x.premiereBoucle + 600_000) {
        const d = delivres(s);
        apresBoucle = {
          usagers: enCours,
          usagersMax,
          delivresUsagers: d.usagers - aLaBoucle.usagers,
          delivresService: d.service - aLaBoucle.service,
          trajectoire: [...trajectoire, { min: 10, usagers: enCours }],
        };
      }
      const d = delivres(s);
      if (d.service > d.usagers) marquer('plus de documents délivrés au service qu’aux usagers', t);
    }

    for (const id of Object.keys(x.notes)) marquer(`note ${id}${tour()}`, t);
    if (x.guichets > 0) marquer(`premier guichet${tour()}`, t);
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
      return { jalons, fin: t, s, partX1, apresBoucle, atelier };
    }
    if (journal && t % 600 === 0) {
      console.log(
        `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${x.guichets} | agents ${x.agents.instructeur}/${x.agents.chefBureau}/${x.agents.sousDirecteur} | usagers ${Math.round(enCours).toString().padStart(4)} | sans usager ${Math.round(D.dossiersDuService(x)).toString().padStart(5)} | délivrés ${Math.round(delivres(s).usagers)} / ${Math.round(delivres(s).service)} | démat ${D.dematerialisation(x).toFixed(1)} %`,
      );
    }
  }
  return { jalons, fin: null, s, partX1, apresBoucle, atelier };
}

/**
 * Avant la boucle : 10 minutes depuis l'ouverture de l'Atelier, en gardant la Carte d'identité telle quelle
 * (prudent) ou en ajoutant toutes les étapes permises (agressif). Valeur d'une carte et abandons.
 */
function comparerAtelier(depart: { s: GameState; t: number }): void {
  for (const [nom, compose] of [['prudent', false], ['agressif', true]] as const) {
    let s = depart.s;
    const ab0 = s.acte2!.stats.abandonsProc.identite;
    for (let t = depart.t; t < depart.t + 600; t++) s = robotActe2(s, t * 1000, taps, 0, compose);
    const now = (depart.t + 600) * 1000;
    const x = s.acte2!;
    const valeur = valeurDocument(x, 'identite', D.getModifiers2(s, now));
    console.log(
      `  ${nom.padEnd(8)} : ${x.procedures.identite.length} étapes, ${valeur.toFixed(2)} € la carte, ${Math.round(x.stats.abandonsProc.identite - ab0)} abandons en 10 min`,
    );
  }
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
  const a = p.apresBoucle;
  if (a) {
    const part = (100 * a.usagers) / Math.max(1, a.usagersMax);
    console.log(
      `  10 min après la première boucle : ${Math.round(a.usagers)} usagers en cours (${part.toFixed(1)} % du maximum, ${Math.round(a.usagersMax)}) · en 10 min, ${Math.round(a.delivresService)} documents délivrés au service, ${Math.round(a.delivresUsagers)} aux usagers · ${part < 25 && a.delivresService > a.delivresUsagers ? 'critère tenu' : 'critère NON tenu'}`,
    );
    console.log(
      `  trajectoire des usagers en cours après la première boucle : ${a.trajectoire.map((q) => `+${q.min} min ${Math.round(q.usagers)} (${((100 * q.usagers) / Math.max(1, a.usagersMax)).toFixed(1)} %)`).join(' · ')}`,
    );
  }
  if (p.atelier) {
    console.log('  avant la boucle, 10 min depuis l’ouverture de l’Atelier :');
    comparerAtelier(p.atelier);
  }
}
