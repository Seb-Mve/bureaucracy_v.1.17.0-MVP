/**
 * Vues de l'acte II : ce que les écrans de La Direction affichent (écran Direction, Service, notes),
 * calculé à partir de l'état. Fonctions pures : GameStateContext les appelle (les composants n'importent
 * jamais data/). L'Atelier a sa propre vue : data/acte2/vueAtelier.ts.
 */
import type { GameState, NoteId } from '../../types/game';
import type {
  Agent2Id,
  EtapeType,
  EtatActe2,
  Exemplaires,
  Note2Id,
  ProcId,
} from '../../types/acte2';
import { AGENTS2, PROCS_DEMANDEES } from '../../constants/balanceActe2';
import { formatEntier } from '../../utils/formatters';
import { demandeur, tirage } from '../usagers';
import {
  compte,
  delivresEntiers,
  documentDe,
  dossiersEnCours,
  possessif,
} from './production';
import {
  conditionsNote2,
  coutAgent2,
  coutGuichet,
  dematerialisation,
  getModifiers2,
  guichetsOfferts,
  notesVisibles2,
  usagersAvecDemarche,
  visasEnAttente,
  vitesseGuichets,
  vitesseVisas,
} from './moteur';
import { NOTES2_PAR_ID } from './notes2';
import { dejaInstruite2 } from '../jurisprudence';

/** Plafond d'un achat « Max » (collègues, guichets, agents), par sécurité. */
export const ACHAT_MAX = 500;
/** Numéro de la première demande présentée au chef de service (le panneau d'appel affiche la précédente). */
export const PREMIER_PARAPHEUR = 48;

const DESCRIPTION_GUICHET = 'Vérifie les pièces justificatives.';
/** Noms des étapes dans la chaîne de fiches de la bulle (specs/012 : « pièce » ne désigne que la vérification). */
const NOMS_COURTS: Record<EtapeType, string> = {
  piece: 'Vérification des pièces',
  visa: 'Visa',
  signature: 'Signature',
  pieceService: 'Justificatif exigé',
  reflexion: 'Réflexion',
  commission: 'Commission',
};
/** Ce qu'attend la demande de la bulle, selon l'étape où elle se trouve. */
const ATTENTES: Record<EtapeType, string> = {
  piece: 'Attend la vérification des pièces',
  visa: 'Attend votre visa',
  signature: 'Attend la signature',
  pieceService: 'Attend le justificatif exigé',
  reflexion: 'Attend la fin du délai de réflexion',
  commission: 'Attend la commission',
};

/** État de l'acte II, seulement quand la partie est à l'acte II. */
export const acte2 = (s: GameState): EtatActe2 | null =>
  s.acte === 2 ? s.acte2 : null;

/** Vrai pour un identifiant de note de l'acte II. */
export function estNote2(id: NoteId | Note2Id): id is Note2Id {
  return id in NOTES2_PAR_ID;
}

// ---------------------------------------------------------------------------------------------
// Écran Direction
// ---------------------------------------------------------------------------------------------

/** La demande de la bulle (le nom « parapheur » reste interne : à l'écran, c'est une demande). */
export interface ParapheurAffiche {
  numero: number;
  proc: ProcId;
  procNom: string;
  /** L'usager qui attend ce document (« Mme Lefèvre »), null pour une demande sans usager. */
  demandeur: string | null;
  /** « Mme Lefèvre demande une Carte d’identité », ou « Demande n° 9 907 · Carte d’identité ». */
  titre: string;
  /** Rang de l'étape où elle attend. */
  rang: number;
  /** « Attend votre visa », « Attend la vérification des pièces »… */
  attente: string;
  /** Juste après sa délivrance : « Repart avec sa Carte d’identité » (null sans usager). */
  repart: string | null;
}

/** Numéro sur trois chiffres au moins, comme un registre (« 048 », puis « 9 412 »). */
export const numeroRegistre = (n: number): string =>
  n < 1000 ? n.toString().padStart(3, '0') : formatEntier(n);

/**
 * Une fiche du tableau de circulation (bulle) : les demandes qui attendent à cette étape et qui la traite.
 * Un visa en attente « s'allume » ; la fiche la plus encombrée est marquée ; une étape que la demande de la
 * bulle a franchie et où plus personne n'attend est « faite ».
 */
