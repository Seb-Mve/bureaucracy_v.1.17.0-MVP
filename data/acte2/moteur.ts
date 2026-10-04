/**
 * Moteur de l'acte II — La Direction. Fonctions pures, sans dépendance React :
 * utilisées par GameStateContext et par scripts/simulate-acte2.ts.
 */
import type { GameState } from '../../types/game';
import {
  PROCS,
  type ActionAtelier,
  type Agent2Id,
  type Etape,
  type EtatActe2,
  type Events2,
  type Exemplaires,
  type Modifiers2,
  type Note2Id,
  type ProcId,
  type Stocks,
} from '../../types/acte2';
import { BALANCE } from '../../constants/balance';
import {
  AGENTS2,
  BALANCE2,
  ETAPES,
  EXEMPLAIRES,
  PROCEDURES_INITIALES,
  REFORME,
} from '../../constants/balanceActe2';
import { multiplicateurAnciennete, partRejetee, rangGrade } from '../engine';
import { NOTES2, NOTES2_PAR_ID, dematPct } from './notes2';
import { appliquerAction, estBoucle } from './procedures';
import {
  aJurisprudence,
  conditionsNote,
  dejaInstruite2,
  dotationJurisprudence,
  prixFormulairesJurisprudence,
} from '../jurisprudence';

export function copieProcedures(
  p: Record<ProcId, Etape[]>,
): Record<ProcId, Etape[]> {
  return Object.fromEntries(
    PROCS.map((id) => [id, p[id].map((e) => ({ ...e }))]),
  ) as Record<ProcId, Etape[]>;
}

export function copieStocks(st: Stocks): Stocks {
  return Object.fromEntries(PROCS.map((p) => [p, [...st[p]]])) as Stocks;
}

/** Stocks à zéro : un compteur par étape de chaque procédure. */
export function stocksPour(procedures: Record<ProcId, Etape[]>): Stocks {
  return Object.fromEntries(
    PROCS.map((p) => [p, procedures[p].map(() => 0)]),
  ) as Stocks;
}

export function sommeStocks(st: Stocks): number {
  let t = 0;
  for (const p of PROCS) for (const v of st[p]) t += v;
  return t;
}

/** État de la Direction à l'entrée dans l'acte : le guichet 3 et la procédure du S.I.C. */
export function etatInitialActe2(maintenant: number): EtatActe2 {
  const procedures = copieProcedures(PROCEDURES_INITIALES);
  const usagers = stocksPour(procedures);
  usagers.identite[0] = BALANCE2.fileInitiale;
  usagers.identite[1] = BALANCE2.visasInitiaux;
  return {
    debut: maintenant,
    guichets: BALANCE2.guichetsInitiaux,
    agents: { instructeur: 0, chefBureau: 0, sousDirecteur: 0 },
    procedures,
    usagers,
    boucles: stocksPour(procedures),
    population: BALANCE2.populationInitiale,
    abandons: 0,
    conformitePoints: 0,
    demaPoints: 0,
    tauxRejet: 0,
    exemplaires: 1,
    notes: {},
    notesVues: [],
    premiereBoucle: null,
    premiereModif: null,
    acteTermine: false,
    finActeVue: false,
    duree: 0,
    memoireRestauree: false,
    stats: {
      franchies: 0,
      franchiesBoucle: 0,
      visasTampons: 0,
      abandonsDemarche: 0,
      taps: 0,
    },
  };
}

/**
 * Passage à l'acte II : toutes les ressources repartent à zéro, sauf le compteur
 * de tampons (et donc le grade). Le budget non consommé est « restitué au Trésor ».
 */
export function entrerActe2(s: GameState, maintenant: number): GameState {
  if (s.acte === 2) return s;
  const x = etatInitialActe2(maintenant);
  return {
    ...s,
    acte: 2,
    acte2: { ...x, guichets: guichetsOfferts(s) },
    budget: BALANCE2.budgetInitial,
    formulaires: BALANCE2.formulairesInitiaux,
    derniereMaj: maintenant,
  };
}

/** Vrai si la note est achetée et son délai d'instruction écoulé. */
export function noteEffective2(
  x: EtatActe2,
  id: Note2Id,
  maintenant: number,
): boolean {
  const n = x.notes[id];
  return n !== undefined && n.effective <= maintenant;
}

