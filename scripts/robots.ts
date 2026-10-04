/**
 * Joueurs-robots des simulateurs : une seconde de jeu à l'acte I (robotActe1) ou à l'acte II (robotActe2).
 * Ils tamponnent, règlent les curseurs au maximum, achètent les notes dès qu'ils peuvent et recrutent.
 * Utilisé par scripts/simulate-acte1.ts et scripts/simulate-acte2.ts (Réforme comprise).
 */
import type { GameState } from '../types/game';
import type { ActionAtelier, EtapeType, ProcId } from '../types/acte2';
import type { JurisprudenceId } from '../types/reforme';
import { BALANCE } from '../constants/balance';
import { BALANCE2 } from '../constants/balanceActe2';
import * as E from '../data/engine';
import * as D from '../data/acte2/moteur';
import * as R from '../data/reforme';
import { NOTES } from '../data/notes';
import { NOTES2 } from '../data/acte2/notes2';

/**
 * Fin d'un premier acte I joué par le robot (scripts/simulate-acte1.ts) : compteur de tampons, Conformité
 * à 100 %, toutes les notes approuvées. Point de départ de simulate-acte2.
 */
export function finActeIRobot(): GameState {
  const s = E.signerCerfa(
    E.etatInitial(0, () => 0.5),
    'Robot',
    0,
  );
  return {
    ...s,
    tampons: 160_000,
    conformitePoints: BALANCE.confCible,
    fichePosteVue: true,
    acteTermine: true,
    notes: Object.fromEntries(
      NOTES.map((n) => [n.id, { achetee: 0, effective: 0 }]),
    ),
  };
}

/** Mesures de l'acte I que simulate-acte1 affiche. */
export interface MesuresActe1 {
  tapsDemandes: number;
  tapsTraites: number;
}

/** Une seconde d'acte I : `taps` coups de tampon, un tick, rejet au maximum, notes, ramettes, collègues. */
export function robotActe1(
  s0: GameState,
  now: number,
  taps: number,
  mesures?: MesuresActe1,
): GameState {
  let s = s0;
  const puissance = E.getModifiers(s, now).tapPower;
  for (let i = 0; i < taps; i++) {
    const r = E.tamponner(s, now);
    if (mesures) {
      mesures.tapsDemandes += puissance;
      mesures.tapsTraites += r.ev.traites;
    }
    s = r.s;
  }
  s = E.tick(s, 1, now).s;
  const m = E.getModifiers(s, now);
  if (m.rejetVisible) s = E.reglerTauxRejet(s, m.rejetMax, now);
  for (const id of E.notesVisibles(s))
    if (E.peutAcheterNote(s, id)) s = E.acheterNote(s, id, now);

  // Formulaires : garder 20 s de consommation.
  const conso = (E.vitesseCollegues(s, m) + m.tapPower * taps) * m.pieces * 20;
  if (!m.commandeAuto && s.formulaires < conso) {
    s = E.acheterRamettes(
      s,
      Math.ceil((conso - s.formulaires) / BALANCE.ramette),
      now,
    );
  }

  // Collègues : le meilleur ratio vitesse/coût, sans affamer la prochaine note.
  const enAttente = NOTES.filter(
    (n) => s.notes[n.id] === undefined && n.visible(s) && n.cout > 0,
  );
  const reserve = enAttente.length
    ? Math.min(...enAttente.map((n) => E.conditionsNoteActe1(s, n.id).cout))
    : 0;
  for (;;) {
    const choix = m.agentsDisponibles
      .map((id) => ({
        id,
        cout: E.coutAgent(id, s.agents[id]),
        gain: E.gainAgent(s, id, m),
      }))
      .sort((a, b) => b.gain / b.cout - a.gain / a.cout)[0];
    if (
      !choix ||
      s.budget < choix.cout ||
      (reserve > 0 &&
        choix.cout > reserve * 0.5 &&
        s.budget - choix.cout < reserve)
    )
      break;
    s = E.acheterAgent(s, choix.id, now);
  }
  return s;
}

/** Procédure exigée par chaque procédure : identite ↔ domicile forment la boucle. */
const PARTENAIRE: Record<ProcId, ProcId> = {
  identite: 'domicile',
  domicile: 'identite',
  hebergement: 'domicile',
  vie: 'identite',
};
/** Étapes voulues dans chaque procédure, dans l'ordre (un second visa : les agents travaillent aussi). */
const VOULU: EtapeType[] = [
  'piece',
  'visa',
  'signature',
  'pieceService',
  'visa',
  'commission',
];

/**
 * Ajoute à chaque procédure ouverte les étapes voulues qui manquent. La « Pièce délivrée par nos services »
 * attend `decouverte` secondes après sa note (le temps qu'un humain comprenne l'indice) ; 0 : aussitôt.
 */