export interface EtapeChaine {
  type: EtapeType;
  nom: string;
  /** Demandes (usagers et sans usager) qui attendent à cette étape. */
  attente: number;
  /** Qui franchit l'étape : les guichets, ou le chef de service et ses agents (visa). */
  traitePar: 'guichets' | 'visa';
  /** Pictogramme : tampon (visa), guichet, ou aucun tant que le service n'a pas de guichet (specs/012). */
  pictogramme: 'visa' | 'guichet' | null;
  /** Visa avec au moins une demande en attente. */
  allumee: boolean;
  /** L'étape où attendent le plus de demandes (au moins une ; la première en cas d'égalité). */
  encombree: boolean;
  /** Franchie par la demande de la bulle, et plus personne n'y attend (coche, fond vert). */
  faite: boolean;
  /** Le visa où attend la demande de la bulle : « ← ici ». */
  ici: boolean;
}

export interface VueDirection {
  /** Nom du service du chef (« La Direction », puis un autre à chaque Réforme). */
  nomService: string;
  /** Demandes qui attendent un visa (colonne « À viser » de l'en-tête). */
  visas: number;
  /** Usagers qui ont une démarche en cours (salle de la scène). */
  usagers: number;
  /** « 1 500 usagers en ville » : habitants de la ville, au titre du relevé (specs/012). */
  ville: string;
  guichets: number;
  /** Taux de dématérialisation (%), null tant que sa note n'est pas en vigueur. */
  demat: number | null;
  /** Moins de formulaires que d'exemplaires exigés : plus aucune étape ne passe. */
  rupture: boolean;
  tauxRejet: number;
  rejetMax: number;
  exemplaires: Exemplaires;
  exemplairesVisible: boolean;
  parapheur: ParapheurAffiche | null;
  /** Étapes de la procédure de la demande (Carte d'identité s'il n'y en a pas). */
  etapes: EtapeChaine[];
  /** Fiche qui clôt la chaîne : « Délivrée » (accordé au document), faite dès le premier document délivré. */
  delivrance: { nom: string; faite: boolean };
  /** Numéro du panneau d'appel de la salle (null : salle vide, panneau éteint). */
  appel: number | null;
  recrutementVisible: boolean;
  atelierVisible: boolean;
  /** Service des achats débloqué (note « Marché public de fournitures »). */
  achatsVisible: boolean;
  /** Note n° 11 en vigueur : la Réforme peut être engagée (Options). */
  reformeVisible: boolean;
  visasAccordes: number;
  abandons: number;
  /** Tableau de bord (note n° 17), null avant. */
  tableau: { abandonsDemarche: number } | null;
  acteTermine: boolean;
  finActeVue: boolean;
}

/** Une demande en tête : sa procédure, le rang de son étape, et ce qui y attend (`u` usagers, `b` sans usager). */
interface Tete {
  p: ProcId;
  k: number;
  u: number;
  b: number;
}

/** Demandes qui attendent un visa dans la procédure `p`, et le visa le plus chargé. */
function visasDe(x: EtatActe2, p: ProcId): Tete {
  const t: Tete = { p, k: -1, u: 0, b: 0 };
  let max = -1;
  x.procedures[p].forEach((e, k) => {
    if (e.type !== 'visa') return;
    const u = x.usagers[p][k];
    const b = x.boucles[p][k] + x.suites[p][k];
    t.u += u;
    t.b += b;
    if (u + b > max) {
      max = u + b;
      t.k = k;
    }
  });
  return t;
}

/**
 * La demande de la bulle : au visa s'il y en a (procédure qui en a le plus) ; sinon, dans la procédure la plus
 * chargée, la plus proche du bureau (la dernière étape où quelqu'un attend). Null : aucune demande nulle part.
 */
function demandeEnTete(x: EtatActe2, ouvertes: ProcId[]): Tete | null {
  let tete: Tete | null = null;
  for (const p of ouvertes) {
    const v = visasDe(x, p);
    if (v.u + v.b >= 1 && (!tete || v.u + v.b > tete.u + tete.b)) tete = v;
  }
  if (tete) return tete;
  let charge = 0;
  for (const p of ouvertes) {
    const total = dossiersEnCours(x, p);
    if (total <= charge) continue;
    for (let k = x.procedures[p].length - 1; k >= 0; k--) {
      const u = x.usagers[p][k];
      const b = x.boucles[p][k] + x.suites[p][k];
      if (u + b >= 1) {
        tete = { p, k, u, b };
        charge = total;
        break;
      }
    }
  }
  return tete;
}

