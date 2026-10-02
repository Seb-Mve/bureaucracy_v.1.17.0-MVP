/**
 * Décor fixe du guichet, peint une fois par taille d'écran en calques :
 * fond (mur, fenêtre, liège, horloge, ficus, sol), façade (vitre, plaque),
 * comptoir et potelets (au premier plan).
 * Repère du monde : 176 × 112, comptoir à droite, file vers la gauche.
 */
import { PX } from '@/constants/PalettePixel';
import {
  Grille,
  Toile,
  couleur as c,
  hache,
  melange,
  texte,
  trame,
} from './toile';

/** Toile d'un calque couvrant la zone du monde [x0, x0 + w[ × [y0, y0 + h[. */
export function calque(x0: number, y0: number, w: number, h: number): Toile {
  const t = new Toile(Math.max(1, w), Math.max(1, h));
  t.ox = x0;
  t.oy = y0;
  return t;
}

function couleurFond(x: number, y: number, plafond: number): string {
  if (y < plafond + 3) return y === plafond + 2 ? PX.mur[3] : PX.plafond;
  if (y === plafond + 3) return PX.bois[3];
  if (y < 68)
    return y < plafond + 6 || y === 66 || y === 67 ? PX.mur[2] : PX.mur[1];
  if (y === 68) return PX.bois[2];
  if (y === 69) return PX.bois[3];
  if (y < 84) {
    if (y === 70) return PX.sauge[0];
    if (y === 83) return PX.sauge[2];
    const m = ((x % 14) + 14) % 14;
    return m === 0 ? PX.sauge[3] : m === 1 ? PX.sauge[0] : PX.sauge[1];
  }
  if (y === 84) return PX.bois[3];
  if (y === 85) return PX.bois[4];
  // Sol carrelé en perspective, traversé par un rai de soleil
  const d = y - 60,
    u = ((x - 90) * 26) / d,
    v = 520 / d;
  const fu = ((u % 8) + 8) % 8,
    fv = ((v % 4) + 4) % 4;
  let col: string =
    (Math.floor(u / 8) + Math.floor(v / 4)) & 1 ? PX.sol[0] : PX.sol[1];
  if (fu < 20 / d || fv < 520 / (d * d)) col = PX.sol[2];
  const xs = 12 + (y - 86) * 0.8;
  if (
    x >= xs &&
    x < xs + 30 &&
    (Math.min(x - xs, xs + 30 - x) > 3 || trame(x, y, 0.5))
  )
    col = melange(col, PX.soleil, 0.5);
  if (y <= 87 && trame(x, y, 0.5)) col = PX.sol[3];
  return col;
}

function papier(
  t: Toile,
  x: number,
  y: number,
  w: number,
  h: number,
  fond: string,
  epingle: string,
) {
  t.rect(x + 1, y + 1, w, h, c(PX.bois[4], 0.25));
  t.rect(x, y, w, h, c(fond));
  for (let j = 2; j < h - 1; j += 2)
    t.rect(x + 1, y + j, w - 2 - (j % 4 ? 1 : 0), 1, c(PX.lignePapier));
  t.point(x + Math.floor(w / 2), y, c(epingle));
}

