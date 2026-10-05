/**
 * Production du service (acte II, specs/011) : ce que chaque procédure délivre, à qui, et ce que rapporte un
 * document. Relevé de l'écran Direction et de l'Atelier. Fonctions pures. Rien ici ne nomme la boucle : un
 * document délivré pour un dossier du service n'a simplement pas de destination.
 */
import type { GameState } from '../../types/game';
import {
  PROCS,
  type EtatActe2,
  type Modifiers2,
  type ProcId,
} from '../../types/acte2';
import {
  BALANCE2,
  ETAPES,
  EXEMPLAIRES,
  PROCS_DEMANDEES,
} from '../../constants/balanceActe2';
import { formatEntier, formatEuros } from '../../utils/formatters';
import { getModifiers2 } from './moteur';
import { procedureAboutit } from './procedures';
import type { EffetAffiche } from './vueAtelier';

/** Le document d'une procédure : son nom court avec article (« la carte ») et son genre (accords). */
export interface Document {
  article: string;
  feminin: boolean;
}

/** Tous les noms que peut prendre une procédure (PROC_NOMS, puis NOMS_PROCEDURES après une Réforme). */
const DOCUMENTS: Record<string, Document> = {
  'Carte d’identité': { article: 'la carte', feminin: true },
  'Démarche d’identification citoyenne': {
    article: 'la démarche',
    feminin: true,
  },
  'Parcours d’attestation d’identité': {
    article: 'le parcours',
    feminin: false,
  },
  'Titre d’identité simplifié': { article: 'le titre', feminin: false },
  'Justificatif de domicile': { article: 'le justificatif', feminin: false },
  'Attestation de résidence effective': {
    article: 'l’attestation',
    feminin: true,
  },
  'Parcours de domiciliation': { article: 'le parcours', feminin: false },
  'Certificat d’adressage citoyen': {
    article: 'le certificat',
    feminin: false,
  },
  'Attestation d’hébergement': { article: 'l’attestation', feminin: true },
  'Déclaration de cohabitation': { article: 'la déclaration', feminin: true },
  'Parcours d’accueil résidentiel': { article: 'le parcours', feminin: false },
  'Justificatif de mise à l’abri': {
    article: 'le justificatif',
    feminin: false,
  },
  'Certificat de vie': { article: 'le certificat', feminin: false },
  'Attestation d’existence': { article: 'l’attestation', feminin: true },
  'Parcours de maintien en vie administrative': {
    article: 'le parcours',
    feminin: false,
  },
  'Justificatif de présence au monde': {
    article: 'le justificatif',
    feminin: false,
  },
};

/** Le document d'une procédure d'après son nom (« le document » pour un nom inconnu). */
export function documentDe(nom: string): Document {
  return DOCUMENTS[nom] ?? { article: 'le document', feminin: false };
}

/** « sa Carte d’identité », « son Titre d’identité simplifié », « son attestation » (élision devant voyelle). */
export function possessif(nom: string): 'sa' | 'son' {
  return documentDe(nom).feminin && !/^[aeiouyhéèêàâîôû]/i.test(nom)
    ? 'sa'
    : 'son';
}

/** Le mot qui suit un nombre : pluriel à partir de 2, comme en français (« 0 demande », « 24 demandes »). */
const mot = (n: number, singulier: string, pluriel: string): string =>
  n >= 2 ? pluriel : singulier;

/** « 0 demande », « 1 demande », « 24 demandes ». */
export function compte(n: number, singulier: string, pluriel: string): string {
  return `${formatEntier(n)} ${mot(n, singulier, pluriel)}`;
}

/** Valeur d'un document délivré : dotation d'un dossier qui franchit toute la procédure `p` (€). */
export function valeurDocument(x: EtatActe2, p: ProcId, m: Modifiers2): number {
  const dot =
    BALANCE2.dotation * m.dotationMult * EXEMPLAIRES[x.exemplaires].dotation;
  let euros = 0;
  for (const e of x.procedures[p]) euros += dot * ETAPES[e.type].dotation;
  return euros;
}

