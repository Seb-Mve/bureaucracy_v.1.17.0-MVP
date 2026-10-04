/**
 * Procédures de l'acte II : graphe des exigences, détection des boucles, actions de l'Atelier.
 * Une boucle n'est jamais nommée au joueur : elle naît de ses propres exigences.
 */
import type {
  ActionAtelier,
  Etape,
  EtapeType,
  EtatActe2,
  ProcId,
} from '../../types/acte2';
import { BALANCE2, PROCS_DEMANDEES } from '../../constants/balanceActe2';

/** Procédures exigées par `p` (étapes « Pièce délivrée par nos services »). */
export function exigences(
  procedures: Record<ProcId, Etape[]>,
  p: ProcId,
): ProcId[] {
  const r: ProcId[] = [];
  for (const e of procedures[p])
    if (e.type === 'pieceService' && e.exige !== undefined) r.push(e.exige);
  return r;
}

/** Vrai si l'on va de `depart` à `cible` en suivant les exigences, par des procédures ouvertes. */
export function mene(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  depart: ProcId,
  cible: ProcId,
): boolean {
  const vues = new Set<ProcId>();
  const pile: ProcId[] = [depart];
  while (pile.length > 0) {
    const p = pile.pop() as ProcId;
    for (const suivante of exigences(procedures, p)) {
      if (!ouvertes.includes(suivante)) continue;
      if (suivante === cible) return true;
      if (!vues.has(suivante)) {
        vues.add(suivante);
        pile.push(suivante);
      }
    }
  }
  return false;
}

/** Un dossier de `p` qui exige une pièce de `exige` part en boucle si `exige` ramène à `p`. */
export function estBoucle(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  p: ProcId,
  exige: ProcId,
): boolean {
  return mene(procedures, ouvertes, exige, p);
}

/** Procédures prises dans au moins une boucle. */
export function procsEnBoucle(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
): ProcId[] {
  return ouvertes.filter((p) => mene(procedures, ouvertes, p, p));
}

/**
 * Vrai si la procédure `p` peut mener un dossier d'usager jusqu'à la délivrance : aucune de ses pièces de
 * service n'exige une procédure qui y ramène (sinon l'usager est renvoyé chez lui en chemin).
 */
export function procedureAboutit(
  procedures: Record<ProcId, Etape[]>,
  ouvertes: ProcId[],
  p: ProcId,
): boolean {
  return procedures[p].every(
    (e) =>
      e.type !== 'pieceService' ||
      e.exige === undefined ||
      !ouvertes.includes(e.exige) ||
      !estBoucle(procedures, ouvertes, p, e.exige),
  );
}

/** Vrai si une procédure que les usagers demandent peut encore leur délivrer son document. */
export function aboutitPourUsagers(x: EtatActe2, ouvertes: ProcId[]): boolean {
  return PROCS_DEMANDEES.some(
    (p) => ouvertes.includes(p) && procedureAboutit(x.procedures, ouvertes, p),
  );
}

const exigenceValide = (
  p: ProcId,
  exige: ProcId | undefined,
  ouvertes: ProcId[],
): exige is ProcId =>
  exige !== undefined && exige !== p && ouvertes.includes(exige);

/**
 * Applique une modification de l'Atelier. Les dossiers engagés restent à leur rang ;
 * ceux d'une étape retirée passent à celle qui prend sa place (ou à la dernière).
 * Renvoie `x` inchangé (même objet) si l'action est refusée.
 */
export function appliquerAction(
  x: EtatActe2,
  a: ActionAtelier,
  disponibles: EtapeType[],
  ouvertes: ProcId[],
): EtatActe2 {
  if (!ouvertes.includes(a.p)) return x;
  const etapes = [...x.procedures[a.p]];
  const u = [...x.usagers[a.p]];
  const b = [...x.boucles[a.p]];
  const c = [...x.suites[a.p]];
  switch (a.type) {
    case 'ajouter': {
      if (!disponibles.includes(a.etape) || etapes.length >= BALANCE2.etapesMax)
        return x;
      if (a.etape === 'pieceService') {
        if (!exigenceValide(a.p, a.exige, ouvertes)) return x;
        etapes.push({ type: 'pieceService', exige: a.exige });
      } else {
        etapes.push({ type: a.etape });
      }
      u.push(0);
      b.push(0);
      c.push(0);
      break;
    }
    case 'retirer': {
      if (etapes.length <= 1 || a.k < 0 || a.k >= etapes.length) return x;
      etapes.splice(a.k, 1);
      const [ru] = u.splice(a.k, 1);
      const [rb] = b.splice(a.k, 1);
      const [rc] = c.splice(a.k, 1);
      const cible = Math.min(a.k, etapes.length - 1);
      u[cible] += ru;
      b[cible] += rb;
      c[cible] += rc;
      break;
    }
    case 'deplacer': {
      const j = a.k + a.sens;
      if (a.k < 0 || a.k >= etapes.length || j < 0 || j >= etapes.length)
        return x;
      [etapes[a.k], etapes[j]] = [etapes[j], etapes[a.k]];
      break;
    }
    case 'exiger': {
      const e = etapes[a.k];
      if (
        !e ||
        e.type !== 'pieceService' ||
        !exigenceValide(a.p, a.exige, ouvertes)
      )
        return x;
      etapes[a.k] = { type: 'pieceService', exige: a.exige };
      break;
    }
  }
  return {
    ...x,
    procedures: { ...x.procedures, [a.p]: etapes },
    usagers: { ...x.usagers, [a.p]: u },
    boucles: { ...x.boucles, [a.p]: b },
    suites: { ...x.suites, [a.p]: c },
    premiereModif: x.premiereModif ?? a.p,
  };
}
