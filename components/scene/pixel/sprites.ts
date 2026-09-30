/**
 * Sprites générés : usagers (une silhouette, trois tailles, trois carrures,
 * six coiffures, accessoires), l'agent du guichet 3 et son tampon.
 */
import { BAS, CASQUETTES, CHEVEUX, GRIS, HAUTS, PEAUX, PX } from '@/constants/PalettePixel';
import { Grille, hache, melange, rampe, type Image } from './toile';

type Coiffure = 'court' | 'long' | 'chignon' | 'boucles' | 'casquette' | 'raie' | 'chauve';
const COIFFURES: Coiffure[] = ['court', 'long', 'chignon', 'boucles', 'casquette', 'raie'];

export interface SpecUsager {
  numero: number;
  taille: number;
  carrure: number;
  peau: string[];
  cheveux: string[];
  coiffure: Coiffure;
  haut: string[];
  bas: string[];
  casquette: string[];
  jupe: boolean;
  lunettes: boolean;
  sac: boolean;
  age: boolean;
}

/** Apparence déterministe d'un usager à partir de son numéro. */
export function specUsager(numero: number): SpecUsager {
  const r = (s: number) => hache(numero, s);
  const age = r(17) % 7 === 0;
  return {
    numero,
    taille: r(11) % 3,
    carrure: r(12) % 3,
    peau: PEAUX[r(8) % PEAUX.length],
    cheveux: age ? CHEVEUX[4] : CHEVEUX[r(7) % CHEVEUX.length],
    coiffure: age ? (r(13) % 2 ? 'chauve' : 'chignon') : COIFFURES[r(13) % COIFFURES.length],
    haut: rampe(HAUTS[r(19) % HAUTS.length]),
    bas: rampe(BAS[r(9) % BAS.length]),
    casquette: rampe(CASQUETTES[r(18) % CASQUETTES.length]),
    jupe: r(14) % 4 === 0,
    lunettes: age || r(15) % 5 === 0,
    sac: r(16) % 5 === 0,
    age,
  };
}

export interface PoseUsager {
  /** Phase de marche 0..3, ou −1 à l'arrêt. */
  pas: number;
  /** « tient » : chemise cartonnée contre soi ; « vide » : mains posées sur le comptoir. */
  bras: 'tient' | 'vide';
  /** Usager rejeté : visage rouge et sourcils froncés. */
  fache: boolean;
  numerote: boolean;
}

/** Hauteur du haut de la tête au-dessus des pieds (px). */
export const hautTete = (spec: SpecUsager, pieds: number) => pieds - 28 - 2 * spec.taille;

const MASQUE_TETE = ['..11111..', '.1111111.', '111111111', '111111111', '1111111111', '111111111', '.11111111', '..111111.', '...1111..'];
const cache = new Map<string, Image>();

