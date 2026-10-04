/**
 * La Réforme (premier prestige) : trombones, retour au début de l'acte I, Jurisprudence.
 * Fonctions pures, utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState, Lettre, NoteId } from '../types/game';
import type { Note2Id, ProcId } from '../types/acte2';
import { PROCS } from '../types/acte2';
import type { JurisprudenceId } from '../types/reforme';
import { JURISPRUDENCE, REFORME, type JurisprudenceDef } from '../constants/balanceActe2';
import { etatInitial } from './engine';
import { copieProcedures, getModifiers2 } from './acte2/moteur';
import { tirerDenomination } from './jurisprudence';

/** Conformité de la partie en cours, acte I compris : ce que la prochaine Réforme convertit. */
export function conformitePartie(s: GameState): number {
  return s.conformitePoints + (s.acte2?.conformitePoints ?? 0);
}

/** Trombones qu'une Réforme rapporterait maintenant : ⌊√(Conformité cumulée non convertie / k)⌋. */
export function trombonesReforme(s: GameState): number {
  return Math.floor(Math.sqrt(Math.max(0, conformitePartie(s)) / REFORME.k));
}

/** La Réforme se déclenche à l'acte II, une fois la note « Réforme de l'action publique » en vigueur. */
export function peutReformer(s: GameState, maintenant: number): boolean {
  return (
    s.acte === 2 &&
    s.acte2 !== null &&
    getModifiers2(s, maintenant).reformeVisible
  );
}

/** Numéro du Cerfa d'embauche de la partie : 00001*01, puis *02, *03… à chaque Réforme. */
export function numeroCerfa(s: GameState): string {
  return `00001*${String(s.reformes.nombre + 1).padStart(2, '0')}`;
}

const union = <T>(a: T[], b: T[]): T[] => [
  ...a,
  ...b.filter((v) => !a.includes(v)),
];

/**
 * La Réforme : retour au tout début de l'acte I, Cerfa redemandé. Survivent : les trombones (et ceux
 * de cette Réforme), la Jurisprudence, le compteur Tampons apposés (donc le grade), le prénom, le premier
 * Cerfa, les lettres déjà reçues, les notes déjà instruites (déjà-vu) et les procédures (Mémoire des services).
 * La fiche de poste n'est pas reproposée. `alea` tire le nouveau seuil de la note n° 1 et les nouveaux noms.
 */
export function reformer(
  s: GameState,
  maintenant: number,
  alea: () => number = Math.random,
): GameState {
  if (!peutReformer(s, maintenant) || !s.acte2) return s;
  const r = s.reformes;
  const base = etatInitial(maintenant, alea);
  const precedent = r.jurisprudence.includes('precedent');
  const gain = trombonesReforme(s);
  return {
    ...base,
    cerfa: { signe: false, prenom: s.cerfa.prenom, signeLe: null },
    tampons: s.tampons,
    fichePosteVue: true,
    agents: {
      ...base.agents,
      stagiaire: precedent ? REFORME.stagiairesPrecedent : 0,
    },
    courrier: s.courrier,
    // Les lettres d'avancement suivent le compteur, qui survit : elles ne repartent pas. Les autres, si.
    lettresEnvoyees: s.lettresEnvoyees.filter(
      (id) => id.startsWith('grade') || id.startsWith('reforme-'),
    ),
    reformes: {
      ...r,
      nombre: r.nombre + 1,
      trombones: r.trombones + gain,
      trombonesObtenus: r.trombonesObtenus + gain,
      conformiteConvertie: r.conformiteConvertie + conformitePartie(s),
      notesInstruites: union(
        r.notesInstruites,
        Object.keys(s.notes) as NoteId[],
      ),
      notes2Instruites: union(
        r.notes2Instruites,
        Object.keys(s.acte2.notes) as Note2Id[],
      ),
      procedures: copieProcedures(s.acte2.procedures),
      ancienneDirection: r.denomination.direction,
      denomination: tirerDenomination(r.denomination, alea),
      premierCerfa: r.premierCerfa ?? {
        prenom: s.cerfa.prenom,
        signeLe: s.cerfa.signeLe,
      },
    },
  };
}