function composer(s0: GameState, now: number, decouverte: number): GameState {
  let s = s0;
  for (;;) {
    const m = D.getModifiers2(s, now);
    if (!m.atelierVisible) return s;
    const x = s.acte2!;
    const note7 = x.notes.pieceService;
    const compris =
      note7 !== undefined && now >= note7.effective + decouverte * 1000;
    let action: ActionAtelier | null = null;
    for (const p of m.procsOuvertes) {
      const types = x.procedures[p].map((e) => e.type);
      // Une étape manque quand la procédure en compte moins que la liste voulue jusqu'à elle.
      const manque = VOULU.find(
        (t, i) =>
          m.etapesDisponibles.includes(t) &&
          types.filter((v) => v === t).length <
            VOULU.slice(0, i + 1).filter((v) => v === t).length &&
          (t !== 'pieceService' || compris),
      );
      if (manque === undefined) continue;
      action =
        manque === 'pieceService'
          ? { type: 'ajouter', p, etape: manque, exige: PARTENAIRE[p] }
          : { type: 'ajouter', p, etape: manque };
      break;
    }
    if (!action) return s;
    const avant = s;
    s = D.modifierProcedure(s, action, now);
    if (s === avant) return s;
  }
}

/** Une seconde d'acte II : visas au tap, tick, curseurs, notes, Atelier, ramettes, recrutement selon le goulot. */
export function robotActe2(
  s0: GameState,
  now: number,
  taps: number,
  decouverte = 0,
): GameState {
  let s = s0;
  for (let i = 0; i < taps; i++) s = D.tamponner2(s, now).s;
  s = D.tick2(s, 1, now).s;

  let m = D.getModifiers2(s, now);
  s = D.reglerTauxRejet2(s, m.rejetMax, now);
  if (m.exemplairesVisible) s = D.reglerExemplaires(s, 2, now);
  for (const id of D.notesVisibles2(s))
    if (D.peutAcheterNote2(s, id)) s = D.acheterNote2(s, id, now);
  s = composer(s, now, decouverte);
  m = D.getModifiers2(s, now);

  // Formulaires : garder 20 s de consommation.
  const x = s.acte2!;
  const conso =
    (D.vitesseGuichets(x) + D.vitesseVisas(x) + taps) * x.exemplaires * 20;
  if (s.formulaires < conso)
    s = D.acheterRamettes2(
      s,
      Math.ceil((conso - s.formulaires) / BALANCE.ramette),
    );
  s = D.requisitionUrgence2(s);

  // Recrutement : la meilleure capacité par euro, pondérée par la part des dossiers qui l'attendent
  // (visas pour les agents, autres étapes pour les guichets), sans affamer la prochaine note.
  const enAttente = NOTES2.filter(
    (n) => s.acte2!.notes[n.id] === undefined && n.visible(s) && n.cout > 0,
  );
  const reserve = enAttente.length
    ? Math.min(...enAttente.map((n) => D.conditionsNote2(s, n.id).cout))
    : 0;
  for (;;) {
    const y = s.acte2!;
    const visas = D.visasEnAttente(y);
    const total = D.usagersEnCours(y) + D.dossiersEnBoucle(y);
    const partVisas = total > 0 ? visas / total : 0.5;
    const options = [
      {
        id: 'guichet' as const,
        cout: D.coutGuichet(y.guichets, D.guichetsOfferts(s)),
        gain: BALANCE2.guichet.vitesse * (1 - partVisas),
      },
      ...m.agentsDisponibles.map((id) => ({
        id,
        cout: D.coutAgent2(id, y.agents[id]),
        gain: D.gainAgent2(y, id) * partVisas,
      })),
    ].sort((a, b) => b.gain / b.cout - a.gain / a.cout);
    const choix = options[0];
    if (!m.recrutementVisible || s.budget < choix.cout) break;
    if (
      reserve > 0 &&
      choix.cout > reserve * 0.5 &&
      s.budget - choix.cout < reserve
    )
      break;
    const avant = s;
    s =
      choix.id === 'guichet'
        ? D.acheterGuichet(s, now)
        : D.acheterAgent2(s, choix.id, now);
    if (s === avant) break;
  }
  return s;
}

/** Ordre d'achat de la Jurisprudence du robot : ce qui raccourcit le plus la partie suivante d'abord. */
export const PRIORITE_JURISPRUDENCE: JurisprudenceId[] = [
  'memoire',
  'anteriorite',
  'anciennete',
  'videJuridique',
  'precedent',
  'droitAcquis',
];

/** Réforme du robot : il réforme, achète la Jurisprudence par priorité et signe le nouveau Cerfa. */
export function robotReforme(s0: GameState, now: number): GameState {
  let s = R.reformer(s0, now);
  for (;;) {
    const id = PRIORITE_JURISPRUDENCE.find((j) =>
      R.peutAcheterJurisprudence(s, j),
    );
    if (!id) break;
    s = R.acheterJurisprudence(s, id);
  }
  return E.signerCerfa(s, s.cerfa.prenom, now);
}