/** Mur, fenêtre, tableau de liège, cadran de l'horloge, ficus et sol. */
export function peindreFond(t: Toile, grandFormat: boolean) {
  const plafond = Math.min(0, t.oy);
  for (let y = t.oy; y < t.oy + t.h; y++)
    for (let x = t.ox; x < t.ox + t.w; x++)
      t.point(x, y, c(couleurFond(x, y, plafond)));
  // Boîtiers des néons
  (grandFormat ? [20, 112] : [20]).forEach((tx) => {
    t.rect(tx + 4, plafond + 3, 1, 2, c(PX.contour));
    t.rect(tx + 36, plafond + 3, 1, 2, c(PX.contour));
    t.boite(tx, plafond + 5, 41, 2, PX.boitierNeon);
  });
  // Le décor mural suit le bord gauche visible (la vue est rognée sur un téléphone).
  const decale = (dx: number, dy: number, dessin: () => void) => {
    t.ox -= dx;
    t.oy -= dy;
    dessin();
    t.ox += dx;
    t.oy += dy;
  };
  const fenetreX = Math.max(8, t.ox + 3) - 8;
  const signeBas = plafond <= -26 ? Math.min(-20, plafond + 30) + 9 : -99;
  const liege =
    fenetreX + 41 > 50
      ? { dx: fenetreX - 6, dy: Math.min(0, Math.max(-30, signeBas + 6 - 16)) }
      : { dx: 0, dy: 0 };
  decale(fenetreX, 0, () => {
    // Fenêtre à stores, immeubles au loin ; plus haute quand la scène a de la hauteur
    const fy = Math.max(plafond + 12, Math.min(14, plafond + 40));
    const fh = 51 - fy,
      stores = fy + 3 + Math.round((fh - 6) * 0.3);
    t.boite(8, fy, 33, fh, PX.bois[2]);
    for (let y = fy + 3; y <= 47; y++)
      for (let x = 11; x <= 37; x++) {
        const k = (y - fy - 3) / (47 - fy - 3);
        t.point(
          x,
          y,
          c(
            trame(x, y, k)
              ? trame(x, y, (k - 0.5) * 2)
                ? PX.ciel[0]
                : PX.ciel[1]
              : PX.ciel[2],
          ),
        );
      }
    [
      [11, 40, 6],
      [18, 37, 5],
      [24, 42, 4],
      [29, 35, 6],
      [35, 39, 3],
    ].forEach(([x, y, w]) => t.rect(x, y, w, 48 - y, c(PX.immeubles)));
    [
      [12, 42],
      [14, 44],
      [19, 39],
      [21, 41],
      [30, 37],
      [32, 40],
      [30, 43],
    ].forEach(([x, y]) => t.point(x, y, c(PX.ciel[0])));
    for (let y = fy + 3; y < stores; y++)
      t.rect(11, y, 27, 1, c(y % 2 ? PX.stores[0] : PX.stores[1]));
    t.rect(11, stores, 27, 1, c(PX.stores[2]));
    t.rect(35, stores + 1, 1, 5, c(PX.encre));
    t.rect(34, stores + 6, 3, 1, c(PX.encre));
    t.rect(24, fy + 3, 1, 45 - fy, c(PX.bois[3]));
    for (let y = 38; y > stores + 6; y -= 24)
      t.rect(11, y, 27, 1, c(PX.bois[3]));
    t.rect(8, fy, 33, 1, c(PX.bois[1]));
    t.rect(8, fy, 1, fh, c(PX.bois[1]));
    t.boite(6, 51, 37, 2, PX.bois[1]);
    t.rect(6, 52, 37, 1, c(PX.bois[3]));
    t.boite(31, 47, 4, 3, PX.terre[1]);
    t.rect(31, 47, 4, 1, c(PX.terre[0]));
    t.rect(31, 41, 4, 6, c(PX.contour));
    t.rect(29, 43, 3, 3, c(PX.contour));
    t.rect(34, 42, 3, 3, c(PX.contour));
    t.rect(32, 42, 2, 5, c(PX.feuillage[1]));
    t.point(30, 44, c(PX.feuillage[1]));
    t.point(35, 43, c(PX.feuillage[1]));
    t.rect(32, 42, 1, 4, c(PX.feuillage[0]));
  });
  decale(liege.dx, liege.dy, () => {
    // Tableau de liège et ses notes épinglées
    t.boite(50, 16, 31, 25, PX.bois[2]);
    for (let y = 18; y <= 38; y++)
      for (let x = 52; x <= 78; x++) {
        const k = hache(x * 131 + y, 3) % 7;
        t.point(
          x,
          y,
          c(k === 0 ? PX.liege[2] : k === 1 ? PX.liege[0] : PX.liege[1]),
        );
      }
    t.rect(50, 16, 31, 1, c(PX.bois[1]));
    papier(t, 54, 19, 8, 10, PX.papier[0], PX.rouge);
    papier(t, 64, 20, 6, 7, PX.postit[0], PX.bleu);
    papier(t, 72, 21, 6, 9, PX.postit[1], PX.rouge);
    papier(t, 57, 31, 11, 6, PX.papier[0], PX.vertEncre);
    t.rect(57, 31, 11, 1, c(PX.encre));
  });
  // Cadran de l'horloge (les aiguilles sont animées)
  for (let dy = -7; dy <= 7; dy++)
    for (let dx = -7; dx <= 7; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 6.5) continue;
      t.point(
        90 + dx,
        20 + dy,
        c(
          d > 5.6
            ? PX.contour
            : d > 4.7
              ? dx + dy < 0
                ? PX.sangle[0]
                : PX.sangle[2]
              : PX.horlogeCadran,
        ),
      );
    }
  [
    [90, 16],
    [90, 24],
    [86, 20],
    [94, 20],
  ].forEach(([x, y]) => t.point(x, y, c(PX.contour)));
  // Ficus
  const f = new Grille(30, 34);
  [
    [14, 12, 6],
    [8, 18, 5],
    [20, 17, 5],
    [12, 6, 4],
    [18, 8, 4],
    [6, 12, 3],
    [23, 12, 3],
  ].forEach(([bx, by, r]) => {
    for (let y = by - r; y <= by + r; y++)
      for (let x = bx - r; x <= bx + r; x++) {
        const dx = x - bx,
          dy = y - by;
        if (dx * dx + dy * dy > r * r + 1) continue;
        const k = hache(x * 37 + y * 11, 9) % 9;
        f.set(
          x,
          y,
          k === 0
            ? PX.feuillage[3]
            : dx + dy < -r * 0.4
              ? PX.feuillage[0]
              : dx + dy > r * 0.5
                ? PX.feuillage[2]
                : PX.feuillage[1],
        );
      }
  });
  t.rect(47, 62, 1, 16, c(PX.bois[3]));
  t.rect(46, 70, 1, 4, c(PX.bois[3]));
  t.copier(f.image(), 33, 44);
  t.boite(43, 78, 9, 7, PX.terre[1]);
  t.rect(43, 78, 9, 1, c(PX.terre[0]));
  t.rect(49, 79, 3, 6, c(PX.terre[2]));
  // Grands formats : panneau « ACCUEIL » suspendu et portrait officiel
  if (plafond <= -26) {
    const py = Math.min(-20, plafond + 30);
    t.rect(58, plafond + 3, 1, py - plafond - 3, c(PX.contour));
    t.rect(86, plafond + 3, 1, py - plafond - 3, c(PX.contour));
    t.boite(52, py, 41, 9, PX.papier[0]);
    t.rect(52, py, 41, 1, c(PX.encre));
    t.rect(52, py + 8, 41, 1, c(PX.encre));
    texte(t, 'ACCUEIL', 59, py + 2, c(PX.contour));
  }
  // Portrait officiel au-dessus du guichet, dès qu'il tient entre le plafond et l'enseigne.
  if (plafond <= -28) {
    const y = Math.round((plafond + 32) / 2) - 12;
    t.boite(118, y, 19, 22, PX.cadreDore[1]);
    t.rect(118, y, 19, 1, c(PX.cadreDore[0]));
    t.rect(120, y + 2, 15, 18, c(PX.bleu));
    t.rect(122, y + 14, 11, 6, c(PX.costume));
    t.rect(123, y + 13, 9, 1, c(PX.costume));
    t.rect(125, y + 6, 5, 6, c(PX.peauAgent[1]));
    t.rect(126, y + 12, 3, 1, c(PX.peauAgent[2]));
    t.rect(125, y + 5, 5, 2, c(PX.cheveux[1]));
    t.rect(124, y + 6, 1, 3, c(PX.cheveux[1]));
    t.rect(130, y + 6, 1, 3, c(PX.cheveux[1]));
    t.point(126, y + 8, c(PX.contour));
    t.point(128, y + 8, c(PX.contour));
    [PX.drapeau[0], PX.blanc, PX.drapeau[1]].forEach((col, k) => {
      for (let i = 0; i < 5; i++) t.point(123 + i + k, y + 14 + i, c(col));
    });
    t.boite(122, y + 23, 11, 2, PX.cadreDore[1]);
  }
}