function coiffer(g: Grille, s: SpecUsager, hx: number, hy: number, c: string[], peau: string[], gris: boolean) {
  const put = (i: number, j: number, col: string) => g.set(hx + i, hy + j, col);
  if (s.coiffure === 'chauve') {
    for (let j = 3; j <= 6; j++) for (let i = 0; i <= 2; i++) if (!(j === 6 && i === 0)) put(i, j, j === 3 ? c[1] : c[2]);
    put(3, 0, peau[0]); put(4, 0, peau[0]); put(2, 1, peau[0]);
    return;
  }
  for (let i = 2; i <= 6; i++) put(i, 0, i === 3 || i === 4 ? c[0] : c[1]);
  for (let i = 1; i <= 7; i++) put(i, 1, i <= 2 ? c[2] : i === 5 ? c[0] : c[1]);
  for (let i = 0; i <= 5; i++) put(i, 2, i <= 1 ? c[2] : c[1]);
  for (let j = 3; j <= 5; j++) for (let i = 0; i <= (j === 3 ? 3 : 2); i++) put(i, j, i === 0 ? c[3] : c[2]);
  put(1, 6, c[3]); put(2, 6, c[2]);
  if (s.coiffure === 'raie') { put(6, 2, c[1]); put(7, 2, c[2]); put(3, 0, c[2]); put(4, 1, c[0]); }
  if (s.coiffure === 'long') {
    for (let j = 2; j <= 12; j++) for (let i = -1; i <= 2; i++) if (!(j === 12 && i === 2)) put(i, j, i === -1 ? c[3] : i === 0 ? c[2] : c[1]);
  }
  if (s.coiffure === 'chignon') {
    [[0, -2], [1, -2], [-1, -1], [0, -1], [1, -1], [2, -1], [-1, 0], [0, 0], [1, 0]].forEach(([i, j]) => put(i, j, j === -2 ? c[0] : c[1]));
  }
  if (s.coiffure === 'boucles') {
    for (let i = 1; i <= 7; i++) put(i, -1, i % 2 ? c[1] : c[0]);
    for (let j = 0; j <= 7; j++) put(-1, j, j % 2 ? c[2] : c[3]);
    put(0, 0, c[1]); put(1, 0, c[0]); put(7, 0, c[1]); put(8, 1, c[2]); put(0, 7, c[3]);
  }
  if (s.coiffure === 'casquette' && !gris) {
    const k = s.casquette;
    for (let i = 1; i <= 7; i++) put(i, -1, i <= 2 ? k[2] : k[1]);
    for (let i = 0; i <= 8; i++) put(i, 0, i <= 1 ? k[2] : i === 4 ? k[0] : k[1]);
    for (let i = 1; i <= 8; i++) put(i, 1, i <= 2 ? k[3] : k[2]);
    for (let i = 6; i <= 10; i++) put(i, 2, i === 10 ? k[3] : k[2]);
  }
}

