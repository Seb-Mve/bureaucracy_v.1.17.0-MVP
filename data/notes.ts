/**
 * Notes de service de l'acte I : le système de projets du jeu.
 * Chaque note apporte une blague, une mécanique et un indice.
 */
import type { GameState, Modifiers, NoteId } from '../types/game';
import { BALANCE } from '../constants/balance';

export interface NoteDef {
  id: NoteId;
  numero: number;
  titre: string;
  texte: string;
  /** Résumé de l'effet, affiché sous le texte. */
  effet: string;
  cout: number;
  /** Délai d'instruction en secondes réelles (0 = immédiat). */
  instruction: number;
  /** La note apparaît dans la liste quand cette condition est vraie. */
  visible: (s: GameState) => boolean;
  appliquer: (m: Modifiers) => void;
}

const achetee = (s: GameState, id: NoteId): boolean => s.notes[id] !== undefined;

/** Pourcentage de Conformité (0..100), non plafonné pour les conditions. */
export function conformitePct(s: GameState): number {
  return (s.conformitePoints / BALANCE.confCible) * 100;
}

export const NOTES: NoteDef[] = [
  {
    id: 'renfort',
    numero: 1,
    titre: 'Renfort estival',
    texte:
      "Un stagiaire est disponible. Merci de ne pas lui confier de tâches, ni de responsabilités, ni la photocopieuse.",
    effet: "Débloque l’onglet Service.",
    cout: 0,
    instruction: 0,
    visible: (s) => s.tampons >= s.seuilRenfort,
    appliquer: (m) => {
      m.recrutementVisible = true;
      m.agentsDisponibles.push('stagiaire');
    },
  },
  {
    id: 'rejet',
    numero: 2,
    titre: 'Rappel : tout dossier incomplet doit être rejeté',
    texte:
      "Il est rappelé qu’un dossier n’est jamais complet. L’appréciation du caractère incomplet relève de l’agent.",
    effet: 'Débloque le Taux de rejet (jusqu’à 50 %) et l’agent d’accueil. Dossiers rejetés : dotation +20 %.',
    cout: 0,
    instruction: 0,
    visible: (s) => s.tampons >= 250,
    appliquer: (m) => {
      m.rejetVisible = true;
      m.rejetMax = Math.max(m.rejetMax, 0.5);
      m.primeRejet += 0.2;
      m.agentsDisponibles.push('accueil');
    },
  },
  {
    id: 'horaires',
    numero: 3,
    titre: "Élargissement des horaires d’ouverture",
    texte: 'Le guichet ouvrira désormais à 8 h 58 au lieu de 9 h 00. Les usagers sont priés de ne pas en abuser.',
    effet: 'Demandes des usagers +50 %.',
    cout: 300,
    instruction: 0,
    visible: (s) => s.tampons >= 300,
    appliquer: (m) => {
      m.demandeMult *= 1.5;
    },
  },
  {
    id: 'ramettes',
    numero: 4,
    titre: "Commande groupée de formulaires",
    texte: "Les formulaires seront désormais commandés par lot. Le formulaire de commande groupée est disponible à l’unité.",
    effet: 'Prix des ramettes −25 %.',
    cout: 160,
    instruction: 0,
    visible: (s) => s.stats.formulairesAchetes >= 600,
    appliquer: (m) => {
      m.prixFormulaireMult *= 0.75;
    },
  },
  {
    id: 'dateur',
    numero: 5,
    titre: 'Tampon dateur automatique',
    texte: "Le tampon indique désormais la date. Elle n’engage personne.",
    effet: 'Chaque tap traite 2 dossiers.',
    cout: 500,
    instruction: 0,
    visible: (s) => s.tampons >= 500,
    appliquer: (m) => {
      m.tapPower = Math.max(m.tapPower, 2);
    },
  },
  {
    id: 'prime',
    numero: 6,
    titre: 'Prime de vigilance',
    texte:
      "Afin de valoriser la rigueur des agents, chaque dossier rejeté ouvrira droit à une dotation complémentaire. Un dossier rejeté est un dossier traité deux fois.",
    effet: 'Dossiers rejetés : dotation +50 %.',
    cout: 800,
    instruction: 0,
    visible: (s) => s.stats.rejetes >= 200,
    appliquer: (m) => {
      m.primeRejet += 0.5;
    },
  },
  {
    id: 'tilleuls',
    numero: 7,
    titre: 'Extension du périmètre : quartier des Tilleuls',
    texte: "Le guichet 3 est désormais compétent pour le quartier des Tilleuls. Les Tilleuls n’ont pas été consultés.",
    effet: 'Périmètre +1 000 usagers.',
    cout: 900,
    instruction: 90,
    visible: (s) => s.tampons >= 1500,
    appliquer: () => undefined,
  },
  {
    id: 'numerotation',
    numero: 8,
    titre: 'Numérotation des usagers',
    texte:
      "Par souci d’égalité de traitement, les usagers seront désormais désignés par un numéro. Les prénoms seront archivés.",
    effet: 'Vitesse des collègues +25 %. Les usagers perdent leur nom.',
    cout: 3000,
    instruction: 60,
    visible: (s) => s.tampons >= 3000,
    appliquer: (m) => {
      m.agentSpeedMult *= 1.25;
      m.numerotation = true;
    },
  },
  {
    id: 'piece',
    numero: 9,
    titre: 'Pièce justificative supplémentaire',
    texte: 'Toute demande devra être accompagnée d’un justificatif attestant de la demande.',
    effet: '+1 formulaire par dossier. Dotation ×1,6. La procédure s’alourdit.',
    cout: 1600,
    instruction: 0,
    visible: (s) => s.tampons >= 2000,
    appliquer: (m) => {
      m.pieces += 1;
      m.dotationMult *= 1.6;
    },
  },
  {
    id: 'instructeur',
    numero: 10,
    titre: "Création d’un poste d’agent instructeur",
    texte: "Un poste d’agent instructeur est créé. Sa fiche de poste est en cours d’instruction.",
    effet: 'Débloque l’agent instructeur.',
    cout: 2000,
    instruction: 0,
    visible: (s) => s.tampons >= 3000,
    appliquer: (m) => {
      m.agentsDisponibles.push('instructeur');
    },
  },
  {
    id: 'doubleEncrage',
    numero: 11,
    titre: 'Tampon à double encrage',
    texte: "Deux encres, un seul geste. L’agent est prié de ne pas tamponner ses collègues.",
    effet: 'Chaque tap traite 5 dossiers.',
    cout: 2400,
    instruction: 0,
    visible: (s) => achetee(s, 'dateur') && s.tampons >= 5000,
    appliquer: (m) => {
      m.tapPower = Math.max(m.tapPower, 5);
    },
  },
  {
    id: 'plafond',
    numero: 12,
    titre: 'Relèvement du plafond de rejet',
    texte: "Le plafond de rejet de 50 % est jugé excessivement bas. Il est relevé à titre expérimental et définitif.",
    effet: 'Taux de rejet jusqu’à 80 %.',
    cout: 3000,
    instruction: 0,
    visible: (s) => achetee(s, 'prime') && s.stats.rejetes >= 1500,
    appliquer: (m) => {
      m.rejetMax = Math.max(m.rejetMax, 0.8);
    },
  },
  {
    id: 'retour48h',
    numero: 13,
    titre: 'Délai de retour réglementaire',
    texte: 'Les usagers rejetés sont invités à revenir sous 48 heures, faute de quoi leur demande sera rejetée.',
    effet: 'Les usagers rejetés reviennent deux fois plus vite.',
    cout: 4000,
    instruction: 0,
    visible: (s) => s.stats.rejetes >= 2500,
    appliquer: (m) => {
      m.delaiRetourMult *= 0.5;
    },
  },
  {
    id: 'commandeAuto',
    numero: 14,
    titre: "Commande automatique de formulaires",
    texte: "Les formulaires seront commandés automatiquement, sur présentation d’un formulaire.",
    effet: 'Les ramettes sont rachetées automatiquement quand le stock baisse.',
    cout: 5000,
    instruction: 0,
    visible: (s) => s.tampons >= 6000,
    appliquer: (m) => {
      m.commandeAuto = true;
    },
  },
  {
    id: 'commune',
    numero: 15,
    titre: 'Extension du périmètre : la commune entière',
    texte: "Le guichet 3 devient le guichet de la commune. Les guichets 1 et 2 n’ont jamais existé.",
    effet: 'Périmètre +3 500 usagers.',
    cout: 5000,
    instruction: 180,
    visible: (s) => achetee(s, 'tilleuls') && s.tampons >= 8000,
    appliquer: () => undefined,
  },
  {
    id: 'audit',
    numero: 16,
    titre: 'Audit interne du S.I.C.',
    texte:
      "Le Service Inconnu de Coordination procédera à un audit de votre conformité. Vous n’avez rien à préparer. Tout a déjà été préparé.",
    effet: 'Révèle votre niveau de Conformité.',
    cout: 0,
    instruction: 180,
    visible: (s) => achetee(s, 'piece') && s.tampons >= 12000,
    appliquer: (m) => {
      m.conformiteVisible = true;
    },
  },
  {
    id: 'formDemande',
    numero: 17,
    titre: 'Formulaire de demande de formulaire',
    texte: 'Tout formulaire devra désormais faire l’objet d’une demande, sur formulaire.',
    effet: '+1 formulaire par dossier. Dotation ×1,5. Conformité des pièces ×2.',
    cout: 60000,
    instruction: 0,
    visible: (s) => achetee(s, 'audit'),
    appliquer: (m) => {
      m.pieces += 1;
      m.dotationMult *= 1.5;
      m.confPieceMult *= 2;
    },
  },
  {
    id: 'titularisation',
    numero: 18,
    titre: 'Titularisation des agents',
    texte: 'Les agents sont titularisés. Ils ne peuvent plus être déplacés, ni motivés.',
    effet: 'Vitesse des collègues ×2.',
    cout: 120000,
    instruction: 0,
    visible: (s) => s.tampons >= 25000,
    appliquer: (m) => {
      m.agentSpeedMult *= 2;
    },
  },
  {
    id: 'titulaire',
    numero: 19,
    titre: "Création d’un poste de titulaire",
    texte: 'Un poste de titulaire est ouvert. Il sera pourvu par un titulaire.',
    effet: 'Débloque le titulaire.',
    cout: 150000,
    instruction: 0,
    visible: (s) => achetee(s, 'titularisation'),
    appliquer: (m) => {
      m.agentsDisponibles.push('titulaire');
    },
  },
  {
    id: 'canton',
    numero: 20,
    titre: 'Extension du périmètre : le canton',
    texte: 'Le guichet 3 est étendu au canton. Le canton est prié de se présenter au guichet 3.',
    effet: 'Périmètre +12 000 usagers.',
    cout: 40000,
    instruction: 300,
    visible: (s) => achetee(s, 'commune') && s.tampons >= 40000,
    appliquer: () => undefined,
  },
  {
    id: 'guichetUnique',
    numero: 21,
    titre: 'Guichet unique',
    texte: 'Un guichet unique est créé pour simplifier les démarches. Il renvoie vers les autres guichets.',
    effet: 'Conformité des rejets ×2.',
    cout: 200000,
    instruction: 0,
    visible: (s) => achetee(s, 'audit') && s.tampons >= 60000,
    appliquer: (m) => {
      m.confRejetMult *= 2;
    },
  },
  {
    id: 'reaffectation',
    numero: 22,
    titre: 'Demande de réaffectation',
    texte:
      'Votre niveau de conformité a été jugé satisfaisant. Une réaffectation de niveau supérieur pourrait être envisagée…',
    effet: "Réaffectation à un poste de niveau supérieur.",
    cout: 0,
    instruction: 0,
    visible: (s) => achetee(s, 'audit') && conformitePct(s) >= 100,
    appliquer: () => undefined,
  },
];

/** Capacité ajoutée au périmètre par les notes d'extension. */
export const EXTENSIONS_PERIMETRE: Partial<Record<NoteId, number>> = {
  tilleuls: 1000,
  commune: 3500,
  canton: 12000,
};

export const NOTES_PAR_ID: Record<NoteId, NoteDef> = Object.fromEntries(
  NOTES.map((n) => [n.id, n]),
) as Record<NoteId, NoteDef>;
