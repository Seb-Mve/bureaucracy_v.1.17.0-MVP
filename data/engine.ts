/**
 * Moteur de l'acte I. Fonctions pures, sans dépendance React :
 * utilisées par GameStateContext et par scripts/simulate-acte1.ts.
 */
import {
  PATIENCE_MAX,
  type AgentId,
  type GameEvents,
  type GameState,
  type Modifiers,
  type NoteId,
  type ParPatience,
} from '../types/game';
import { AGENTS, BALANCE, type AgentDef } from '../constants/balance';
import { EXTENSIONS_PERIMETRE, NOTES, NOTES_PAR_ID } from './notes';

const somme = (a: ParPatience): number => a[1] + a[2] + a[3];

/** Nouvelle partie, Cerfa non signé. */
export function etatInitial(maintenant: number): GameState {
  return {
    version: 1,
    cerfa: { signe: false, prenom: '', signeLe: null },
    tampons: 0,
    budget: BALANCE.budgetInitial,
    formulaires: BALANCE.formulairesInitiaux,
    file: [0, 0, 0, BALANCE.fileInitiale],
    retours: [0, 0, 0, 0],
    population: BALANCE.populationInitiale,
    abandons: 0,
    conformitePoints: 0,
    tauxRejet: 0,
    agents: { stagiaire: 0, accueil: 0, instructeur: 0, titulaire: 0 },
    notes: {},
    notesVues: [],
    courrier: [],
    lettresEnvoyees: [],
    demission: { deposeeLe: null, relances: 0 },
    acteTermine: false,
    finActeVue: false,
    fichePosteVue: false,
    circulairesVues: [],
    stats: {
      traites: 0,
      rejetes: 0,
      acceptes: 0,
      taps: 0,
      formulairesAchetes: 0,
      budgetGagne: 0,
      tempsDeJeu: 0,
    },
    derniereMaj: maintenant,
  };
}

/** Vrai si la note est achetée et son délai d'instruction écoulé. */
export function noteEffective(s: GameState, id: NoteId, maintenant: number): boolean {
  const n = s.notes[id];
  return n !== undefined && n.effective <= maintenant;
}

/** Modificateurs de jeu issus des notes de service effectives. */
export function getModifiers(s: GameState, maintenant: number): Modifiers {
  const m: Modifiers = {
    tapPower: 1,
    demandeMult: 1,
    dotationMult: 1,
    primeRejet: 0,
    pieces: 1,
    rejetVisible: false,
    rejetMax: 0,
    delaiRetourMult: 1,
    agentSpeedMult: 1,
    prixFormulaireMult: 1,
    commandeAuto: false,
    confRejetMult: 1,
    confPieceMult: 1,
    agentsDisponibles: [],
    recrutementVisible: false,
    numerotation: false,
    conformiteVisible: false,
  };
  for (const note of NOTES) {
    if (noteEffective(s, note.id, maintenant)) note.appliquer(m);
  }
  return m;
}

/** Capacité du périmètre (usagers) selon les extensions effectives. */
export function perimetre(s: GameState, maintenant: number): number {
  let cap = BALANCE.populationInitiale;
  for (const [id, ajout] of Object.entries(EXTENSIONS_PERIMETRE)) {
    if (noteEffective(s, id as NoteId, maintenant)) cap += ajout ?? 0;
  }
  return cap;
}

/** Conformité affichable, plafonnée à 100 %. */
export function conformite(s: GameState): number {
  return Math.min(100, (s.conformitePoints / BALANCE.confCible) * 100);
}

export function dossiersEnAttente(s: GameState): number {
  return somme(s.file);
}

/** Dossiers arrivant au guichet par seconde : nouvelles demandes + retours de rejetés. */
export function fluxEntrant(s: GameState, m: Modifiers): number {
  const inactifs = Math.max(0, s.population - somme(s.file) - somme(s.retours));
  const delai = BALANCE.delaiRetour * m.delaiRetourMult;
  return inactifs * BALANCE.demandeRate * m.demandeMult + somme(s.retours) / delai;
}

/** Débit maximal de demandes que le périmètre peut produire (file vide). */
export function plafondDemande(s: GameState, m: Modifiers): number {
  return s.population * BALANCE.demandeRate * m.demandeMult;
}

/**
 * Vrai quand la capacité des collègues approche le plafond de demande.
 * Hystérésis : on entre à `saturationEntree`, on sort sous `saturationSortie`.
 */
export function saturation(precedent: boolean, capacite: number, plafond: number): boolean {
  if (plafond <= 0) return capacite > 0;
  const ratio = capacite / plafond;
  return ratio >= (precedent ? BALANCE.saturationSortie : BALANCE.saturationEntree);
}

export function coutAgent(id: AgentId, possedes: number): number {
  const def = AGENTS.find((a) => a.id === id);
  if (!def) return Infinity;
  return Math.ceil(def.coutBase * Math.pow(BALANCE.croissanceCoutAgent, possedes));
}