/** Modificateurs de l'acte II : notes effectives et grade (le grade suit le compteur de tampons). */
export function getModifiers2(s: GameState, maintenant: number): Modifiers2 {
  const m: Modifiers2 = {
    tapPower: 1,
    dotationMult:
      (1 + BALANCE.bonusGrade * rangGrade(s.tampons)) *
      dotationJurisprudence(s),
    primeRejet: BALANCE2.primeRejet,
    rejetMax: BALANCE2.rejetMaxInitial,
    recrutementVisible: false,
    agentsDisponibles: [],
    atelierVisible: false,
    etapesDisponibles: ['visa'],
    procsOuvertes: ['identite'],
    exemplairesVisible: false,
    dematVisible: false,
    reformeVisible: false,
    tableauVisible: false,
    droitAcquis: aJurisprudence(s, 'droitAcquis'),
  };
  const x = s.acte2;
  if (!x) return m;
  for (const n of NOTES2)
    if (noteEffective2(x, n.id, maintenant)) n.appliquer(m);
  return m;
}

/** Notes visibles (conditions remplies), achetées ou non, dans l'ordre du catalogue. */
export function notesVisibles2(s: GameState): Note2Id[] {
  const x = s.acte2;
  if (!x) return [];
  return NOTES2.filter((n) => x.notes[n.id] !== undefined || n.visible(s)).map(
    (n) => n.id,
  );
}

/** Coût et délai d'instruction d'une note de l'acte II, déjà-vu administratif compris. */
export function conditionsNote2(
  s: GameState,
  id: Note2Id,
): { cout: number; instruction: number } {
  const n = NOTES2_PAR_ID[id];
  return conditionsNote(dejaInstruite2(s, id), n.cout, n.instruction);
}

export function peutAcheterNote2(s: GameState, id: Note2Id): boolean {
  const x = s.acte2;
  const n = NOTES2_PAR_ID[id];
  return (
    x !== null &&
    x.notes[id] === undefined &&
    n.visible(s) &&
    s.budget >= conditionsNote2(s, id).cout
  );
}

export function acheterNote2(
  s: GameState,
  id: Note2Id,
  maintenant: number,
): GameState {
  if (!peutAcheterNote2(s, id)) return s;
  const x = s.acte2 as EtatActe2;
  const { cout, instruction } = conditionsNote2(s, id);
  return {
    ...s,
    budget: s.budget - cout,
    acte2: {
      ...x,
      notes: {
        ...x.notes,
        [id]: {
          achetee: maintenant,
          effective: maintenant + instruction * 1000,
        },
      },
      acteTermine: x.acteTermine || id === 'promotion',
    },
  };
}

/** Les notes visibles de l'acte II sont marquées vues (pastille « NOUVEAU »). Même objet si rien ne change. */
export function marquerNotesVues2(s: GameState): GameState {
  const x = s.acte2;
  if (!x) return s;
  const visibles = notesVisibles2(s);
  if (visibles.every((id) => x.notesVues.includes(id))) return s;
  return { ...s, acte2: { ...x, notesVues: visibles } };
}

/** L'écran de fin de l'acte II a été affiché (champ de l'acte II, distinct de celui de l'acte I). */
export function marquerFinActeVue2(s: GameState): GameState {
  const x = s.acte2;
  if (!x || x.finActeVue) return s;
  return { ...s, acte2: { ...x, finActeVue: true } };
}

export const usagersEnCours = (x: EtatActe2): number => sommeStocks(x.usagers);
export const dossiersEnBoucle = (x: EtatActe2): number =>
  sommeStocks(x.boucles);

/** Taux de dématérialisation affichable, plafonné à 100 %. */
export function dematerialisation(x: EtatActe2): number {
  return Math.min(100, dematPct(x));
}

/** Dossiers (usagers et boucles) qui attendent un visa. */
export function visasEnAttente(x: EtatActe2): number {
  let t = 0;
  for (const p of PROCS) {
    x.procedures[p].forEach((e, k) => {
      if (e.type === 'visa') t += x.usagers[p][k] + x.boucles[p][k];
    });
  }
  return t;
}

/** Étapes (hors visas) franchies par seconde par les Guichets. */
export function vitesseGuichets(x: EtatActe2): number {
  return x.guichets * BALANCE2.guichet.vitesse;
}

/** Visas accordés par seconde par les agents, ancienneté comprise. */
export function vitesseVisas(x: EtatActe2): number {
  let v = 0;
  for (const a of AGENTS2) {
    const n = x.agents[a.id];
    v += n * a.vitesse * multiplicateurAnciennete(n);
  }
  return v;
}

