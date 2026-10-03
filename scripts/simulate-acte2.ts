/**
 * Simulateur d'équilibrage de l'acte II.
 * Usage : node scripts/simulate-acte2.ts [tapsParSeconde] [minutesMax]
 *
 * Un joueur-robot entre dans l'acte II avec le compteur d'une fin d'acte I, tamponne les visas,
 * règle les curseurs au maximum, achète les notes dès qu'il peut, compose ses procédures
 * (boucle dès que possible) et recrute selon le goulot. Il construit la boucle instantanément :
 * un humain mettra plus longtemps. Sans Réforme (plan 3).
 */
import { registerHooks } from 'node:module';
import type { ActionAtelier, EtapeType, ProcId } from '../types/acte2.ts';

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
const D = await import('../data/acte2/moteur.ts');
const { NOTES2 } = await import('../data/acte2/notes2.ts');

const taps = Number(process.argv[2] ?? 2);
const minutesMax = Number(process.argv[3] ?? 240);

let s = D.entrerActe2({ ...E.signerCerfa(E.etatInitial(0), 'Robot', 0), tampons: 160000 }, 0);
const jalons: Record<string, number> = {};
const marquer = (k: string, t: number) => {
  if (jalons[k] === undefined) jalons[k] = t;
};
const mn = (t: number) => `${(t / 60).toFixed(1)} min`;

/** Procédure exigée par chaque procédure : identite ↔ domicile forment la boucle. */
const PARTENAIRE: Record<ProcId, ProcId> = {
  identite: 'domicile',
  domicile: 'identite',
  hebergement: 'domicile',
  vie: 'identite',
};
const VOULU: EtapeType[] = ['piece', 'visa', 'signature', 'pieceService', 'commission'];

/** Ajoute à chaque procédure ouverte les étapes voulues qui manquent. */
function composer(now: number): void {
  for (;;) {
    const m = D.getModifiers2(s, now);
    if (!m.atelierVisible) return;
    const x = s.acte2!;
    let action: ActionAtelier | null = null;
    for (const p of m.procsOuvertes) {
      const types = x.procedures[p].map((e) => e.type);
      const manque = VOULU.find((t) => m.etapesDisponibles.includes(t) && !types.includes(t));
      if (manque === undefined) continue;
      action =
        manque === 'pieceService'
          ? { type: 'ajouter', p, etape: manque, exige: PARTENAIRE[p] }
          : { type: 'ajouter', p, etape: manque };
      break;
    }
    if (!action) return;
    const avant = s;
    s = D.modifierProcedure(s, action, now);
    if (s === avant) return;
  }
}

for (let t = 1; t <= minutesMax * 60; t++) {
  const now = t * 1000;
  for (let i = 0; i < taps; i++) s = D.tamponner2(s, now).s;
  s = D.tick2(s, 1, now).s;

  let m = D.getModifiers2(s, now);
  s = D.reglerTauxRejet2(s, m.rejetMax, now);
  if (m.exemplairesVisible) s = D.reglerExemplaires(s, 2, now);

  for (const id of D.notesVisibles2(s)) {
    if (D.peutAcheterNote2(s, id)) {
      s = D.acheterNote2(s, id, now);
      marquer(`note ${id}`, t);
    }
  }
  composer(now);
  m = D.getModifiers2(s, now);

  // Formulaires : garder 20 s de consommation.
  const x = s.acte2!;
  const conso = (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (s.formulaires < conso) s = D.acheterRamettes2(s, Math.ceil((conso - s.formulaires) / BALANCE.ramette));
  s = D.requisitionUrgence2(s);

  // Recrutement : on renforce le goulot (visas ou guichets), sans affamer la prochaine note.
  const enAttente = NOTES2.filter((n) => s.acte2!.notes[n.id] === undefined && n.visible(s) && n.cout > 0);
  const reserve = enAttente.length ? Math.min(...enAttente.map((n) => n.cout)) : 0;
  for (;;) {
    const y = s.acte2!;
    const visas = D.visasEnAttente(y);
    const autres = D.usagersEnCours(y) + D.dossiersEnBoucle(y) - visas;
    const agent = m.agentsDisponibles
      .map((id) => ({ id, cout: D.coutAgent2(id, y.agents[id]), gain: D.gainAgent2(y, id) }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    const veutAgent = agent !== undefined && visas > autres;
    const cout = veutAgent ? agent.cout : D.coutGuichet(y.guichets);
    if (!m.recrutementVisible || s.budget < cout) break;
    if (reserve > 0 && cout > reserve * 0.5 && s.budget - cout < reserve) break;
    const avant = s;
    s = veutAgent ? D.acheterAgent2(s, agent.id, now) : D.acheterGuichet(s, now);
    if (s === avant) break;
    if (veutAgent) marquer('premier agent', t);
  }

  const y = s.acte2!;
  if (m.atelierVisible) marquer('atelier', t);
  if (y.premiereBoucle !== null) marquer('première boucle', t);
  if (m.reformeVisible) marquer('réforme débloquée', t);
  for (const pct of [25, 50, 75, 100]) if (D.dematerialisation(y) >= pct) marquer(`dématérialisation ${pct} %`, t);
  if (y.acteTermine) {
    marquer('fin de l’acte II', t);
    break;
  }

  if (t % 600 === 0) {
    console.log(
      `${mn(t).padStart(9)} | budget ${Math.round(s.budget).toString().padStart(9)} € | guichets ${y.guichets} | agents ${y.agents.instructeur}/${y.agents.chefBureau}/${y.agents.sousDirecteur} | usagers ${Math.round(D.usagersEnCours(y))} | boucle ${Math.round(D.dossiersEnBoucle(y))} | pop ${Math.round(y.population)} | démarches abandonnées ${Math.round(y.stats.abandonsDemarche)} | démat ${D.dematerialisation(y).toFixed(1)} %`,
    );
  }
}

console.log('\nJalons :');
for (const [k, t] of Object.entries(jalons).sort((a, b) => a[1] - b[1])) {
  console.log(`  ${mn(t).padStart(9)}  ${k}`);
}
const fin = s.acte2!;
console.log('\nMesures :');
console.log(`  visas au tap : ${Math.round(fin.stats.visasTampons)} sur ${Math.round(fin.stats.taps)} taps`);
console.log(`  procédures : ${Object.entries(fin.procedures).map(([p, e]) => `${p} [${e.map((v) => v.type).join(', ')}]`).join(' · ')}`);