/** Multiplicateur de vitesse d'un type de collègue : ×2 par palier atteint. */
export function multiplicateurAnciennete(possedes: number): number {
  let mult = 1;
  for (const palier of BALANCE.paliersAnciennete) if (possedes >= palier) mult *= 2;
  return mult;
}

/** Prochain palier d'ancienneté, ou null si le dernier est atteint. */
export function prochainPalier(possedes: number): number | null {
  return BALANCE.paliersAnciennete.find((p) => p > possedes) ?? null;
}

/** Vitesse de `n` collègues d'un même type, ancienneté comprise, hors modificateurs. */
function vitesseType(def: AgentDef, n: number): number {
  return n * def.vitesse * multiplicateurAnciennete(n);
}

/** Dossiers traités par seconde par l'ensemble des collègues. */
export function vitesseCollegues(s: GameState, m: Modifiers): number {
  let v = 0;
  for (const a of AGENTS) v += vitesseType(a, s.agents[a.id]);
  return v * m.agentSpeedMult;
}

/** Dossiers/s gagnés en recrutant un collègue de plus (palier compris). */
export function gainAgent(s: GameState, id: AgentId, m: Modifiers): number {
  const def = AGENTS.find((a) => a.id === id);
  if (!def) return 0;
  const n = s.agents[id];
  return (vitesseType(def, n + 1) - vitesseType(def, n)) * m.agentSpeedMult;
}

export function prixRamette(m: Modifiers): number {
  return Math.round(BALANCE.prixRamette * m.prixFormulaireMult * 100) / 100;
}

/**
 * Traite `n` dossiers pris dans la file (proportionnellement à chaque niveau de patience).
 * Applique rejets, retours, abandons, dotation et Conformité.
 */
function traiter(s: GameState, demande: number, m: Modifiers): { s: GameState; ev: GameEvents } {
  const ev: GameEvents = { traites: 0, rejetes: 0, budget: 0, rupture: false, fileVide: false };
  const enFile = somme(s.file);
  if (enFile <= 0) {
    ev.fileVide = true;
    return { s, ev };
  }
  const possibles = Math.min(demande, enFile, s.formulaires / m.pieces);
  if (possibles < demande && s.formulaires / m.pieces < Math.min(demande, enFile)) ev.rupture = true;
  if (possibles <= 0) return { s, ev };

  const taux = Math.min(s.tauxRejet, m.rejetMax);
  const file = [...s.file] as ParPatience;
  const retours = [...s.retours] as ParPatience;
  let population = s.population;
  let abandons = s.abandons;
  let rejetes = 0;

  for (let p = 1; p <= PATIENCE_MAX; p++) {
    const part = (s.file[p] / enFile) * possibles;
    if (part <= 0) continue;
    file[p] = Math.max(0, file[p] - part);
    const rej = part * taux;
    rejetes += rej;
    if (p > 1) {
      retours[p - 1] += rej;
    } else {
      population -= rej;
      abandons += rej;
    }
  }

  const dotation = BALANCE.dotation * m.dotationMult;
  const gain = possibles * dotation + rejetes * dotation * m.primeRejet;
  const conf =
    rejetes * BALANCE.confParRejet * m.confRejetMult +
    possibles * (m.pieces - 1) * BALANCE.confParPiece * m.confPieceMult;

  ev.traites = possibles;
  ev.rejetes = rejetes;
  ev.budget = gain;

  return {
    ev,
    s: {
      ...s,
      file,
      retours,
      population,
      abandons,
      tampons: s.tampons + possibles,
      budget: s.budget + gain,
      formulaires: s.formulaires - possibles * m.pieces,
      conformitePoints: s.conformitePoints + conf,
      stats: {
        ...s.stats,
        traites: s.stats.traites + possibles,
        rejetes: s.stats.rejetes + rejetes,
        acceptes: s.stats.acceptes + possibles - rejetes,
        budgetGagne: s.stats.budgetGagne + gain,
      },
    },
  };
}

/**
 * Avance la simulation de `dt` secondes : demandes, retours, installations,
 * travail des collègues et commande automatique.
 */
export function tick(
  s0: GameState,
  dt: number,
  maintenant: number,
  enJeu = true,
): { s: GameState; ev: GameEvents } {
  const m = getModifiers(s0, maintenant);
  const file = [...s0.file] as ParPatience;
  const retours = [...s0.retours] as ParPatience;

  // Retours des usagers rejetés (sortie exponentielle).
  const delai = BALANCE.delaiRetour * m.delaiRetourMult;
  const fracRetour = 1 - Math.exp(-dt / delai);
  for (let p = 1; p <= PATIENCE_MAX; p++) {
    const r = retours[p] * fracRetour;
    retours[p] -= r;
    file[p] += r;
  }

  // Nouvelles demandes des usagers inactifs.
  const dansLeSysteme = somme(file) + somme(retours);
  const inactifs = Math.max(0, s0.population - dansLeSysteme);
  file[PATIENCE_MAX] += inactifs * BALANCE.demandeRate * m.demandeMult * dt;

  // Installation de nouveaux habitants dans la place libre du périmètre.
  const cap = perimetre(s0, maintenant);
  const population =
    s0.population + Math.max(0, cap - s0.population) * BALANCE.installationRate * dt;

  let s: GameState = {
    ...s0,
    file,
    retours,
    population,
    derniereMaj: maintenant,
    stats: enJeu ? { ...s0.stats, tempsDeJeu: s0.stats.tempsDeJeu + dt } : s0.stats,
  };

  // Commande automatique : garder ~30 s de consommation en stock.
  if (m.commandeAuto) {
    const besoin = (vitesseCollegues(s, m) + m.tapPower * 3) * m.pieces * 30;
    if (s.formulaires < besoin) {
      const prix = prixRamette(m);
      const nb = Math.min(
        Math.ceil((besoin - s.formulaires) / BALANCE.ramette),
        Math.floor(s.budget / prix),
      );
      if (nb > 0) s = acheterRamettesSans(s, nb, prix);
    }
  }

  return traiter(s, vitesseCollegues(s, m) * dt, m);
}

