/**
 * Courrier du S.I.C. pour l'acte II — La Direction.
 * Les lettres passent par `nouvellesLettres` (data/courrier.ts), une seule fois chacune.
 */
import type { GameState, Lettre } from '../../types/game';
import type { EtatActe2 } from '../../types/acte2';
import type { LettreDef } from '../courrier';
import { BALANCE2 } from '../../constants/balanceActe2';
import { formatEntier, formatMontant } from '../../utils/formatters';
import { dematPct } from './notes2';

const nom = (s: GameState): string => s.cerfa.prenom || 'Agent sans prénom';
const minutes = (m: number) => m * 60 * 1000;

/** Vrai si `n` délais de filet se sont écoulés depuis la note n° 7, sans aucune boucle. */
function filet(x: EtatActe2 | null, maintenant: number, n: number): boolean {
  const note = x?.notes.pieceService;
  return (
    x !== null &&
    note !== undefined &&
    x.premiereBoucle === null &&
    maintenant - note.effective >= minutes(BALANCE2.filetMinutes * n)
  );
}

export const LETTRES_ACTE2: LettreDef[] = [
  {
    id: 'a2-prise',
    objet: 'Prise de fonctions',
    corps: (s) =>
      `${nom(s)},\n\nVous êtes nommé·e chef de service.\n\nLe budget non consommé de l’exercice précédent a été restitué au Trésor. Le guichet 3 vous est confié à titre d’unité.`,
    declencheur: (s) => s.acte2 !== null,
  },
  {
    id: 'a2-boucle',
    objet: 'Optimisation de vos circuits',
    corps: () =>
      'Le S.I.C. vous félicite pour l’optimisation de vos circuits.\n\nVos procédures se sollicitent désormais mutuellement. L’usager n’est plus indispensable à leur bon fonctionnement. Il n’en a pas été informé.',
    declencheur: (s) => s.acte2 !== null && s.acte2.premiereBoucle !== null,
  },
  {
    id: 'a2-filet1',
    objet: 'Constat de non-sollicitation',
    corps: () =>
      'Nos services constatent que vos procédures ne se sollicitent pas mutuellement.\n\nCette situation est regrettable.',
    declencheur: (s, t) => filet(s.acte2, t, 1),
  },
  {
    id: 'a2-filet2',
    objet: 'Constat de non-sollicitation (relance)',
    corps: (s) => {
      const noms = s.reformes.denomination.procedures;
      return `La procédure « ${noms.identite} » pourrait exiger une pièce délivrée par la procédure « ${noms.domicile} ». L’inverse serait également fondé.\n\nLe S.I.C. ne donne pas d’instruction. Il constate.`;
    },
    declencheur: (s, t) => filet(s.acte2, t, 2),
  },
  {
    id: 'a2-demission',
    objet: 'Votre demande n° 000001',
    corps: (s) => {
      const p = s.acte2?.premiereModif ?? 'identite';
      return `Votre demande de démission demeure incomplète.\n\nPièce manquante : justificatif de conformité à la procédure « ${s.reformes.denomination.procedures[p]} ».`;
    },
    declencheur: (s) =>
      s.demission.deposeeLe !== null &&
      s.acte2 !== null &&
      s.acte2.premiereModif !== null,
  },
  {
    id: 'a2-rapport',
    objet: 'Rapport annuel de performance',
    corps: (s) =>
      `Taux de satisfaction : 100 % (sur les usagers restants).\n\nAbandons de démarche : ${formatEntier(s.acte2?.stats.abandonsDemarche ?? 0)}.\n\nLe S.I.C. salue un service qui n’a plus besoin de personne.`,
    declencheur: (s) => s.acte2 !== null && dematPct(s.acte2) >= 100,
  },
];

/** Durée d'une absence, en heures et minutes. */
function dureeAbsence(secondes: number): string {
  return secondes >= 3600
    ? `${Math.floor(secondes / 3600)} h ${Math.floor((secondes % 3600) / 60)} min`
    : `${Math.max(1, Math.floor(secondes / 60))} min`;
}

/** Lettre de résumé après une absence à l'acte II (Guichets et agents seuls, sans rejet). */
export function lettreAbsence2(
  secondes: number,
  franchies: number,
  budget: number,
  maintenant: number,
): Lettre {
  return {
    id: `absence-${maintenant}`,
    objet: 'Pendant votre absence',
    corps: `Pendant votre absence (${dureeAbsence(secondes)}), vos services ont franchi ${formatEntier(franchies)} étapes et perçu ${formatMontant(budget)} de dotation.\n\nAucun dossier n’a été rejeté : la rigueur ne se délègue pas.\n\nVos procédures ont suivi leur cours.`,
    recue: maintenant,
    lue: false,
  };
}
