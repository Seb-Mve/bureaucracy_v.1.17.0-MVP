import { BALANCE } from '@/constants/balance';
import { formatMontant } from '@/utils/formatters';
import type { VueDirection } from '@/context/GameStateContext';

export interface Article {
  titre: string;
  texte: string;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Règlement intérieur du service (acte II) : un article par mécanique débloquée.
 * Aucun article ne nomme la boucle : le joueur la construit lui-même.
 */
export function articlesDirection(
  d: VueDirection,
  avecNotes: boolean,
  prixRamette: number,
): Article[] {
  const articles: Article[] = [
    {
      titre: 'Le visa',
      texte: `Chaque coup de tampon vise une demande en attente. Le nombre de tampons apposés fixe votre grade : chaque grade ajoute ${pct(BALANCE.bonusGrade)} de dotation.`,
    },
    {
      titre: 'Budget et formulaires',
      texte: `Chaque étape franchie rapporte une dotation et consomme un formulaire par exemplaire exigé. Sans formulaires, plus aucune étape n’est franchie.${
        d.recrutementVisible
          ? ` Les ramettes s’achètent dans l’onglet Service (${formatMontant(prixRamette)} l’une).`
          : ''
      }`,
    },
    {
      titre: 'Les procédures',
      texte:
        'Une demande franchit les étapes de sa procédure dans l’ordre. Les guichets franchissent toutes les étapes, sauf les visas.',
    },
  ];
  if (d.recrutementVisible) {
    articles.push({
      titre: 'Guichets et agents',
      texte: `Le prix monte à chaque achat. Les agents accordent les visas à votre place ; la vitesse d’un poste double à ${BALANCE.paliersAnciennete.join(', ')} recrues (ancienneté).`,
    });
  }
  if (avecNotes) {
    articles.push({
      titre: 'Notes de service',
      texte:
        'Une note approuvée prend effet aussitôt, ou au terme de son délai d’instruction quand elle en a un.',
    });
  }
  articles.push({
    titre: 'Taux de rejet',
    texte:
      'Une demande rejetée en fin de procédure rapporte une prime et repart en tête de sa procédure. Le rejet n’use que la patience des usagers.',
  });
  if (d.atelierVisible) {
    articles.push({
      titre: 'Atelier des procédures',
      texte:
        'Le chef de service complète les procédures : ajouter, retirer ou déplacer une étape. Une modification s’applique aussitôt aux demandes en cours.',
    });
  }
  if (d.exemplairesVisible) {
    articles.push({
      titre: 'Exemplaires exigés',
      texte:
        'Chaque étape exige un, deux ou trois exemplaires : plus de dotation, plus de formulaires, moins de patience.',
    });
  }
  if (d.achatsVisible) {
    articles.push({
      titre: 'Service des achats',
      texte:
        'En service, il commande des ramettes sur le budget dès que le stock ne couvre plus trente secondes de travail, y compris en votre absence. Il se suspend depuis l’onglet Service.',
    });
  }
  if (d.reformeVisible) {
    articles.push({
      titre: 'La Réforme',
      texte:
        'Une réforme réorganise l’ensemble des services sans en modifier le fonctionnement. Elle reprend au guichet 3 ; les tampons apposés, les trombones et la Jurisprudence sont conservés.',
    });
  }
  if (d.demat !== null) {
    articles.push({
      titre: 'Dématérialisation',
      texte:
        'Le taux publié par le S.I.C. mesure la part de l’activité du service qui se passe d’usager.',
    });
  }
  return articles;
}