/** Usager de profil, tourné vers la droite ; pieds en (10, 37) dans une image de 22 × 40. */
export function spriteUsager(spec: SpecUsager, pose: PoseUsager): Image {
  const cle = `${spec.numero}|${pose.pas}|${pose.bras}|${pose.fache ? 1 : 0}|${pose.numerote ? 1 : 0}`;
  const deja = cache.get(cle);
  if (deja) return deja;
  if (cache.size > 600) cache.clear();
  const g = new Grille(22, 40);
  const gris = pose.numerote;
  const peau = gris ? GRIS.peau : spec.peau, chev = gris ? GRIS.cheveux : spec.cheveux;
  const haut = gris ? GRIS.haut : spec.haut, bas = gris ? GRIS.bas : spec.bas;
  const cx = 10, sol = 37;
  const L = 8 + spec.taille, T = 9 + spec.taille, bw = 7 + spec.carrure;
  const hanche = sol - 2 - L, epaule = hanche - T + 1, tete = epaule - 10;
  const pas = pose.pas;
  const dxP = pas < 0 ? 1 : [3, 0, -3, 0][pas], dxL = pas < 0 ? -1 : [-3, 0, 3, 0][pas];
  const jambe = (hx: number, dx: number, leve: number, col: string[]) => {
    const fin = sol - 2 - leve;
    for (let y = hanche + 1; y <= fin; y++) {
      const x = hx + Math.round((dx * (y - hanche)) / (fin + 1 - hanche));
      g.set(x - 1, y, col[0]); g.set(x, y, col[1]); g.set(x + 1, y, col[2]);
    }
    const fx = hx + dx, fy = sol - 1 - leve;
    for (let i = -1; i <= 2; i++) { g.set(fx + i, fy, PX.chaussures[0]); g.set(fx + i, fy + 1, PX.chaussures[1]); }
  };
  jambe(cx - 1, dxL, pas === 1 ? 1 : 0, [bas[2], bas[2], bas[3]]);
  jambe(cx, dxP, pas === 3 ? 1 : 0, [bas[0], bas[1], bas[1]]);
  const x0 = cx - Math.floor(bw / 2), x1 = x0 + bw - 1;
  if (spec.jupe) {
    const fin = hanche + Math.floor(L * 0.6);
    for (let y = hanche - 1; y <= fin; y++) {
      const e = Math.floor((y - hanche + 1) / 2);
      for (let x = x0 - e; x <= x1 + e; x++) g.set(x, y, x <= x0 - e + 1 ? bas[0] : x >= x1 + e - 1 || y === fin ? bas[2] : bas[1]);
    }
  }
  if (spec.sac && !gris) {
    const s = rampe(PX.sac);
    for (let y = epaule + 1; y <= hanche - 5; y++) g.set(x0 - 1, y, s[3]);
    for (let y = hanche - 4; y <= hanche - 1; y++) for (let x = x0 - 4; x <= x0 - 1; x++) g.set(x, y, x === x0 - 4 ? s[0] : y === hanche - 1 ? s[2] : s[1]);
  }
  for (let y = epaule; y <= hanche; y++) for (let x = x0; x <= x1; x++) {
    if (y === epaule && (x === x0 || x === x1)) continue;
    g.set(x, y, y === hanche ? haut[2] : x <= x0 + 1 ? haut[0] : x >= x1 - 1 ? haut[2] : haut[1]);
  }
  if (!spec.jupe) for (let x = x0; x <= x1; x++) g.set(x, hanche, bas[3]);
  g.set(x1 - 2, epaule, peau[2]); g.set(x1 - 1, epaule, peau[1]);
  g.set(cx, epaule - 1, peau[2]); g.set(cx + 1, epaule - 1, peau[1]);
  // Tête de profil
  const hx = cx - 4 + (spec.age ? 1 : 0), hy = tete;
  const fache = pose.fache && !gris;
  MASQUE_TETE.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch !== '1') return;
    let col = j >= 7 || i <= 1 ? peau[2] : peau[1];
    if (i === 5 && j <= 2) col = peau[0];
    if (fache && i >= 3) col = melange(col, PX.colere, 0.32);
    g.set(hx + i, hy + j, col);
  }));
  g.set(hx + 8, hy + 5, peau[2]);
  if (!gris) {
    g.set(hx + 6, hy + 5, melange(peau[1], PX.joue, fache ? 0.6 : 0.35));
    g.set(hx + 6, hy + 4, PX.contour);
    if (fache) {
      g.set(hx + 7, hy + 7, PX.bouche); g.set(hx + 8, hy + 6, PX.bouche); g.set(hx + 8, hy + 7, PX.contour);
      g.set(hx + 5, hy + 3, chev[3]); g.set(hx + 6, hy + 3, chev[3]); g.set(hx + 7, hy + 2, chev[3]);
    } else {
      g.set(hx + 7, hy + 6, PX.bouche); g.set(hx + 8, hy + 6, PX.bouche);
    }
  }
  coiffer(g, spec, hx, hy, chev, peau, gris);
  if (spec.coiffure !== 'long') { g.set(hx + 3, hy + 4, peau[2]); g.set(hx + 3, hy + 5, peau[3]); }
  if (spec.lunettes && !gris) [[4, 4], [5, 3], [6, 3], [7, 3], [5, 4], [7, 4], [5, 5], [6, 5], [7, 5]].forEach(([i, j]) => g.set(hx + i, hy + j, PX.monture));
  // Bras : contre soi, avec la chemise cartonnée (ou le ticket), ou posé sur le comptoir
  const bras = (x: number, y: number) => { g.set(x - 1, y, haut[3]); g.set(x, y, haut[0]); g.set(x + 1, y, haut[1]); };
  for (let y = epaule + 1; y <= epaule + 4; y++) bras(cx, y);
  for (let x = cx; x <= cx + 4; x++) { g.set(x, epaule + 5, haut[0]); g.set(x, epaule + 6, haut[1]); g.set(x, epaule + 7, haut[3]); }
  if (pose.bras === 'tient') {
    if (gris) {
      g.rect(cx + 5, epaule + 1, 3, 5, PX.blanc);
      g.set(cx + 6, epaule + 2, PX.rouge); g.set(cx + 6, epaule + 3, PX.rouge);
    } else {
      const cc = PX.chemiseCartonnee;
      for (let y = epaule + 1; y <= epaule + 10; y++) { g.set(cx + 5, y, cc[2]); g.set(cx + 6, y, cc[1]); g.set(cx + 7, y, cc[0]); }
      g.set(cx + 7, epaule + 1, PX.blanc); g.set(cx + 7, epaule + 2, PX.blanc);
    }
  }
  g.set(cx + 5, epaule + 5, peau[1]); g.set(cx + 6, epaule + 5, peau[1]); g.set(cx + 5, epaule + 6, peau[2]); g.set(cx + 6, epaule + 6, peau[2]);
  if (spec.age && !gris) { for (let y = hanche - 3; y <= sol; y++) g.set(cx + 6, y, PX.canne); g.set(cx + 5, hanche - 3, PX.canne); }
  const img = g.image();
  cache.set(cle, img);
  return img;
}

