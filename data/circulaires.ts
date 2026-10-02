/**
 * Circulaires : une courte explication, affichée une seule fois,
 * quand une mécanique apparaît.
 */
import type { GameState, Modifiers } from '../types/game';
import { NOTES_PAR_ID } from './notes';
import { dossiersEnAttente } from './engine';

export interface CirculaireDef {
  id: string;
  numero: number;
  titre: string;
  texte: string;
  declencheur: (s: GameState, m: Modifiers) => boolean;
}

export const CIRCULAIRES: CirculaireDef[] = [
  {
    id: 'collegues',
    numero: 1,
    titre: 'Recrutement de collègues',
    texte:
      'Des collègues peuvent être recrutés. Ils tamponnent à votre place, sans enthousiasme mais sans interruption. Plus vous en avez, plus la file baisse.',
    declencheur: (_s, m) => m.recrutementVisible,
  },
  {
    id: 'rejet',
    numero: 2,
    titre: 'Rejet des dossiers',
    texte:
      'Vous pouvez désormais rejeter des dossiers. Un dossier rejeté rapporte une prime et revient plus tard, moins patient. Un usager sans patience abandonne.',
    declencheur: (_s, m) => m.rejetVisible,
  },
  {
    id: 'perimetre',
    numero: 3,
    titre: 'Périmètre du guichet',
    texte:
      'La file ne se remplit pas toute seule. Quand vos collègues vont plus vite que les demandes, étendez le périmètre : de nouveaux usagers, de nouveaux dossiers.',
    declencheur: (s) => s.notes.tilleuls !== undefined || NOTES_PAR_ID.tilleuls.visible(s),
  },
  {
    id: 'conformite',
    numero: 4,
    titre: 'Mesure de la conformité',
    texte:
      'Votre Conformité est désormais mesurée. Elle monte avec les rejets et les pièces exigées. À 100 %, votre dossier sera réexaminé.',
    declencheur: (_s, m) => m.conformiteVisible,
  },
  {
    id: 'relance',
    numero: 5,
    titre: 'Relance du service instructeur',
    texte:
      'Une note de service est en cours d’instruction. Chaque coup de tampon vaut relance et raccourcit le délai d’une seconde. Le délai ne peut être réduit de plus de moitié : au-delà, les relances sont classées sans suite.',
    declencheur: (s) => Object.values(s.notes).some((n) => n !== undefined && n.effective > s.derniereMaj),
  },
  {
    // Fin d'acte : les collègues traitent plus vite que la population ne dépose.
    id: 'penurie',
    numero: 6,
    titre: 'Pénurie d’usagers',
    texte:
      'Vos services traitent désormais les dossiers plus vite que la population ne parvient à les produire. Il ne s’agit pas d’une panne : il s’agit d’une réussite. Les usagers rejetés reviendront d’eux-mêmes. Ils reviennent toujours.',
    declencheur: (s, m) => m.conformiteVisible && dossiersEnAttente(s) < 1,
  },
];

/**
 * Circulaires déclenchées et pas encore lues, la plus récente d'abord : une ancienne
 * restée sans suite ne retarde pas celle qui sert maintenant (Relance, Pénurie…).
 */
export function circulairesEnAttente(s: GameState, m: Modifiers): CirculaireDef[] {
  return CIRCULAIRES.filter((c) => !s.circulairesVues.includes(c.id) && c.declencheur(s, m)).reverse();
}

/** La circulaire à afficher : la plus récente des circulaires en attente. */
export function circulaireAAfficher(s: GameState, m: Modifiers): CirculaireDef | null {
  return circulairesEnAttente(s, m)[0] ?? null;
}

/** Identifiants des circulaires dont la mécanique est déjà débloquée. */
export function circulairesDejaDeclenchees(s: GameState, m: Modifiers): string[] {
  return CIRCULAIRES.filter((c) => c.declencheur(s, m)).map((c) => c.id);
}