/**
 * Points de dématérialisation par étape franchie en boucle. Le mur : la sclérose des services, qui
 * vieillissent depuis l'entrée dans l'acte (la Réforme les rajeunit). La jurisprudence constante :
 * chaque trombone obtenu, dépensé ou non, accélère la dématérialisation des parties suivantes.
 */
export function rendementDemat(s: GameState, x: EtatActe2): number {
  return (
    (1 + REFORME.jurisprudenceConstante * s.reformes.trombonesObtenus) /
    (1 + x.duree / REFORME.scleroseS)
  );
}

/** Dossiers d'une étape qui la franchissent : `u` d'usagers, `b` en boucle. */
interface Lot {
  p: ProcId;
  k: number;
  u: number;
  b: number;
}

const evVide = (): Events2 => ({
  franchies: 0,
  visas: 0,
  budget: 0,
  rupture: false,
  aucunVisa: false,
});

function nettoyer(st: Stocks): Stocks {
  return Object.fromEntries(
    PROCS.map((p) => [p, st[p].map((v) => Math.max(0, v))]),
  ) as Stocks;
}

/**
 * Fait franchir leur étape aux lots : dotation, Conformité, tampons, formulaires, patience,
 * dossiers liés, boucles, rejet en fin de procédure, dématérialisation.
 * `alea` fourni (coup du joueur) : rejet tiré au sort ; absent (automates) : taux moyen.
 */
function franchir(
  s: GameState,
  lots: Lot[],
  m: Modifiers2,
  maintenant: number,
  alea?: () => number,
): { s: GameState; ev: Events2 } {
  const x0 = s.acte2 as EtatActe2;
  const ev = evVide();
  let total = 0;
  for (const l of lots) total += l.u + l.b;
  if (total <= 0) return { s, ev };
  // Formulaires : on franchit au prorata de ce que le stock permet.
  const ratio = Math.min(
    1,
    Math.max(0, s.formulaires) / (total * x0.exemplaires),
  );
  if (ratio < 1) ev.rupture = true;
  if (ratio <= 0) return { s, ev };

  const ex = EXEMPLAIRES[x0.exemplaires];
  const dot = BALANCE2.dotation * m.dotationMult * ex.dotation;
  const taux = Math.min(x0.tauxRejet, m.rejetMax);
  const usagers = copieStocks(x0.usagers);
  const boucles = copieStocks(x0.boucles);
  let budget = 0;
  let conf = 0;
  let franchies = 0;
  let franchiesBoucle = 0;
  let population = x0.population;
  let abandons = x0.abandons;
  let abandonsDemarche = x0.stats.abandonsDemarche;
  let premiereBoucle = x0.premiereBoucle;

  for (const l of lots) {
    const u0 = l.u * ratio;
    const b0 = l.b * ratio;
    if (u0 + b0 <= 0) continue;
    const etapes = x0.procedures[l.p];
    const e = etapes[l.k];
    const def = ETAPES[e.type];
    usagers[l.p][l.k] -= u0;
    boucles[l.p][l.k] -= b0;
    franchies += u0 + b0;
    franchiesBoucle += b0;
    budget += (u0 + b0) * dot * def.dotation;
    conf += (u0 + b0) * def.conf * ex.conf;
    if (e.type === 'visa') ev.visas += u0 + b0;

    // Patience : une part des usagers abandonne à chaque étape.
    // Droit acquis (Jurisprudence) : la première étape de chaque procédure ne coûte aucune patience.
    const ab =
      m.droitAcquis && l.k === 0
        ? 0
        : u0 *
          Math.min(1, def.patience * BALANCE2.abandonParPoint * ex.patience);
    population -= ab;
    abandons += ab;
    let u = u0 - ab;
    let b = b0;

    // Pièce délivrée par nos services : un dossier lié est déposé dans la procédure exigée.
    // Un dossier en boucle n'est pas dupliqué : il passe dans la procédure exigée.
    if (
      e.type === 'pieceService' &&
      e.exige !== undefined &&
      m.procsOuvertes.includes(e.exige)
    ) {
      if (estBoucle(x0.procedures, m.procsOuvertes, l.p, e.exige)) {
        // La chaîne ne peut plus aboutir : l'usager est renvoyé chez lui, le dossier continue sans lui.
        abandonsDemarche += u;
        boucles[e.exige][0] += b + u;
        if (b + u > 0 && premiereBoucle === null) premiereBoucle = maintenant;
        // Le dossier part dans la procédure exigée : il ne poursuit pas la sienne (un seul dossier par usager).
        b = 0;
        u = 0;
      } else {
        usagers[e.exige][0] += u;
        boucles[e.exige][0] += b;
        b = 0;
      }
    }

    if (l.k + 1 < etapes.length) {
      usagers[l.p][l.k + 1] += u;
      boucles[l.p][l.k + 1] += b;
      continue;
    }

    // Fin de procédure : rejet. Sans usager, le rejet ne coûte rien.
    const part = alea ? partRejetee(u + b, taux, alea) : taux;
    const rejU = u * part;
    const rejB = b * part;
    budget += (rejU + rejB) * dot * m.primeRejet;
    conf += (rejU + rejB) * BALANCE2.confParRejet;
    const abRejet = rejU * BALANCE2.abandonRejet;
    population -= abRejet;
    abandons += abRejet;
    usagers[l.p][0] += rejU - abRejet;
    boucles[l.p][0] += rejB;
  }

  ev.franchies = franchies;
  ev.budget = budget;
  const x: EtatActe2 = {
    ...x0,
    usagers: nettoyer(usagers),
    boucles: nettoyer(boucles),
    population: Math.max(0, population),
    abandons,
    conformitePoints: x0.conformitePoints + conf * BALANCE2.conformiteParPoint,
    demaPoints: x0.demaPoints + franchiesBoucle * rendementDemat(s, x0),
    premiereBoucle,
    stats: {
      ...x0.stats,
      franchies: x0.stats.franchies + franchies,
      franchiesBoucle: x0.stats.franchiesBoucle + franchiesBoucle,
      abandonsDemarche,
    },
  };
  return {
    ev,
    s: {
      ...s,
      acte2: x,
      tampons: s.tampons + franchies,
      budget: s.budget + budget,
      formulaires: s.formulaires - franchies * x0.exemplaires,
      stats: { ...s.stats, budgetGagne: s.stats.budgetGagne + budget },
    },
  };
}