export type VarianteAgent = 'normal' | 'cligne' | 'effort' | 'regard';

/** L'agent du guichet 3, de face, derrière sa vitre ; image de 32 × 40. */
export function spriteAgent(v: VarianteAgent): Image {
  const cle = 'agent|' + v;
  const deja = cache.get(cle);
  if (deja) return deja;
  const g = new Grille(32, 40);
  const pc = PX.peauAgent, ch = PX.cheveuxAgent, sh = PX.chemise, ca = PX.chaise;
  for (let y = 12; y <= 39; y++) for (let x = 3; x <= 28; x++) {
    if ((y === 12 && (x < 6 || x > 25)) || (y === 13 && (x < 4 || x > 27))) continue;
    g.set(x, y, y <= 13 ? ca[0] : x <= 4 ? ca[1] : x >= 27 ? ca[3] : ca[2]);
  }
  for (let y = 17; y <= 39; y++) for (let x = 5; x <= 26; x++) {
    if ((y === 17 && (x < 9 || x > 22)) || (y === 18 && (x < 7 || x > 24))) continue;
    g.set(x, y, (y === 17 && x < 20) || x <= 7 ? sh[0] : x >= 23 ? sh[2] : sh[1]);
  }
  for (let y = 24; y <= 39; y++) g.set(11, y, sh[2]);
  for (let y = 19; y <= 28; y++) for (let x = 23; x <= 26; x++) g.set(x, y, x === 23 ? sh[3] : sh[2]);
  for (let y = 25; y <= 28; y++) for (let x = 21; x <= 26; x++) g.set(x, y, y === 25 ? sh[1] : y === 28 ? sh[3] : sh[2]);
  g.rect(19, 25, 2, 3, pc[1]); g.set(19, 27, pc[2]);
  for (let x = 6; x <= 10; x++) g.set(x, 23, sh[3]);
  g.set(7, 21, PX.bleu); g.set(7, 22, PX.bleu); g.set(9, 21, PX.rouge); g.set(9, 22, PX.rouge);
  g.rect(18, 20, 4, 3, PX.blanc); g.set(18, 20, PX.bleu); g.set(19, 20, PX.bleu); g.set(19, 22, PX.gris); g.set(20, 22, PX.gris);
  for (let y = 14; y <= 17; y++) for (let x = 13; x <= 19; x++) g.set(x, y, y >= 16 ? pc[3] : pc[2]);
  for (let y = 0; y <= 16; y++) for (let x = 7; x <= 25; x++) {
    const nx = (x - 16) / 7.6, ny = (y - 8.5) / 7.6;
    if (nx * nx + ny * ny > 1) continue;
    let col: string = pc[1];
    if (x <= 10 && y <= 11) col = pc[0];
    if (x >= 22 || (y >= 14 && x >= 14)) col = pc[2];
    g.set(x, y, col);
    const cheveu = y <= 3 || (y === 4 && x >= 9) || (y === 5 && x >= 14 && x <= 21) || (x <= 9 && y <= 7) || (x >= 22 && y <= 7);
    if (cheveu) g.set(x, y, y <= 2 && x >= 10 && x <= 14 ? ch[0] : x >= 20 ? ch[2] : ch[1]);
  }
  [[10, 5], [11, 5], [12, 5], [11, 6]].forEach(([x, y]) => g.set(x, y, ch[1]));
  g.set(17, 1, ch[3]); g.set(17, 2, ch[3]); g.set(18, 3, ch[3]);
  g.set(24, 8, pc[1]); g.set(24, 9, pc[2]); g.set(24, 10, pc[1]); g.set(23, 9, pc[3]);
  const yeux = {
    normal: [[12, 8], [12, 9], [18, 8], [18, 9]],
    cligne: [[11, 9], [12, 9], [13, 9], [17, 9], [18, 9], [19, 9]],
    effort: [[11, 8], [12, 9], [11, 10], [19, 8], [18, 9], [19, 10]],
    regard: [[13, 7], [13, 8], [19, 7], [19, 8]],
  }[v];
  yeux.forEach(([x, y]) => g.set(x, y, PX.contour));
  (v === 'effort' ? [[12, 6], [13, 7], [18, 6], [17, 7]] : [[12, 6], [13, 6], [17, 6], [18, 6]]).forEach(([x, y]) => g.set(x, y, ch[2]));
  const joue = melange(pc[1], PX.joue, 0.45);
  [[10, 11], [11, 11], [19, 11], [20, 11]].forEach(([x, y]) => g.set(x, y, joue));
  g.set(15, 10, pc[2]); g.set(15, 11, pc[3]);
  if (v === 'effort') {
    [[14, 12], [15, 12], [16, 12]].forEach(([x, y]) => g.set(x, y, PX.contour));
    [[14, 13], [15, 13], [16, 13]].forEach(([x, y]) => g.set(x, y, PX.boucheOuverte));
  } else {
    [[13, 12], [14, 13], [15, 13], [16, 13], [17, 12]].forEach(([x, y]) => g.set(x, y, PX.boucheAgent));
  }
  [[12, 17], [13, 18], [14, 18], [20, 17], [19, 18], [18, 18]].forEach(([x, y]) => g.set(x, y, PX.blanc));
  for (let x = 15; x <= 17; x++) { g.set(x, 17, PX.encre); g.set(x, 18, x === 15 ? PX.encreClaire : PX.encre); }
  for (let y = 19; y <= 33; y++) {
    (y <= 20 ? [16] : [15, 16, 17]).forEach((x) => g.set(x, y, x === 15 ? PX.encreClaire : x === 17 ? PX.encreOmbre : (y - 19) % 4 === 0 ? PX.encreOmbre : PX.encre));
  }
  const img = g.image();
  cache.set(cle, img);
  return img;
}

/** Tampon ; la semelle occupe les lignes 10 à 12 d'une image de 11 × 15. */
export function spriteTampon(ecrase: boolean): Image {
  const cle = 'tampon|' + ecrase;
  const deja = cache.get(cle);
  if (deja) return deja;
  const g = new Grille(11, 15);
  const d = ecrase ? 1 : 0;
  [[4, 1], [5, 1], [6, 1], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [4, 4], [5, 4], [6, 4]]
    .forEach(([x, y]) => g.set(x, y + d, x <= 4 && y <= 2 ? PX.pommeau[0] : x >= 7 || y === 4 ? PX.pommeau[2] : PX.pommeau[1]));
  for (let y = 5 + d; y <= 9; y++) { g.set(4, y, PX.manche[0]); g.set(5, y, PX.manche[1]); g.set(6, y, PX.manche[2]); }
  if (!ecrase) for (let x = 2; x <= 8; x++) { g.set(x, 10, PX.encreClaire); g.set(x, 11, PX.encre); g.set(x, 12, PX.semelle); }
  else for (let x = 1; x <= 9; x++) { g.set(x, 11, PX.encre); g.set(x, 12, PX.semelle); }
  const img = g.image();
  cache.set(cle, img);
  return img;
}
