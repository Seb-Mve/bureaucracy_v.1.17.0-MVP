/**
 * Ordre du jour : une consigne à la fois, des premières minutes jusqu'à la fin de l'acte.
 * La première consigne non remplie s'affiche ; null quand il n'y a plus rien à viser.
 */
import type { GameState, Modifiers } from '../types/game';
import { NOTES, NOTES_PAR_ID, conformitePct } from './notes';

/** Paliers de tampons où des notes de service apparaissent (sondés dans l'ordre). */
const PALIERS_TAMPONS = [8, 250, 300, 500, 1500, 2000, 3000, 5000, 6000, 8000, 12000, 25000, 40000, 60000];

/** Prochain palier de tampons qui fera apparaître une note de service, ou null. */
export function prochainPalierNote(s: GameState): number | null {
  const cachees = NOTES.filter((n) => s.notes[n.id] === undefined && !n.visible(s));
  return PALIERS_TAMPONS.find((t) => t > s.tampons && cachees.some((n) => n.visible({ ...s, tampons: t }))) ?? null;
}

export type Onglet = 'recruitment' | 'notes';

export interface Consigne {
  id: string;
  texte: string;
  progression?: { valeur: number; cible: number };
  /** Onglet ouvert par un tap sur le bandeau. */
  onglet?: Onglet;
}

/** En dessous de ce stock, racheter des formulaires passe en priorité. */
export const SEUIL_FORMULAIRES = 20;

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

  // Fin de l'acte à portée : rien ne passe devant.
  if (!achetee('reaffectation') && NOTES_PAR_ID.reaffectation.visible(s)) {
    return { id: 'fin', texte: 'Conformité à 100 % : visez la note n° 22 pour clore l’acte.', onglet: 'notes' };
  }
  if (s.formulaires < m.pieces) {
    return m.recrutementVisible
      ? { id: 'rupture', texte: 'Rupture : achetez une ramette de formulaires.', onglet: 'recruitment' }
      : { id: 'rupture', texte: 'Rupture : visez la note n° 1 (commande de formulaires).', onglet: 'notes' };
  }
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
  // Ensuite : la note qui attend, la Conformité une fois révélée, sinon le prochain palier de notes.
  if (NOTES.some((n) => s.notes[n.id] === undefined && n.visible(s))) return NOTE_EN_ATTENTE;
  if (m.conformiteVisible) {
    return {
      id: 'conformite',
      texte: 'Faites monter la Conformité : à 100 %, la note n° 22 clôt l’acte.',
      progression: { valeur: Math.floor(Math.min(100, conformitePct(s))), cible: 100 },
    };
  }
  const palier = prochainPalierNote(s);
  if (palier !== null) {
    return { id: 'prochaineNote', texte: 'Tamponnez : une nouvelle note de service suivra.', progression: { valeur: tampons, cible: palier } };
  }
  return null;
}
