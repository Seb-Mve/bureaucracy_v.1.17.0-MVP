/**
 * Toile de pixels en mémoire : la scène y est dessinée à sa résolution
 * d'origine (176 × 112 environ), puis affichée agrandie sans lissage.
 * Aucune dépendance à React ni à la plateforme.
 */
import { PX, TEINTE_CLAIRE, TEINTE_NOIRE, TEINTE_OMBRE } from '@/constants/PalettePixel';

/** Couleur RGBA empaquetée dans l'ordre des octets d'une ImageData (0xAABBGGRR). */
export type Couleur = number;

const cache = new Map<string, Couleur>();
/** Couleur « #RRGGBB » avec une opacité (0..1). */
export function couleur(hex: string, alpha = 1): Couleur {
  const cle = hex + alpha;
  let c = cache.get(cle);
  if (c === undefined) {
    const n = parseInt(hex.slice(1), 16);
    c = ((Math.round(alpha * 255) << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
    cache.set(cle, c);
  }
  return c;
}
/** Mélange de deux couleurs hexadécimales. */
export function melange(a: string, b: string, t: number): string {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const canal = (d: number) => Math.round(((A >> d) & 255) + (((B >> d) & 255) - ((A >> d) & 255)) * t);
  return '#' + ((canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).padStart(6, '0');
}
/** Rampe clair → foncé à partir d'une teinte de base. */
export function rampe(c: string): string[] {
  return [melange(c, TEINTE_CLAIRE, 0.45), c, melange(c, TEINTE_OMBRE, 0.3), melange(c, TEINTE_NOIRE, 0.55)];
}
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/** Tramage ordonné : vrai si le pixel (x, y) tombe sous le seuil t (0..1). */
export const trame = (x: number, y: number, t: number) => (BAYER[y & 3][x & 3] + 0.5) / 16 < t;
/** Lissage « smoothstep » borné à [0, 1]. */
export const adoucir = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
/** Hachage entier stable (variété des sprites, grain du liège). */
export function hache(n: number, sel: number): number {
  let x = (Math.imul(n, 2654435761) + sel * 40503) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** Image de pixels ; (ox, oy) décale le repère du monde vers la toile. */
export class Toile {
  readonly px: Uint32Array;
  readonly octets: Uint8Array;
  readonly w: number;
  readonly h: number;
  ox = 0;
  oy = 0;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint32Array(w * h);
    this.octets = new Uint8Array(this.px.buffer);
  }

  /** Pose un pixel en coordonnées du monde, avec mélange si la couleur est translucide. */
  point(x: number, y: number, c: Couleur) {
    const X = Math.round(x) - this.ox, Y = Math.round(y) - this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return;
    const a = c >>> 24;
    if (a === 0) return;
    const i = Y * this.w + X;
    if (a === 255) { this.px[i] = c; return; }
    // Opérateur « par-dessus » : un calque translucide le reste tant qu'il n'est pas posé sur la scène.
    const d = this.px[i], k = a / 255, kd = ((d >>> 24) / 255) * (1 - k), ka = k + kd;
    const m = (s: number) => Math.round((((c >>> s) & 255) * k + ((d >>> s) & 255) * kd) / ka) << s;
    this.px[i] = ((Math.round(ka * 255) << 24) | m(16) | m(8) | m(0)) >>> 0;
  }
  rect(x: number, y: number, w: number, h: number, c: Couleur) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.point(x + i, y + j, c);
  }
  /** Rectangle cerné de 1 px anthracite, à la manière de la charte. */
  boite(x: number, y: number, w: number, h: number, fond: string) {
    this.rect(x - 1, y - 1, w + 2, h + 2, couleur(PX.contour));
    this.rect(x, y, w, h, couleur(fond));
  }
  /** Trait épais (pinceau carré). */
  trait(x0: number, y0: number, x1: number, y1: number, c: Couleur, taille = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), d = Math.floor(taille / 2);
    for (let i = 0; i <= n; i++) this.rect(Math.round(x0 + ((x1 - x0) * i) / n) - d, Math.round(y0 + ((y1 - y0) * i) / n) - d, taille, taille, c);
  }
  /** Copie une image (sprite ou calque) ; les pixels transparents sont ignorés. */
  copier(src: Image, x: number, y: number, miroir = false) {
    const X0 = Math.round(x) - this.ox, Y0 = Math.round(y) - this.oy;
    for (let j = 0; j < src.h; j++) {
      const Y = Y0 + j;
      if (Y < 0 || Y >= this.h) continue;
      for (let i = 0; i < src.w; i++) {
        const c = src.px[j * src.w + (miroir ? src.w - 1 - i : i)];
        if (c >>> 24 === 0) continue;
        const X = X0 + i;
        if (X < 0 || X >= this.w) continue;
        if (c >>> 24 === 255) this.px[Y * this.w + X] = c;
        else this.point(X + this.ox, Y + this.oy, c);
      }
    }
  }
}

/** Image autonome (sprite ou calque rogné). */
export interface Image {
  w: number;
  h: number;
  px: Uint32Array;
}

/** Grille de dessin : on remplit des pixels, le contour anthracite est ajouté à la fin. */
export class Grille {
  private c: (string | null)[];
  readonly w: number;
  readonly h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.c = new Array(w * h).fill(null);
  }
  set(x: number, y: number, col: string | null | undefined) {
    if (col && x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = col;
  }
  get(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : null;
  }
  rect(x: number, y: number, w: number, h: number, col: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col);
  }
  image(): Image {
    const px = new Uint32Array(this.w * this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      let col = this.get(x, y);
      if (!col && (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))) col = PX.contour;
      if (col) px[y * this.w + x] = couleur(col);
    }
    return { w: this.w, h: this.h, px };
  }
}

/** Police 3 × 5 pour la plaque, l'afficheur et le « +1 ». */
const FONTE: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '011', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'], '+': ['000', '010', '111', '010', '000'], A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'], G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], L: ['100', '100', '100', '100', '111'],
  T: ['111', '010', '010', '010', '010'], K: ['101', '110', '100', '110', '101'], U: ['101', '101', '101', '101', '111'], ' ': ['000', '000', '000', '000', '000'],
};
export function texte(t: Toile, s: string, x: number, y: number, col: Couleur, ombre?: Couleur) {
  [...s].forEach((ch, i) => {
    const g = FONTE[ch];
    if (!g) return;
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) {
      if (g[r][k] !== '1') continue;
      if (ombre !== undefined) t.point(x + i * 4 + k + 1, y + r + 1, ombre);
      t.point(x + i * 4 + k, y + r, col);
    }
  });
}
/** Texte cerné d'anthracite (lisible sur tous les fonds). */
export function texteDetoure(t: Toile, s: string, x: number, y: number, col: Couleur) {
  const k = couleur(PX.contour);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) texte(t, s, x + dx, y + dy, k);
  texte(t, s, x, y, col);
}
