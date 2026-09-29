/**
 * Ordre du jour : une consigne à la fois pour guider les premières minutes.
 * La première consigne non remplie s'affiche ; null quand tout est fait.
 */
import type { GameState, Modifiers } from '../types/game';
import { NOTES_PAR_ID } from './notes';

export type Onglet = 'recruitment' | 'notes';

export interface Consigne {
  id: string;
  texte: string;
  progression?: { valeur: number; cible: number };
  /** Onglet ouvert par un tap sur le bandeau. */
  onglet?: Onglet;
}

/** En dessous de ce stock, racheter des formulaires passe en priorité. */
const SEUIL_FORMULAIRES = 20;

const NOTE_EN_ATTENTE: Consigne = { id: 'note', texte: 'Une note de service vous attend.', onglet: 'notes' };
const FORMULAIRES: Consigne = {
  id: 'formulaires',
  texte: 'Rachetez des formulaires avant la rupture.',
  onglet: 'recruitment',
};

export function ordreDuJour(s: GameState, m: Modifiers): Consigne | null {
  const achetee = (id: keyof typeof NOTES_PAR_ID) => s.notes[id] !== undefined;
  const tampons = Math.floor(s.tampons);
  const collegues = Object.values(s.agents).reduce((a, b) => a + b, 0);
  const aRachete = s.stats.formulairesAchetes > 0;

  if (m.recrutementVisible && !aRachete && s.formulaires < SEUIL_FORMULAIRES) return FORMULAIRES;
  if (tampons < 8) {
    return { id: 'tamponner', texte: 'Tamponnez les dossiers en attente.', progression: { valeur: tampons, cible: 8 } };
  }
  if (!achetee('renfort')) return NOTE_EN_ATTENTE;
  if (collegues === 0) return { id: 'recruter', texte: 'Recrutez un collègue (onglet Recrutement).', onglet: 'recruitment' };
  if (!aRachete) return FORMULAIRES;
  if (!achetee('rejet')) {
    if (!NOTES_PAR_ID.rejet.visible(s)) {
      return {
        id: 'poursuivre',
        texte: 'Poursuivez : de nouvelles instructions suivront.',
        progression: { valeur: tampons, cible: 250 },
      };
    }
    return NOTE_EN_ATTENTE;
  }
  if (s.tauxRejet <= 0) return { id: 'rejet', texte: 'Réglez le taux de rejet.' };
  if (!achetee('tilleuls')) {
    if (!NOTES_PAR_ID.tilleuls.visible(s)) {
      return { id: 'attendrePerimetre', texte: 'Traitez des dossiers : une extension du périmètre sera proposée.' };
    }
    return { id: 'perimetre', texte: 'Étendez le périmètre (note de service).', onglet: 'notes' };
  }
  return null;
}
