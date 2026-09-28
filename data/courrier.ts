/**
 * Courrier du S.I.C. (Service Inconnu de Coordination) pour l'acte I.
 * Une lettre part une seule fois, quand son déclencheur devient vrai.
 */
import type { GameState, Lettre, LettreId, NoteId } from '../types/game';
import { conformite, noteEffective } from './engine';
import { NOTES_PAR_ID } from './notes';

interface LettreDef {
  id: LettreId;
  objet: string;
  corps: (s: GameState) => string;
  declencheur: (s: GameState, maintenant: number) => boolean;
}

const nom = (s: GameState): string => s.cerfa.prenom || 'Agent sans prénom';

/** Dernière note achetée, citée comme « pièce manquante » à la démission. */
function dernierePiece(s: GameState): string {
  let derniere: NoteId | null = null;
  let t = -1;
  for (const [id, n] of Object.entries(s.notes)) {
    if (n && n.achetee > t && id !== 'reaffectation') {
      t = n.achetee;
      derniere = id as NoteId;
    }
  }
  if (!derniere) return 'l’original de votre demande';
  const def = NOTES_PAR_ID[derniere];
  return `justificatif de conformité à la note de service n° ${def.numero} (« ${def.titre} »)`;
}

const minutes = (m: number) => m * 60 * 1000;

const LETTRES: LettreDef[] = [
  {
    id: 'bienvenue',
    objet: 'Prise de poste',
    corps: (s) =>
      `${nom(s)},\n\nLe S.I.C. accuse réception de votre prise de poste au guichet 3.\n\nIl n’y a pas lieu d’y donner suite.`,
    declencheur: (s) => s.stats.traites >= 5,
  },
  {
    id: 'premierRejet',
    objet: 'Rigueur',
    corps: () =>
      'Le S.I.C. a relevé votre premier rejet.\n\nVotre rigueur est notée. Elle n’est pas encore appréciée.',
    declencheur: (s) => s.stats.rejetes >= 1,
  },
  {
    id: 'fidelite',
    objet: 'Fidélisation des usagers',
    corps: () =>
      'Le taux de retour de vos usagers est remarquable.\n\nLe S.I.C. vous rappelle qu’un usager qui revient est un usager fidèle.',
    declencheur: (s) => s.stats.rejetes >= 300,
  },
  {
    id: 'numerotation',
    objet: 'Égalité de traitement',
    corps: () =>
      'Les usagers portent désormais un numéro.\n\nLe S.I.C. salue cette avancée décisive vers l’égalité de traitement. Les prénoms ont été archivés dans un lieu sûr.',
    declencheur: (s, t) => noteEffective(s, 'numerotation', t),
  },
  {
    id: 'abandons',
    objet: 'Démarches non abouties',
    corps: () =>
      'Plusieurs démarches ont été abandonnées par leurs auteurs.\n\nCeci n’est pas une information.',
    declencheur: (s) => s.abandons >= 150,
  },
  {
    id: 'audit',
    objet: 'Résultat de l’audit',
    corps: (s) =>
      `Le S.I.C. porte à votre connaissance votre niveau de conformité : ${Math.floor(conformite(s))} %.\n\nIl l’a toujours connu.`,
    declencheur: (s, t) => noteEffective(s, 'audit', t),
  },
  {
    id: 'conf50',
    objet: 'Mi-parcours',
    corps: () => 'Votre conformité atteint 50 %.\n\nLa moitié du chemin n’existe pas. Poursuivez.',
    declencheur: (s, t) => noteEffective(s, 'audit', t) && conformite(s) >= 50,
  },
  {
    id: 'demission1',
    objet: 'Votre demande n° 000001',
    corps: (s) =>
      `Votre demande de démission (n° 000001) a bien été reçue.\n\nElle est incomplète.\n\nPièce manquante : ${dernierePiece(s)}.`,
    declencheur: (s, t) => s.demission.deposeeLe !== null && t - s.demission.deposeeLe >= minutes(3),
  },
  {
    id: 'demission2',
    objet: 'Relance — demande n° 000001',
    corps: (s) =>
      `Votre demande de démission demeure incomplète.\n\nPièce manquante : ${dernierePiece(s)}.\n\nLe S.I.C. vous remercie de votre patience, qui n’est pas illimitée.`,
    declencheur: (s, t) => s.demission.deposeeLe !== null && t - s.demission.deposeeLe >= minutes(30),
  },
  {
    id: 'reaffectation',
    objet: 'Réaffectation',
    corps: (s) =>
      `${nom(s)},\n\nVotre niveau de conformité a été jugé satisfaisant.\n\nUne réaffectation de niveau supérieur pourrait être envisagée. Le guichet 3 sera archivé.`,
    declencheur: (s) => s.acteTermine,
  },
];

/** Lettres dont le déclencheur vient de devenir vrai. */
export function nouvellesLettres(s: GameState, maintenant: number): Lettre[] {
  return LETTRES.filter((l) => !s.lettresEnvoyees.includes(l.id) && l.declencheur(s, maintenant)).map(
    (l) => ({ id: l.id, objet: l.objet, corps: l.corps(s), recue: maintenant, lue: false }),
  );
}

/** Lettre de résumé après une absence. */
export function lettreAbsence(
  secondes: number,
  traites: number,
  budget: number,
  maintenant: number,
  format: (n: number) => string,
): Lettre {
  const duree =
    secondes >= 3600
      ? `${Math.floor(secondes / 3600)} h ${Math.floor((secondes % 3600) / 60)} min`
      : `${Math.max(1, Math.floor(secondes / 60))} min`;
  return {
    id: `absence-${maintenant}`,
    objet: 'Pendant votre absence',
    corps: `Pendant votre absence (${duree}), le guichet 3 a traité ${format(traites)} dossiers et perçu ${format(budget)} € de dotation.\n\nVotre présence n’a pas été jugée nécessaire.`,
    recue: maintenant,
    lue: false,
  };
}
