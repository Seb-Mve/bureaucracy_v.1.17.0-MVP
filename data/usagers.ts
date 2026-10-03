/**
 * Identité des usagers affichés dans la file d'attente.
 * Déterministe : un même numéro donne toujours le même usager.
 */
import { PATIENCE_MAX, type GameState } from '../types/game';

const PRENOMS = [
  'Martine', 'Gérard', 'Nadia', 'Kevin', 'Josiane', 'Mamadou', 'Chantal', 'Yannick',
  'Fatima', 'Bernard', 'Léa', 'Thierry', 'Sylvie', 'Rachid', 'Monique', 'Hugo',
  'Brigitte', 'Karim', 'Odette', 'Maël', 'Colette', 'Dylan', 'Aïcha', 'René',
  'Solange', 'Enzo', 'Ginette', 'Samir', 'Huguette', 'Lucas', 'Paulette', 'Inès',
];

const NOMS = [
  'Petit', 'Diallo', 'Martin', 'Lefèvre', 'Nguyen', 'Bernard', 'Moreau', 'Haddad',
  'Garcia', 'Roux', 'Fontaine', 'Benali', 'Mercier', 'Faure', 'Traoré', 'Chevalier',
  'Blanc', 'Guérin', 'Lemoine', 'Kaci', 'Perrin', 'Morel', 'Rolland', 'Dupuis',
];

const DEMANDES = [
  "Renouvellement de carte d’identité",
  'Attestation de domicile',
  'Changement d’adresse',
  'Duplicata de livret de famille',
  'Inscription sur les listes électorales',
  'Demande de place en crèche',
  'Permis de construire un abri de jardin',
  'Attestation de non-attestation',
  'Déclaration de perte de récépissé',
  'Certificat de vie',
  'Demande de rendez-vous pour une demande',
  'Carte grise d’un vélo',
  'Autorisation de fête des voisins',
  'Réclamation au sujet d’une réclamation',
  'Extrait d’acte de naissance',
  'Justificatif de justificatif',
];

const REPLIQUES: Record<number, string[]> = {
  3: ['Bonjour, c’est pour un dossier.', 'J’ai tous les papiers, je crois.', 'Ça ne sera pas long ?'],
  2: ['C’est mon deuxième passage.', 'On m’a dit de revenir…', 'J’ai apporté la pièce manquante.'],
  1: ['Troisième fois. Je ne partirai pas.', 'Je veux voir le responsable.', 'J’ai pris un jour de congé.'],
};

export interface UsagerAffiche {
  numero: number;
  prenom: string;
  nom: string;
  initiales: string;
  demande: string;
  patience: number;
  replique: string;
  couleur: number;
}

/** Hachage entier simple et stable. */
function h(n: number, sel: number): number {
  let x = (n * 2654435761 + sel * 40503) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** Usager correspondant au numéro `numero`, avec une patience donnée. */
export function usager(numero: number, patience: number): UsagerAffiche {
  const prenom = PRENOMS[h(numero, 1) % PRENOMS.length];
  const nom = NOMS[h(numero, 2) % NOMS.length];
  const repliques = REPLIQUES[patience] ?? REPLIQUES[PATIENCE_MAX];
  return {
    numero,
    prenom,
    nom,
    initiales: `${prenom[0]}${nom[0]}`,
    demande: DEMANDES[h(numero, 3) % DEMANDES.length],
    patience,
    replique: repliques[h(numero, 4) % repliques.length],
    couleur: h(numero, 5),
  };
}

/**
 * Les `n` premiers usagers de la file. La patience de chacun est tirée (de façon stable, d'après son
 * numéro) selon la répartition réelle de la file : en moyenne, le guichet voit la file telle qu'elle est.
 * Le premier est l'usager de la bulle, et c'est son dossier que le prochain coup de tampon traite.
 */
export function teteDeFile(s: GameState, n = 3): UsagerAffiche[] {
  const total = s.file[1] + s.file[2] + s.file[3];
  const visibles = Math.min(n, Math.floor(total));
  const res: UsagerAffiche[] = [];
  for (let i = 0; i < visibles; i++) {
    const numero = Math.floor(s.stats.traites) + 1 + i;
    const pos = (h(numero, 6) / 4294967296) * total;
    const patience = pos < s.file[1] ? 1 : pos < s.file[1] + s.file[2] ? 2 : 3;
    res.push(usager(numero, patience));
  }
  return res;
}
