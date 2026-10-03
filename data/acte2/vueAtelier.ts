/**
 * Vue de l'Atelier des procédures (acte II) : fiches d'étapes avec leurs effets (symbole + mot, jamais la
 * couleur seule), procédures ouvertes, pièces exigées et procédures qui s'exigent mutuellement.
 * Rien ici ne nomme la boucle : l'Atelier la montre par un trombone fermé.
 */
import type { GameState } from '../../types/game';
import {
  PROCS,
  type Etape,
  type EtapeType,
  type ProcId,
} from '../../types/acte2';
import { BALANCE2, ETAPES, PROC_NOMS } from '../../constants/balanceActe2';
import { getModifiers2 } from './moteur';
import { estBoucle, mene } from './procedures';
import { acte2 } from './vues';

/** Ordre du catalogue de l'Atelier. */
const ORDRE_ETAPES: EtapeType[] = [
  'piece',
  'visa',
  'signature',
  'pieceService',
  'reflexion',
  'commission',
];

export type SensEffet = 'plus' | 'moins' | 'neutre';

export interface EffetAffiche {
  /** Symbole et mot : « ++ conformité », « + € », « +++ délai », « − patience ». */
  texte: string;
  sens: SensEffet;
}

/** Crans d'un délai : + jusqu'à 3 s, ++ jusqu'à 5 s, +++ au-delà. */
const cransDelai = (s: number): number => (s <= 3 ? 1 : s <= 5 ? 2 : 3);

/** Effets d'une étape sur la Conformité, la dotation, le délai et la patience. */
export function effetsEtape(type: EtapeType): EffetAffiche[] {
  const e = ETAPES[type];
  return [
    { texte: `${'+'.repeat(e.conf)} conformité`, sens: 'plus' },
    e.dotation > 0
      ? { texte: `${'+'.repeat(e.dotation)} €`, sens: 'plus' }
      : { texte: '0 €', sens: 'neutre' },
    { texte: `${'+'.repeat(cransDelai(e.delai))} délai`, sens: 'neutre' },
    { texte: `${'−'.repeat(e.patience)} patience`, sens: 'moins' },
  ];
}

export interface EtapeAtelier {
  type: EtapeType;
  nom: string;
  effets: EffetAffiche[];
  /** Procédure exigée (« Pièce délivrée par nos services »), sinon null. */
  exige: ProcId | null;
  exigeNom: string | null;
  /** Cette pièce ramène à sa propre procédure : la fiche porte le trombone fermé. */
  boucle: boolean;
}

export interface ProcAtelier {
  id: ProcId;
  nom: string;
  etapes: EtapeAtelier[];
  /** Plus de place pour une étape (BALANCE2.etapesMax). */
  pleine: boolean;
  /** Procédures qu'une pièce de service de cette procédure peut exiger : les autres procédures ouvertes. */
  exigeables: { id: ProcId; nom: string }[];
  /** Procédures prises avec celle-ci dans une boucle (vide sinon). */
  boucle: ProcId[];
  boucleNoms: string[];
}

export interface ChoixEtape {
  type: EtapeType;
  nom: string;
  description: string;
  effets: EffetAffiche[];
}

export interface VueAtelier {
  procedures: ProcAtelier[];
  catalogue: ChoixEtape[];
  etapesMax: number;
}

/** Procédures prises dans la même boucle que `p` (vide si `p` n'est dans aucune). */
export function boucleDe(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  p: ProcId,
): ProcId[] {
  if (!mene(procedures, ouvertes, p, p)) return [];
  return ouvertes.filter(
    (q) =>
      q === p ||
      (mene(procedures, ouvertes, p, q) && mene(procedures, ouvertes, q, p)),
  );
}

/** Atelier : procédures ouvertes et catalogue des étapes débloquées. Null tant que l'Atelier est fermé. */
export function vueAtelier(
  s: GameState,
  maintenant: number,
): VueAtelier | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  if (!m.atelierVisible) return null;
  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));
  return {
    etapesMax: BALANCE2.etapesMax,
    catalogue: ORDRE_ETAPES.filter((t) => m.etapesDisponibles.includes(t)).map(
      (t) => ({
        type: t,
        nom: ETAPES[t].nom,
        description: ETAPES[t].description,
        effets: effetsEtape(t),
      }),
    ),
    procedures: ouvertes.map((p) => {
      const boucle = boucleDe(x.procedures, ouvertes, p);
      return {
        id: p,
        nom: PROC_NOMS[p],
        pleine: x.procedures[p].length >= BALANCE2.etapesMax,
        exigeables: ouvertes
          .filter((q) => q !== p)
          .map((q) => ({ id: q, nom: PROC_NOMS[q] })),
        boucle,
        boucleNoms: boucle.map((q) => PROC_NOMS[q]),
        etapes: x.procedures[p].map((e) => {
          const exige =
            e.type === 'pieceService' && e.exige !== undefined ? e.exige : null;
          return {
            type: e.type,
            nom: ETAPES[e.type].nom,
            effets: effetsEtape(e.type),
            exige,
            exigeNom: exige ? PROC_NOMS[exige] : null,
            boucle:
              exige !== null &&
              ouvertes.includes(exige) &&
              estBoucle(x.procedures, ouvertes, p, exige),
          };
        }),
      };
    }),
  };
}
