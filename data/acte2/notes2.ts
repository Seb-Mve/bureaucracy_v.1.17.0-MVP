/**
 * Notes de service de l'acte II — La Direction.
 * Chaque note apporte une blague, une mécanique et un indice (comme à l'acte I).
 */
import type { GameState } from '../../types/game';
import type { EtatActe2, Modifiers2, Note2Id } from '../../types/acte2';
import { BALANCE2 } from '../../constants/balanceActe2';

export interface NoteDef2 {
  id: Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  /** Délai d'instruction en secondes réelles (0 = immédiat). */
  instruction: number;
  visible: (s: GameState) => boolean;
  appliquer: (m: Modifiers2) => void;
}

/** Pourcentage de dématérialisation (0..∞), non plafonné pour les conditions. */
export function dematPct(x: EtatActe2): number {
  return (x.demaPoints / BALANCE2.demaCible) * 100;
}

const achetee = (x: EtatActe2, id: Note2Id): boolean => x.notes[id] !== undefined;

/** Condition de visibilité évaluée sur l'état de l'acte II (fausse hors de l'acte II). */
const si =
  (f: (x: EtatActe2) => boolean) =>
  (s: GameState): boolean =>
    s.acte2 !== null && f(s.acte2);

export const NOTES2: NoteDef2[] = [
  {
    id: 'prise',
    numero: 1,
    titre: 'Réouverture du guichet 3',
    texte: 'Les pièces justificatives seront désormais vérifiées au guichet. Le guichet 3 rouvre, sous votre autorité.',
    effet: 'Débloque le recrutement des guichets.',
    cout: 0,
    instruction: 0,
    // Plus rien à viser et des demandes attendent la vérification des pièces (specs/012) ; aussitôt avec des
    // guichets offerts (Antériorité), qui vérifient déjà les pièces.
    visible: si((x) => x.reouvertureVisible || x.guichets > 0),
    appliquer: (m) => {
      m.recrutementVisible = true;
    },
  },
  {
    id: 'agents',
    numero: 2,
    titre: 'Agents d’instruction',
    texte: 'Les visas ne s’accordent pas tout seuls. Des agents ont été formés pour les accorder tout seuls.',
    effet: 'Débloque l’Instructeur.',
    cout: 200,
    instruction: 30,
    visible: si((x) => x.guichets >= 5),
    appliquer: (m) => {
      m.agentsDisponibles.push('instructeur');
    },
  },
  {
    id: 'atelier',
    numero: 3,
    titre: 'Atelier des procédures',
    texte: 'Le chef de service est autorisé à compléter les procédures. Il n’est pas autorisé à les simplifier.',
    effet: 'Débloque l’Atelier, la procédure Justificatif de domicile et l’étape Pièce justificative.',
    cout: 1000,
    instruction: 120,
    visible: si((x) => x.stats.franchies >= 3000),
    appliquer: (m) => {
      m.atelierVisible = true;
      m.procsOuvertes.push('domicile');
      m.etapesDisponibles.push('piece');
    },
  },
  {
    id: 'signature',
    numero: 4,
    titre: 'Signature manuscrite',
    texte: 'Toute pièce doit être signée. Toute signature doit être lisible. Aucune signature n’est lisible.',
    effet: 'Débloque l’étape Signature.',
    cout: 1500,
    instruction: 60,
    visible: si((x) => achetee(x, 'atelier')),
    appliquer: (m) => {
      m.etapesDisponibles.push('signature');
    },
  },
  {
    id: 'exemplaires',
    numero: 5,
    titre: 'Exemplaires exigés',
    texte: 'Par mesure de sécurité, toute pièce est exigée en plusieurs exemplaires. Les exemplaires sont détruits après vérification.',
    effet: 'Débloque le curseur Exemplaires exigés.',
    cout: 2500,
    instruction: 120,
    visible: si((x) => achetee(x, 'atelier') && x.stats.franchies >= 8000),
    appliquer: (m) => {
      m.exemplairesVisible = true;
    },
  },
  {
    id: 'achats',
    numero: 6,
    titre: 'Marché public de fournitures',
    texte: 'Un marché public de fournitures a été attribué au service des achats. Les ramettes seront commandées au prix du marché, qui est celui du marché.',
    effet: 'Débloque le Service des achats : les ramettes sont commandées sur le budget quand le stock baisse.',
    cout: 3000,
    instruction: 120,
    visible: si((x) => achetee(x, 'exemplaires') && x.stats.franchies >= 18000),
    appliquer: (m) => {
      m.achatsVisible = true;
    },
  },
  {
    id: 'chefBureau',
    numero: 7,
    titre: 'Chef de bureau',
    texte: 'Un chef de bureau vise ce que l’instructeur a visé, pour le cas où.',
    effet: 'Débloque le Chef de bureau.',
    cout: 5000,
    instruction: 120,
    visible: si((x) => x.agents.instructeur >= 10),
    appliquer: (m) => {
      m.agentsDisponibles.push('chefBureau');
    },
  },
  {
    id: 'pieceService',
    numero: 8,
    titre: 'Pièce délivrée par nos services',
    texte: 'Rappel : un justificatif délivré par nos services fait foi pour toute démarche, y compris celle qui l’a délivré.',
    effet: 'Débloque l’étape Pièce délivrée par nos services.',
    cout: 6000,
    instruction: 240,
    visible: si((x) => achetee(x, 'signature') && x.stats.franchies >= 25000),
    appliquer: (m) => {
      m.etapesDisponibles.push('pieceService');
    },
  },
  {
    id: 'reflexion',
    numero: 9,
    titre: 'Délai de réflexion',
    texte: 'Un délai de réflexion protège l’usager contre toute décision hâtive, y compris la sienne.',
    effet: 'Débloque l’étape Délai de réflexion.',
    cout: 20000,
    instruction: 180,
    visible: si((x) => achetee(x, 'pieceService')),
    appliquer: (m) => {
      m.etapesDisponibles.push('reflexion');
    },
  },
  {
    id: 'troisieme',
    numero: 10,
    titre: 'Troisième guichet thématique',
    texte: 'Une démarche est créée pour attester que l’usager est hébergé. Par lui-même, le cas échéant.',
    effet: 'Ouvre la procédure Attestation d’hébergement.',
    cout: 30000,
    instruction: 240,
    visible: si((x) => achetee(x, 'pieceService')),
    appliquer: (m) => {
      m.procsOuvertes.push('hebergement');
    },
  },
  {
    id: 'reforme',
    numero: 11,
    titre: 'Réforme de l’action publique',
    texte: 'Une réforme peut être engagée à tout moment. Elle réorganisera l’ensemble des services sans en modifier le fonctionnement.',
    effet: 'Débloque la Réforme (Options).',
    cout: 0,
    instruction: 0,
    visible: si((x) => x.premiereBoucle !== null),
    appliquer: (m) => {
      m.reformeVisible = true;
    },
  },
  {
    id: 'demat',
    numero: 12,
    titre: 'Plan de dématérialisation',
    texte: 'Le S.I.C. engage la dématérialisation des démarches. Une démarche dématérialisée ne nécessite plus d’usager. Votre taux de dématérialisation sera désormais publié.',
    effet: 'Révèle le Taux de dématérialisation.',
    cout: 12000,
    instruction: 300,
    visible: si((x) => x.premiereBoucle !== null && x.stats.franchiesBoucle >= 5000),
    appliquer: (m) => {
      m.dematVisible = true;
    },
  },
  {
    id: 'rejetElargi',
    numero: 13,
    titre: 'Rejet élargi',
    texte: 'Le taux de rejet maximal est relevé. Il ne s’applique, rappelons-le, qu’aux dossiers incomplets, c’est-à-dire à tous.',
    effet: 'Taux de rejet jusqu’à 80 %.',
    cout: 25000,
    instruction: 180,
    visible: si((x) => achetee(x, 'demat')),
    appliquer: (m) => {
      m.rejetMax = Math.max(m.rejetMax, 0.8);
    },
  },
  {
    id: 'commission',
    numero: 14,
    titre: 'Commission ad hoc',
    texte: 'Une commission examinera les dossiers dès que son règlement intérieur aura été examiné par une commission.',
    effet: 'Débloque l’étape Commission.',
    cout: 40000,
    instruction: 300,
    visible: si((x) => achetee(x, 'demat')),
    appliquer: (m) => {
      m.etapesDisponibles.push('commission');
    },
  },
  {
    id: 'sousDirecteur',
    numero: 15,
    titre: 'Sous-directeur',
    texte: 'Le sous-directeur ne vise rien lui-même. Il délègue, ce qui va beaucoup plus vite.',
    effet: 'Débloque le Sous-directeur.',
    cout: 60000,
    instruction: 300,
    visible: si((x) => x.agents.chefBureau >= 10),
    appliquer: (m) => {
      m.agentsDisponibles.push('sousDirecteur');
    },
  },
  {
    id: 'quatrieme',
    numero: 16,
    titre: 'Quatrième guichet thématique',
    texte: 'Pour toute démarche, l’usager doit désormais prouver qu’il est en vie. La preuve est valable trois mois, sauf décès.',
    effet: 'Ouvre la procédure Certificat de vie.',
    cout: 90000,
    instruction: 480,
    visible: si((x) => achetee(x, 'commission')),
    appliquer: (m) => {
      m.procsOuvertes.push('vie');
    },
  },
  {
    id: 'tableau',
    numero: 17,
    titre: 'Tableau de bord',
    texte: 'Un tableau de bord est mis à votre disposition. Il mesure ce qui a été jugé mesurable.',
    effet: 'Affiche les abandons de démarche et le taux de satisfaction.',
    cout: 0,
    instruction: 0,
    visible: si((x) => dematPct(x) >= 25),
    appliquer: (m) => {
      m.tableauVisible = true;
    },
  },
  {
    id: 'promotion',
    numero: 18,
    titre: 'Promotion',
    texte: 'Vos résultats ont été jugés exemplaires. Votre service sera rattaché au ministère. Vous aussi.',
    effet: 'Termine l’acte II.',
    cout: 0,
    instruction: 0,
    visible: si((x) => dematPct(x) >= 100),
    appliquer: () => undefined,
  },
];

export const NOTES2_PAR_ID: Record<Note2Id, NoteDef2> = Object.fromEntries(
  NOTES2.map((n) => [n.id, n]),
) as Record<Note2Id, NoteDef2>;