/** Formulaires qu'exige un document : un par étape et par exemplaire (specs/012). */
export function formulairesDocument(x: EtatActe2, p: ProcId): number {
  return x.procedures[p].length * x.exemplaires;
}

/** Dossiers en cours dans une procédure : usagers, en boucle, et ceux qui poursuivent leur procédure. */
export function dossiersEnCours(x: EtatActe2, p: ProcId): number {
  let t = 0;
  for (const st of [x.usagers, x.boucles, x.suites])
    for (const v of st[p]) t += v;
  return t;
}

export interface LigneProduction {
  id: ProcId;
  nom: string;
  demandes: number;
  delivres: number;
  /** « demandes » : le mot qui suit le nombre. */
  demandesMot: string;
  /** « délivrées » (accordé au document de la procédure). */
  delivresMot: string;
  /** « 24 demandes » */
  demandesTexte: string;
  /** « 312 délivrées » */
  delivresTexte: string;
  /**
   * Procédure que les usagers demandent, une fois l'Atelier ouvert (specs/012) : valeur d'un document
   * (« +4,48 € la carte »), formulaires qu'il exige (« 4 formulaires la carte ») et usagers perdus
   * (« 12 abandons »), symbole + mot comme les effets de l'Atelier ; null sinon.
   */
  valeur: EffetAffiche[] | null;
  /** Les documents de cette procédure sont remis à des usagers (« → usagers ») ; faux : aucune destination. */
  versUsagers: boolean;
}

/** Documents délivrés par une procédure, arrondis : 0,96 carte (4 % d'abandon au visa) compte pour une carte. */
export function delivresEntiers(x: EtatActe2, p: ProcId): number {
  return Math.round(x.stats.delivresUsagers[p] + x.stats.delivresService[p]);
}

/** Relevé « Production du service » : une ligne par procédure ouverte. Null hors de l'acte II. */
export function lignesProduction(
  s: GameState,
  maintenant: number,
): LigneProduction[] | null {
  const x = s.acte === 2 ? s.acte2 : null;
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  const ouvertes = PROCS.filter((p) => m.procsOuvertes.includes(p));
  return ouvertes.map((p) => {
    const nom = s.reformes.denomination.procedures[p];
    const doc = documentDe(nom);
    const demandee = PROCS_DEMANDEES.includes(p);
    const demandes = Math.floor(dossiersEnCours(x, p));
    const delivres = delivresEntiers(x, p);
    const abandons = Math.floor(x.stats.abandonsProc[p]);
    const demandesMot = mot(demandes, 'demande', 'demandes');
    const delivresMot = mot(
      delivres,
      doc.feminin ? 'délivrée' : 'délivré',
      doc.feminin ? 'délivrées' : 'délivrés',
    );
    return {
      id: p,
      nom,
      demandes,
      delivres,
      demandesMot,
      delivresMot,
      demandesTexte: `${formatEntier(demandes)} ${demandesMot}`,
      delivresTexte: `${formatEntier(delivres)} ${delivresMot}`,
      // Avant l'Atelier, un tap rapporte la dotation du seul visa : la valeur d'une carte entière tromperait.
      valeur:
        demandee && m.atelierVisible
          ? [
              {
                texte: `+${formatEuros(valeurDocument(x, p, m))}\u00a0€ ${doc.article}`,
                sens: 'plus',
              },
              {
                texte: `${compte(formulairesDocument(x, p), 'formulaire', 'formulaires')} ${doc.article}`,
                sens: 'neutre',
              },
              { texte: compte(abandons, 'abandon', 'abandons'), sens: 'moins' },
            ]
          : null,
      versUsagers: demandee && procedureAboutit(x.procedures, ouvertes, p),
    };
  });
}