/**
 * Tableau de circulation d'une procédure : demandes en attente à chaque étape, qui la traite, et le chemin de
 * la demande de la bulle (`rang` : son étape, null s'il n'y en a pas).
 */
export function tableauCirculation(
  x: EtatActe2,
  p: ProcId,
  rang: number | null = null,
): EtapeChaine[] {
  const attentes = x.procedures[p].map((_, k) =>
    Math.floor(x.usagers[p][k] + x.boucles[p][k] + x.suites[p][k]),
  );
  const max = Math.max(...attentes);
  const rangMax = max >= 1 ? attentes.indexOf(max) : -1;
  return x.procedures[p].map((e, k) => {
    const visa = e.type === 'visa';
    return {
      type: e.type,
      nom: NOMS_COURTS[e.type],
      attente: attentes[k],
      traitePar: visa ? 'visa' : 'guichets',
      pictogramme: visa ? 'visa' : x.guichets > 0 ? 'guichet' : null,
      allumee: visa && attentes[k] >= 1,
      encombree: k === rangMax,
      faite: rang !== null && k < rang && attentes[k] === 0,
      ici: visa && k === rang && attentes[k] >= 1,
    };
  });
}

/** Écran Direction : ressources, demande de la bulle, scène et curseurs. Null hors de l'acte II. */
export function vueDirection(
  s: GameState,
  maintenant: number,
): VueDirection | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  const numero = PREMIER_PARAPHEUR + Math.floor(x.stats.visasTampons);
  const tete = demandeEnTete(x, m.procsOuvertes);
  const p: ProcId = tete?.p ?? 'identite';
  const usagers = Math.floor(usagersAvecDemarche(x));
  const noms = s.reformes.denomination.procedures;
  const doc = documentDe(noms[p]);
  let parapheur: ParapheurAffiche | null = null;
  if (tete) {
    // Un usager attend cette demande selon la part des demandes d'usagers à son étape (tirage stable par numéro),
    // et seulement dans une procédure que les usagers demandent.
    const avecUsager =
      PROCS_DEMANDEES.includes(tete.p) &&
      tirage(numero) < tete.u / (tete.u + tete.b);
    const nom = noms[tete.p];
    const qui = avecUsager ? demandeur(numero) : null;
    parapheur = {
      numero,
      proc: tete.p,
      procNom: nom,
      demandeur: qui,
      titre: qui
        ? `${qui} demande ${documentDe(nom).feminin ? 'une' : 'un'} ${nom}`
        : `Demande n° ${numeroRegistre(numero)} · ${nom}`,
      rang: tete.k,
      attente: ATTENTES[x.procedures[tete.p][tete.k].type],
      repart: qui ? `Repart avec ${possessif(nom)} ${nom}` : null,
    };
  }
  return {
    nomService: s.reformes.denomination.direction,
    visas: Math.floor(visasEnAttente(x)),
    usagers,
    ville: `${compte(x.population, 'usager', 'usagers')} en ville`,
    guichets: x.guichets,
    demat: m.dematVisible ? dematerialisation(x) : null,
    rupture: s.formulaires < x.exemplaires,
    tauxRejet: Math.min(x.tauxRejet, m.rejetMax),
    rejetMax: m.rejetMax,
    exemplaires: x.exemplaires,
    exemplairesVisible: m.exemplairesVisible,
    parapheur,
    etapes: tableauCirculation(x, p, tete?.k ?? null),
    delivrance: {
      nom: doc.feminin ? 'Délivrée' : 'Délivré',
      faite: delivresEntiers(x, p) >= 1,
    },
    appel: usagers >= 1 ? numero - 1 : null,
    recrutementVisible: m.recrutementVisible,
    atelierVisible: m.atelierVisible,
    achatsVisible: m.achatsVisible,
    reformeVisible: m.reformeVisible,
    visasAccordes: Math.floor(x.stats.visasTampons),
    abandons: Math.floor(x.abandons),
    tableau: m.tableauVisible
      ? { abandonsDemarche: Math.floor(x.stats.abandonsDemarche) }
      : null,
    acteTermine: x.acteTermine,
    finActeVue: x.finActeVue,
  };
}