/**
 * Avance l'acte II de `dt` secondes : demandes, installations, Guichets et agents.
 * Hors jeu (absence), aucun rejet.
 */
export function tick2(
  s0: GameState,
  dt: number,
  maintenant: number,
  enJeu = true,
): { s: GameState; ev: Events2 } {
  const x0 = s0.acte2;
  if (!x0) return { s: s0, ev: evVide() };
  const m = getModifiers2(s0, maintenant);

  // Nouvelles demandes des usagers inactifs, réparties entre les procédures ouvertes.
  const usagers = copieStocks(x0.usagers);
  const inactifs = Math.max(0, x0.population - sommeStocks(usagers));
  const nouvelles = inactifs * (1 - Math.exp(-BALANCE2.demandeRate * dt));
  for (const p of m.procsOuvertes)
    usagers[p][0] += nouvelles / m.procsOuvertes.length;
  const population =
    x0.population +
    Math.max(0, BALANCE2.populationMax - x0.population) *
      BALANCE2.installationRate *
      dt;

  // Les services vieillissent pendant le jeu comme pendant une absence (simulée, plafonnée).
  const x: EtatActe2 = restaurerMemoire(
    s0,
    { ...x0, usagers, population, duree: x0.duree + dt },
    m,
  );
  const s: GameState = {
    ...s0,
    acte2: x,
    derniereMaj: maintenant,
    stats: enJeu
      ? { ...s0.stats, tempsDeJeu: s0.stats.tempsDeJeu + dt }
      : s0.stats,
  };

  // Dossiers prêts à franchir leur étape (délai moyen de l'étape écoulé).
  const guichet: Lot[] = [];
  const visa: Lot[] = [];
  let totalG = 0;
  let totalV = 0;
  for (const p of m.procsOuvertes) {
    x.procedures[p].forEach((e, k) => {
      const f = 1 - Math.exp(-dt / ETAPES[e.type].delai);
      const lot = { p, k, u: x.usagers[p][k] * f, b: x.boucles[p][k] * f };
      if (e.type === 'visa') {
        visa.push(lot);
        totalV += lot.u + lot.b;
      } else {
        guichet.push(lot);
        totalG += lot.u + lot.b;
      }
    });
  }
  const rG = totalG > 0 ? Math.min(1, (vitesseGuichets(x) * dt) / totalG) : 0;
  const rV = totalV > 0 ? Math.min(1, (vitesseVisas(x) * dt) / totalV) : 0;
  const lots = [
    ...guichet.map((l) => ({ ...l, u: l.u * rG, b: l.b * rG })),
    ...visa.map((l) => ({ ...l, u: l.u * rV, b: l.b * rV })),
  ];
  return franchir(s, lots, enJeu ? m : { ...m, rejetMax: 0 }, maintenant);
}

