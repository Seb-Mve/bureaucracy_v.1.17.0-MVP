/**
 * Fiche de poste du chef de service (acte II) : même format que celle du guichet 3. Elle s'ouvre à la prise
 * de fonctions, se relit depuis Options ; trois lignes qui suivent le circuit de l'écran (specs/013 : les usagers,
 * les guichets, votre visa et ce qu'il rapporte),
 * puis les agents et le service des achats à leur note (aucune ligne n'explique un arbitrage). Rien ne nomme la
 * boucle ni la dématérialisation ; le seul mot pour ce que le service traite est « demande ».
 */
import type { GameState } from '../../types/game';
import type { EtatActe2, LigneFiche2Id, Note2Id } from '../../types/acte2';
import { getModifiers2, noteEffective2 } from './moteur';
import { BALANCE2, ETAPES, EXEMPLAIRES } from '../../constants/balanceActe2';
import { formatEuros } from '../../utils/formatters';

/** Remplacé dans le texte d'une ligne par ce que rapporte un visa (« 2,24 »), grade et exemplaires compris. */
const MONTANT = '{montant}';

interface LigneDef {
  id: LigneFiche2Id;
  /** Note dont l'entrée en vigueur ajoute la ligne (null : dès la prise de fonctions). */
  note: Note2Id | null;
  titre: string;
  texte: string;
}

const LIGNES: LigneDef[] = [
  {
    id: 'circulation',
    note: null,
    titre: 'Les usagers déposent leur demande au guichet.',
    texte: 'Pour une Carte d’identité.',
  },
  {
    id: 'guichets',
    note: null,
    titre: 'Le guichet vérifie leurs pièces et vous transmet la demande.',
    texte: 'Elle arrive dans « À viser ».',
  },
  {
    id: 'dotation',
    note: null,
    titre: 'Vous tamponnez le visa : la carte est délivrée.',
    texte: `Chaque visa rapporte ${MONTANT}\u00a0€ au service.`,
  },
  {
    id: 'agents',
    note: 'agents',
    titre: 'Les agents visent à votre place.',
    texte: 'Ils accordent les visas en attente, au rythme de leur ancienneté.',
  },
  {
    id: 'achats',
    note: 'achats',
    titre: 'Les fournitures sont commandées par le service des achats.',
    texte: 'Il prélève sur votre budget ce que le marché public exige.',
  },
];

/** Lignes de la fiche à cette date (notes en vigueur), dans l'ordre de la fiche. */
export function lignesFiche2(
  s: GameState,
  maintenant: number,
): LigneFiche2Id[] {
  const x = s.acte2;
  if (!x) return [];
  return LIGNES.filter(
    (l) => l.note === null || noteEffective2(x, l.note, maintenant),
  ).map((l) => l.id);
}

export interface LigneFicheAffichee {
  id: LigneFiche2Id;
  titre: string;
  texte: string;
  /** Ajoutée depuis la dernière lecture. */
  nouvelle: boolean;
}

export interface VueFiche2 {
  /** La fiche est ouverte (prise de fonctions, ou relue depuis Options). */
  visible: boolean;
  /** Jamais refermée : le bouton dit « PRENDRE MON POSTE », sinon « FERMER ». */
  premiere: boolean;
  agent: string;
  nomService: string;
  lignes: LigneFicheAffichee[];
  /** Lignes ajoutées depuis la dernière lecture (pastille de l'onglet Options), 0 tant que la fiche est ouverte. */
  nonLues: number;
}

/** Fiche de poste du chef de service. Null hors de l'acte II. */
export function vueFiche2(s: GameState, maintenant: number): VueFiche2 | null {
  const x = s.acte === 2 ? s.acte2 : null;
  if (!x) return null;
  const ids = lignesFiche2(s, maintenant);
  const m = getModifiers2(s, maintenant);
  const montant = formatEuros(
    BALANCE2.dotation * m.dotationMult * EXEMPLAIRES[x.exemplaires].dotation * ETAPES.visa.dotation,
  );
  const lignes = LIGNES.filter((l) => ids.includes(l.id)).map((l) => ({
    id: l.id,
    titre: l.titre,
    texte: l.texte.replace(MONTANT, montant),
    nouvelle: !x.ficheLues.includes(l.id),
  }));
  return {
    visible: !x.ficheVue,
    premiere: x.ficheLues.length === 0,
    agent: s.cerfa.prenom || 'Agent sans prénom',
    nomService: s.reformes.denomination.direction,
    lignes,
    nonLues: x.ficheVue ? lignes.filter((l) => l.nouvelle).length : 0,
  };
}

/**
 * Ouvre (`vue` faux, « Relire ma fiche de poste ») ou referme la fiche. La refermer marque lues toutes les
 * lignes en vigueur ; déjà refermée, elle ne change rien. Même objet si rien ne change.
 */
export function marquerFiche2(
  s: GameState,
  vue: boolean,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x || s.acte !== 2) return s;
  if (!vue) return x.ficheVue ? { ...s, acte2: { ...x, ficheVue: false } } : s;
  // Déjà refermée : rien ne change (les lignes non lues gardent leur pastille).
  if (x.ficheVue) return s;
  const lues = lignesFiche2(s, maintenant);
  const y: EtatActe2 = { ...x, ficheVue: true, ficheLues: lues };
  return { ...s, acte2: y };
}