// ---------------------------------------------------------------------------------------------
// Onglet Service
// ---------------------------------------------------------------------------------------------

export interface UniteAffichee<Id extends string = string> {
  id: Id;
  nom: string;
  description: string;
  possedes: number;
  cout: number;
  /** Coût de dix achats d'affilée (le prix monte à chaque achat). */
  cout10: number;
  /** Achats possibles d'affilée avec le budget actuel. */
  maxAchetables: number;
  coutMax: number;
  achetable: boolean;
}

export interface VueService2 {
  guichet: UniteAffichee<'guichet'>;
  agents: UniteAffichee<Agent2Id>[];
  etapesParSeconde: number;
  visasParSeconde: number;
  /** Service des achats (null avant sa note) : son interrupteur. */
  achats: { actifs: boolean } | null;
}

/** Prix d'un achat, de dix achats et du plus grand lot que le budget permet. */
function lot(
  prix: (possedes: number) => number,
  possedes: number,
  budget: number,
) {
  const cout = prix(possedes);
  let cout10 = 0;
  for (let i = 0; i < 10; i++) cout10 += prix(possedes + i);
  let maxAchetables = 0;
  let coutMax = 0;
  for (let reste = budget; maxAchetables < ACHAT_MAX; maxAchetables++) {
    const p = prix(possedes + maxAchetables);
    if (reste < p) break;
    reste -= p;
    coutMax += p;
  }
  return { cout, cout10, maxAchetables, coutMax, achetable: budget >= cout };
}

/** Onglet Service de l'acte II : guichets et agents débloqués. Null hors de l'acte II. */
export function vueService2(
  s: GameState,
  maintenant: number,
): VueService2 | null {
  const x = acte2(s);
  if (!x) return null;
  const m = getModifiers2(s, maintenant);
  return {
    guichet: {
      id: 'guichet',
      nom: 'Guichet',
      description: DESCRIPTION_GUICHET,
      possedes: x.guichets,
      ...lot((n) => coutGuichet(n, guichetsOfferts(s)), x.guichets, s.budget),
    },
    agents: AGENTS2.filter((a) => m.agentsDisponibles.includes(a.id)).map(
      (a) => ({
        id: a.id,
        nom: a.nom,
        description: a.description,
        possedes: x.agents[a.id],
        ...lot((n) => coutAgent2(a.id, n), x.agents[a.id], s.budget),
      }),
    ),
    etapesParSeconde: vitesseGuichets(x),
    visasParSeconde: vitesseVisas(x),
    achats: m.achatsVisible ? { actifs: x.achatsActifs } : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Notes de service
// ---------------------------------------------------------------------------------------------

export type StatutNote2 =
  'disponible' | 'tropCher' | 'instruction' | 'effective';

export interface NoteVue2 {
  id: Note2Id;
  numero: number;
  titre: string;
  texte: string;
  effet: string;
  cout: number;
  instruction: number;
  statut: StatutNote2;
  /** Secondes restantes d'instruction. */
  resteSec: number;
  nouvelle: boolean;
  /** Déjà-vu administratif : achetée lors d'une partie précédente (délai et coût réduits). */
  dejaInstruite: boolean;
}

/** Notes de l'acte II visibles, avec leur statut (même carte qu'à l'acte I). */
export function notesAffichees2(s: GameState, maintenant: number): NoteVue2[] {
  const x = acte2(s);
  if (!x) return [];
  return notesVisibles2(s).map((id) => {
    const def = NOTES2_PAR_ID[id];
    const { cout, instruction } = conditionsNote2(s, id);
    const st = x.notes[id];
    let statut: StatutNote2 = s.budget >= cout ? 'disponible' : 'tropCher';
    let resteSec = 0;
    if (st) {
      resteSec = Math.max(0, Math.ceil((st.effective - maintenant) / 1000));
      statut = resteSec > 0 ? 'instruction' : 'effective';
    }
    return {
      id,
      numero: def.numero,
      titre: def.titre,
      texte: def.texte,
      effet: def.effet,
      cout,
      instruction,
      statut,
      resteSec,
      nouvelle: !x.notesVues.includes(id),
      dejaInstruite: dejaInstruite2(s, id),
    };
  });
}