export function coutJurisprudence(id: JurisprudenceId): number {
  return JURISPRUDENCE.find((j) => j.id === id)?.cout ?? Infinity;
}

export function peutAcheterJurisprudence(
  s: GameState,
  id: JurisprudenceId,
): boolean {
  return (
    !s.reformes.jurisprudence.includes(id) &&
    s.reformes.trombones >= coutJurisprudence(id)
  );
}

/**
 * Achat d'un bonus de Jurisprudence avec les trombones (définitif). Précédent et Antériorité valent aussi
 * pour la partie en cours : acheté à l'acte I, Précédent complète les stagiaires à 3 ; acheté à l'acte II,
 * Antériorité complète les guichets à 10.
 */
export function acheterJurisprudence(
  s: GameState,
  id: JurisprudenceId,
): GameState {
  if (!peutAcheterJurisprudence(s, id)) return s;
  const r: GameState = {
    ...s,
    reformes: {
      ...s.reformes,
      trombones: s.reformes.trombones - coutJurisprudence(id),
      jurisprudence: [...s.reformes.jurisprudence, id],
    },
  };
  if (id === 'precedent' && r.acte === 1) {
    return {
      ...r,
      agents: {
        ...r.agents,
        stagiaire: Math.max(r.agents.stagiaire, REFORME.stagiairesPrecedent),
      },
    };
  }
  if (id === 'anteriorite' && r.acte2 && r.acte === 2) {
    return {
      ...r,
      acte2: {
        ...r.acte2,
        guichets: Math.max(r.acte2.guichets, REFORME.guichetsAnteriorite),
      },
    };
  }
  return r;
}

/** Lettre du S.I.C. après chaque Réforme : la nouvelle dénomination des services. Une par Réforme. */
export function lettreReforme(s: GameState, maintenant: number): Lettre | null {
  const n = s.reformes.nombre;
  const id = `reforme-${n}`;
  if (n === 0 || s.lettresEnvoyees.includes(id)) return null;
  const d = s.reformes.denomination;
  const procedures = PROCS.map((p: ProcId) => `— ${d.procedures[p]}`).join(
    '\n',
  );
  return {
    id,
    objet: 'Réforme : nouvelle dénomination de vos services',
    corps: `Dans le cadre de la réforme de l’action publique, vos services sont réorganisés sans modification de leur fonctionnement.\n\n${s.reformes.ancienneDirection} devient : ${d.direction}.\n\nVos procédures deviennent :\n${procedures}\n\nVotre réembauche (Cerfa n° ${numeroCerfa(s)}) a été enregistrée. Le Cerfa n° 00001*01 demeure l’original.`,
    recue: maintenant,
    lue: false,
  };
}

export interface JurisprudenceAffichee extends JurisprudenceDef {
  acquise: boolean;
  achetable: boolean;
}

/** Dossier administratif : trombones, Réforme possible et Jurisprudence. */
export interface VueReforme {
  /** Trombones disponibles ; null avant la première Réforme (ils n'apparaissent qu'après). */
  trombones: number | null;
  /** La Réforme peut être engagée (acte II, note « Réforme de l'action publique » en vigueur). */
  possible: boolean;
  /** Trombones qu'elle rapporterait maintenant. */
  gain: number;
  /** Numéro du Cerfa qui sera redemandé après la Réforme. */
  cerfaSuivant: string;
  /** Bonus de Jurisprudence ; null avant la première Réforme. */
  jurisprudence: JurisprudenceAffichee[] | null;
}

export function vueReforme(s: GameState, maintenant: number): VueReforme {
  const r = s.reformes;
  const apres = r.nombre > 0;
  return {
    trombones: apres ? r.trombones : null,
    possible: peutReformer(s, maintenant),
    gain: trombonesReforme(s),
    cerfaSuivant: `00001*${String(r.nombre + 2).padStart(2, '0')}`,
    jurisprudence: apres
      ? JURISPRUDENCE.map((j) => ({
          ...j,
          acquise: r.jurisprudence.includes(j.id),
          achetable: peutAcheterJurisprudence(s, j.id),
        }))
      : null,
  };
}