/** Un tap sur TAMPONNER. */
export function tamponner(s: GameState, maintenant: number): { s: GameState; ev: GameEvents } {
  const m = getModifiers(s, maintenant);
  const r = traiter(s, m.tapPower, m);
  return {
    ev: r.ev,
    s: {
      ...r.s,
      stats: { ...r.s.stats, taps: r.s.stats.taps + 1 },
    },
  };
}

export function peutAcheterAgent(s: GameState, id: AgentId, maintenant: number): boolean {
  const m = getModifiers(s, maintenant);
  return m.agentsDisponibles.includes(id) && s.budget >= coutAgent(id, s.agents[id]);
}

export function acheterAgent(s: GameState, id: AgentId, maintenant: number): GameState {
  if (!peutAcheterAgent(s, id, maintenant)) return s;
  return {
    ...s,
    budget: s.budget - coutAgent(id, s.agents[id]),
    agents: { ...s.agents, [id]: s.agents[id] + 1 },
  };
}

function acheterRamettesSans(s: GameState, nb: number, prix: number): GameState {
  return {
    ...s,
    budget: s.budget - nb * prix,
    formulaires: s.formulaires + nb * BALANCE.ramette,
    stats: { ...s.stats, formulairesAchetes: s.stats.formulairesAchetes + nb * BALANCE.ramette },
  };
}

/** Achète `nb` ramettes si le budget le permet (sinon le maximum possible). */
export function acheterRamettes(s: GameState, nb: number, maintenant: number): GameState {
  const prix = prixRamette(getModifiers(s, maintenant));
  const possibles = Math.min(nb, Math.floor(s.budget / prix));
  if (possibles <= 0) return s;
  return acheterRamettesSans(s, possibles, prix);
}

export function reglerTauxRejet(s: GameState, taux: number, maintenant: number): GameState {
  const m = getModifiers(s, maintenant);
  const t = Math.max(0, Math.min(m.rejetMax, Math.round(taux * 100) / 100));
  return { ...s, tauxRejet: t };
}

/** Notes visibles (conditions remplies), achetées ou non. */
export function notesVisibles(s: GameState): NoteId[] {
  return NOTES.filter((n) => s.notes[n.id] !== undefined || n.visible(s)).map((n) => n.id);
}

export function peutAcheterNote(s: GameState, id: NoteId): boolean {
  const n = NOTES_PAR_ID[id];
  return s.notes[id] === undefined && n.visible(s) && s.budget >= n.cout;
}

export function acheterNote(s: GameState, id: NoteId, maintenant: number): GameState {
  if (!peutAcheterNote(s, id)) return s;
  const n = NOTES_PAR_ID[id];
  return {
    ...s,
    budget: s.budget - n.cout,
    notes: { ...s.notes, [id]: { achetee: maintenant, effective: maintenant + n.instruction * 1000 } },
    acteTermine: s.acteTermine || id === 'reaffectation',
  };
}

export function signerCerfa(s: GameState, prenom: string, maintenant: number): GameState {
  return { ...s, cerfa: { signe: true, prenom: prenom.trim().slice(0, 20), signeLe: maintenant } };
}

export function deposerDemission(s: GameState, maintenant: number): GameState {
  if (s.demission.deposeeLe !== null) return s;
  return { ...s, demission: { deposeeLe: maintenant, relances: 0 } };
}

/**
 * Simule une absence avec les collègues seuls, par pas d'une seconde,
 * plafonnée à BALANCE.horsLigneMax.
 */
export function simulerAbsence(
  s0: GameState,
  maintenant: number,
): { s: GameState; secondes: number; traites: number; budget: number } {
  const secondes = Math.min(
    BALANCE.horsLigneMax,
    Math.max(0, Math.floor((maintenant - s0.derniereMaj) / 1000)),
  );
  let s = s0;
  let traites = 0;
  let budget = 0;
  const debut = maintenant - secondes * 1000;
  for (let i = 1; i <= secondes; i++) {
    const r = tick(s, 1, debut + i * 1000, false);
    s = r.s;
    traites += r.ev.traites;
    budget += r.ev.budget;
  }
  return { s: { ...s, derniereMaj: maintenant }, secondes, traites, budget };
}
