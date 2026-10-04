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
  type EtatActe2,
  type Modifiers2,
  type ProcId,
} from '../../types/acte2';
import { BALANCE2, ETAPES, EXEMPLAIRES } from '../../constants/balanceActe2';
import { formatEntier, formatEuros } from '../../utils/formatters';
import { getModifiers2 } from './moteur';
import { estBoucle, mene } from './procedures';
import { valeurDocument } from './production';
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
  /** Dossiers en cours dans la procédure (usagers et sans usager). */
  enCours: number;
  /** Usagers perdus dans la procédure (patience et rejet). */
  abandons: number;
  /** Bilan d'un dossier sur la procédure entière : « +4,48 € », « −4 patience », « 13 s de délai ». */
  bilan: EffetAffiche[];
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
  /** Faux : « En attente de réglementation » (aucune note n'est citée), non sélectionnable. */
  disponible: boolean;
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

/** Patience à une décimale au plus (« 4 », « 4,5 »). */
const unDecimal = (v: number): string =>
  (Math.round(v * 10) / 10).toLocaleString('fr-FR');

/**
 * Bilan d'un dossier qui franchit toute la procédure `p` : dotation (grade, Jurisprudence et Exemplaires
 * compris, sans la prime de rejet), patience coûtée (Droit acquis compris) et délai cumulé des étapes.
 */
export function bilanProcedure(
  x: EtatActe2,
  p: ProcId,
  m: Modifiers2,
): EffetAffiche[] {
  const ex = EXEMPLAIRES[x.exemplaires];
  const euros = valeurDocument(x, p, m);
  let patience = 0;
  let delai = 0;
  x.procedures[p].forEach((e, k) => {
    const def = ETAPES[e.type];
    if (!(m.droitAcquis && k === 0)) patience += def.patience * ex.patience;
    delai += def.delai;
  });
  return [
    euros > 0
      ? { texte: `+${formatEuros(euros)}\u00a0€`, sens: 'plus' }
      : { texte: '0\u00a0€', sens: 'neutre' },
    patience > 0
      ? { texte: `−${unDecimal(patience)} patience`, sens: 'moins' }
      : { texte: '0 patience', sens: 'neutre' },
    { texte: `${formatEntier(delai)} s de délai`, sens: 'neutre' },
  ];
}

/** Atelier : procédures ouvertes, leur bilan, et le catalogue de toutes les étapes. Null tant que l'Atelier est fermé. */
export function vueAtelier(
  s: GameState,
  maintenant: number,
): VueAtelier | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  if (!m.atelierVisible) return null;
  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));
  // Les noms changent à chaque Réforme (« rien d'autre ne change »).
  const noms = s.reformes.denomination.procedures;
  return {
    etapesMax: BALANCE2.etapesMax,
    // Toutes les étapes ; celles qu'aucune note n'a encore réglementées sont grisées.
    catalogue: ORDRE_ETAPES.map((t) => ({
      type: t,
      nom: ETAPES[t].nom,
      description: ETAPES[t].description,
      effets: effetsEtape(t),
      disponible: m.etapesDisponibles.includes(t),
    })),
    procedures: ouvertes.map((p) => {
      const boucle = boucleDe(x.procedures, ouvertes, p);
      return {
        id: p,
        nom: noms[p],
        enCours: Math.floor(
          x.usagers[p].reduce((a, v) => a + v, 0) +
            x.boucles[p].reduce((a, v) => a + v, 0) +
            x.suites[p].reduce((a, v) => a + v, 0),
        ),
        abandons: Math.floor(x.stats.abandonsProc[p]),
        bilan: bilanProcedure(x, p, m),
        pleine: x.procedures[p].length >= BALANCE2.etapesMax,
        exigeables: ouvertes
          .filter((q) => q !== p)
          .map((q) => ({ id: q, nom: noms[q] })),
        boucle,
        boucleNoms: boucle.map((q) => noms[q]),
        etapes: x.procedures[p].map((e) => {
          const exige =
            e.type === 'pieceService' && e.exige !== undefined ? e.exige : null;
          return {
            type: e.type,
            nom: ETAPES[e.type].nom,
            effets: effetsEtape(e.type),
            exige,
            exigeNom: exige ? noms[exige] : null,
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