/**
 * Mémoire des services (Jurisprudence) : à l'ouverture de l'Atelier, avant toute modification du joueur,
 * les procédures d'avant la Réforme sont restaurées, une seule fois. Les dossiers engagés gardent leur
 * rang (ou passent à la dernière étape).
 */
export function restaurerMemoire(
  s: GameState,
  x: EtatActe2,
  m: Modifiers2,
): EtatActe2 {
  const memoire = s.reformes.procedures;
  if (
    x.memoireRestauree ||
    x.premiereModif !== null ||
    !m.atelierVisible ||
    !memoire ||
    !aJurisprudence(s, 'memoire')
  )
    return x;
  const procedures = copieProcedures(memoire);
  const ranger = (st: Stocks): Stocks =>
    Object.fromEntries(
      PROCS.map((p) => {
        const v = procedures[p].map(() => 0);
        st[p].forEach((n, k) => {
          v[Math.min(k, v.length - 1)] += n;
        });
        return [p, v];
      }),
    ) as Stocks;
  return {
    ...x,
    procedures,
    usagers: ranger(x.usagers),
    boucles: ranger(x.boucles),
    memoireRestauree: true,
  };
}

/** Un tap sur TAMPONNER : accorde `tapPower` visas en attente ; le rejet de chaque dossier est tiré au sort. */
export function tamponner2(
  s0: GameState,
  maintenant: number,
  alea: () => number = Math.random,
): { s: GameState; ev: Events2 } {
  const x0 = s0.acte2;
  if (!x0) return { s: s0, ev: evVide() };
  const m = getModifiers2(s0, maintenant);
  const s: GameState = {
    ...s0,
    acte2: { ...x0, stats: { ...x0.stats, taps: x0.stats.taps + 1 } },
    stats: { ...s0.stats, taps: s0.stats.taps + 1 },
  };
  const lots: Lot[] = [];
  let total = 0;
  for (const p of m.procsOuvertes) {
    x0.procedures[p].forEach((e, k) => {
      if (e.type !== 'visa') return;
      lots.push({ p, k, u: x0.usagers[p][k], b: x0.boucles[p][k] });
      total += x0.usagers[p][k] + x0.boucles[p][k];
    });
  }
  if (total < 1e-9) return { s, ev: { ...evVide(), aucunVisa: true } };
  const part = Math.min(1, m.tapPower / total);
  const r = franchir(
    s,
    lots.map((l) => ({ ...l, u: l.u * part, b: l.b * part })),
    m,
    maintenant,
    alea,
  );
  const x = r.s.acte2 as EtatActe2;
  return {
    ev: r.ev,
    s: {
      ...r.s,
      acte2: {
        ...x,
        stats: { ...x.stats, visasTampons: x.stats.visasTampons + r.ev.visas },
      },
    },
  };
}

/** Guichets offerts à l'entrée dans l'acte : le guichet 3, ou dix avec Antériorité (Jurisprudence). */
export function guichetsOfferts(s: GameState): number {
  return aJurisprudence(s, 'anteriorite')
    ? REFORME.guichetsAnteriorite
    : BALANCE2.guichetsInitiaux;
}

/** Prix du prochain Guichet : les guichets offerts ne comptent pas. */
export function coutGuichet(
  possedes: number,
  offerts: number = BALANCE2.guichetsInitiaux,
): number {
  const g = BALANCE2.guichet;
  return Math.ceil(
    g.coutBase * Math.pow(g.croissance, Math.max(0, possedes - offerts)),
  );
}

export function acheterGuichet(s: GameState, maintenant: number): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).recrutementVisible) return s;
  const cout = coutGuichet(x.guichets, guichetsOfferts(s));
  if (s.budget < cout) return s;
  return {
    ...s,
    budget: s.budget - cout,
    acte2: { ...x, guichets: x.guichets + 1 },
  };
}

export function coutAgent2(id: Agent2Id, possedes: number): number {
  const def = AGENTS2.find((a) => a.id === id);
  if (!def) return Infinity;
  return Math.ceil(def.coutBase * Math.pow(def.croissance, possedes));
}