/** Vitre (teinte, reflets, hygiaphone), montant et plaque « GUICHET 3 ». */
export function peindreFacade(t: Toile) {
  t.rect(105, 42, 80, 31, c(PX.vitre, 0.16));
  const reflet = c(PX.blanc, 0.4);
  for (let k = 0; k <= 30; k++) {
    t.rect(Math.round(136 - k * 0.5), 42 + k, 2, 1, reflet);
    t.rect(Math.round(148 - k * 0.5), 42 + k, 1, 1, reflet);
  }
  t.rect(105, 42, 80, 1, c(PX.blanc, 0.6));
  t.rect(105, 72, 80, 1, c(PX.basVitre));
  for (let dy = -5; dy <= 5; dy++)
    for (let dx = -5; dx <= 5; dx++) {
      const d = Math.hypot(dx, dy);
      if (d <= 4.6 && d > 3.4)
        t.point(
          116 + dx,
          60 + dy,
          c(dx + dy < 0 ? PX.chrome[0] : PX.chrome[2]),
        );
      else if (d > 4.6 && d <= 5.3) t.point(116 + dx, 60 + dy, c(PX.chrome[3]));
      else if (d < 3 && !(dx & 1) && !(dy & 1))
        t.point(116 + dx, 60 + dy, c(PX.contour, 0.55));
    }
  t.rect(101, 32, 5, 45, c(PX.contour));
  t.rect(101, 32, 85, 11, c(PX.contour));
  t.rect(102, 33, 1, 43, c(PX.bois[2]));
  t.rect(103, 33, 2, 43, c(PX.bois[3]));
  t.rect(102, 33, 84, 1, c(PX.bois[1]));
  t.rect(102, 34, 84, 7, c(PX.bois[2]));
  t.rect(102, 41, 84, 1, c(PX.bois[3]));
  t.boite(121, 34, 37, 7, PX.encre);
  t.rect(121, 34, 37, 1, c(PX.encreClaire));
  texte(t, 'GUICHET 3', 122, 35, c(PX.texteCreme), c(PX.plaqueOmbre));
}