/** Visas/s gagnés en recrutant un agent de plus (palier d'ancienneté compris). */
export function gainAgent2(x: EtatActe2, id: Agent2Id): number {
  const def = AGENTS2.find((a) => a.id === id);
  if (!def) return 0;
  const n = x.agents[id];
  return (
    (n + 1) * def.vitesse * multiplicateurAnciennete(n + 1) -
    n * def.vitesse * multiplicateurAnciennete(n)
  );
}

export function peutAcheterAgent2(
  s: GameState,
  id: Agent2Id,
  maintenant: number,
): boolean {
  const x = s.acte2;
  return (
    x !== null &&
    getModifiers2(s, maintenant).agentsDisponibles.includes(id) &&
    s.budget >= coutAgent2(id, x.agents[id])
  );
}

export function acheterAgent2(
  s: GameState,
  id: Agent2Id,
  maintenant: number,
): GameState {
  if (!peutAcheterAgent2(s, id, maintenant)) return s;
  const x = s.acte2 as EtatActe2;
  return {
    ...s,
    budget: s.budget - coutAgent2(id, x.agents[id]),
    acte2: { ...x, agents: { ...x.agents, [id]: x.agents[id] + 1 } },
  };
}

/** Prix d'une ramette à l'acte II : celui de l'acte I, Vide juridique compris. */
export function prixRamette2(s: GameState): number {
  return (
    Math.round(BALANCE.prixRamette * prixFormulairesJurisprudence(s) * 100) /
    100
  );
}

/** Achète `nb` ramettes (sinon le maximum possible). */
export function acheterRamettes2(s: GameState, nb: number): GameState {
  const prix = prixRamette2(s);
  const possibles = Math.min(nb, Math.floor(s.budget / prix));
  if (possibles <= 0) return s;
  return {
    ...s,
    budget: s.budget - possibles * prix,
    formulaires: s.formulaires + possibles * BALANCE.ramette,
    stats: {
      ...s.stats,
      formulairesAchetes:
        s.stats.formulairesAchetes + possibles * BALANCE.ramette,
    },
  };
}

/** En rupture et sans de quoi payer une ramette, le service en fournit une, gratuitement. */
export function requisitionUrgence2(s: GameState): GameState {
  const x = s.acte2;
  if (!x || s.formulaires >= x.exemplaires || s.budget >= prixRamette2(s))
    return s;
  return { ...s, formulaires: s.formulaires + BALANCE.ramette };
}

export function reglerTauxRejet2(
  s: GameState,
  taux: number,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x) return s;
  const m = getModifiers2(s, maintenant);
  const t = Math.max(0, Math.min(m.rejetMax, Math.round(taux * 100) / 100));
  return { ...s, acte2: { ...x, tauxRejet: t } };
}

export function reglerExemplaires(
  s: GameState,
  n: Exemplaires,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x || !getModifiers2(s, maintenant).exemplairesVisible) return s;
  return { ...s, acte2: { ...x, exemplaires: n } };
}

/** Modification d'une procédure dans l'Atelier (refusée tant que l'Atelier est fermé). */
export function modifierProcedure(
  s: GameState,
  action: ActionAtelier,
  maintenant: number,
): GameState {
  const x = s.acte2;
  if (!x) return s;
  const m = getModifiers2(s, maintenant);
  if (!m.atelierVisible) return s;
  const x2 = appliquerAction(x, action, m.etapesDisponibles, m.procsOuvertes);
  return x2 === x ? s : { ...s, acte2: x2 };
}

/** Simule une absence (Guichets et agents seuls, sans rejet), par pas d'une seconde, plafonnée. */
export function simulerAbsence2(
  s0: GameState,
  maintenant: number,
): { s: GameState; secondes: number; franchies: number; budget: number } {
  const secondes = Math.min(
    BALANCE.horsLigneMax,
    Math.max(0, Math.floor((maintenant - s0.derniereMaj) / 1000)),
  );
  let s = s0;
  let franchies = 0;
  let budget = 0;
  const debut = maintenant - secondes * 1000;
  for (let i = 1; i <= secondes; i++) {
    const r = tick2(s, 1, debut + i * 1000, false);
    s = r.s;
    franchies += r.ev.franchies;
    budget += r.ev.budget;
  }
  return { s: { ...s, derniereMaj: maintenant }, secondes, franchies, budget };
}