/** Comptoir en bois à panneaux et son ombre au sol. */
export function peindreComptoir(t: Toile) {
  const b = PX.bois;
  t.rect(96, 76, 90, 27, c(PX.contour));
  t.rect(100, 77, 86, 1, c(b[0]));
  t.rect(100, 78, 86, 2, c(b[1]));
  t.rect(97, 77, 3, 1, c(b[1]));
  t.rect(97, 78, 3, 21, c(b[3]));
  t.rect(97, 99, 3, 3, c(b[4]));
  t.rect(100, 80, 86, 1, c(b[3]));
  t.rect(100, 81, 86, 1, c(b[4]));
  t.rect(100, 82, 86, 17, c(b[2]));
  for (let x = 103; x + 14 <= 180; x += 19) {
    t.rect(x, 84, 15, 1, c(b[3]));
    t.rect(x, 84, 1, 13, c(b[3]));
    t.rect(x, 96, 15, 1, c(b[1]));
    t.rect(x + 14, 85, 1, 12, c(b[1]));
  }
  t.rect(100, 99, 86, 3, c(b[4]));
  for (let x = 95; x < 186; x++)
    for (let y = 103; y <= 104; y++)
      if (trame(x, y, y === 103 ? 0.75 : 0.35)) t.point(x, y, c(PX.sol[3]));
}

/** Potelets chromés et sangles orange qui canalisent la file. */
export function peindrePotelets(t: Toile, gauche: number) {
  const postes: number[] = [];
  for (let x = 66; x >= gauche - 8; x -= 32) postes.push(x);
  const sangle = (xa: number, xb: number) => {
    for (let x = xa; x <= xb; x++) {
      const y =
        95 + Math.round(1.6 * Math.sin((Math.PI * (x - xa)) / (xb - xa)));
      t.rect(x, y - 1, 1, 4, c(PX.contour));
      t.point(x, y, c(PX.sangle[0]));
      t.point(x, y + 1, c(PX.sangle[1]));
    }
  };
  postes.forEach((x, i) => sangle(x + 1, i === 0 ? 96 : postes[i - 1]));
  postes.forEach((x) => {
    t.rect(x - 1, 94, 4, 14, c(PX.contour));
    t.rect(x - 2, 91, 6, 4, c(PX.contour));
    t.rect(x - 3, 107, 8, 4, c(PX.contour));
    t.rect(x, 95, 1, 12, c(PX.chrome[0]));
    t.rect(x + 1, 95, 1, 12, c(PX.chrome[2]));
    t.rect(x - 1, 92, 4, 1, c(PX.chrome[0]));
    t.rect(x - 1, 93, 4, 1, c(PX.chrome[1]));
    t.rect(x - 2, 108, 6, 1, c(PX.chrome[1]));
    t.rect(x - 2, 109, 6, 1, c(PX.chrome[2]));
  });
}
