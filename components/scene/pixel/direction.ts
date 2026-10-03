/**
 * Scène de l'acte II — La Direction : le bureau vitré du chef de service, au-dessus de la salle.
 * Au premier plan, le chef (l'agent du guichet 3, promu) vise les parapheurs qui arrivent dans sa
 * corbeille ; derrière la vitre, la salle du service : guichets numérotés, panneau d'appel et salle
 * d'attente où les usagers numérotés patientent assis. Quand la boucle tourne, les parapheurs
 * continuent d'arriver alors que la salle se vide.
 * Même repère (176 × 112) et mêmes outils que la scène du guichet ; aucune dépendance à React.
 */
import { GRIS, PX, PX_DIRECTION as D } from '@/constants/PalettePixel';
import { calque } from './decor';
import { spriteAgent, spriteTampon, type VarianteAgent } from './sprites';
import { Grille, type Image, type Toile, adoucir, couleur as c, hache, texte } from './toile';

/** Ce que la scène reçoit du jeu. */
export interface EtatDirection {
  /** Usagers en cours (tickets) : la salle d'attente. */
  usagers: number;
  /** Visas en attente : la pile de parapheurs dans la corbeille d'arrivée. */
  visas: number;
  /** Guichets possédés (le guichet 3 est le premier). */
  guichets: number;
  /** Numéro affiché par le panneau d'appel (null : panneau éteint). */
  appel: number | null;
}

interface Parapheur {
  x: number;
  y: number;
  de: { x: number; y: number };
  vers: { x: number; y: number };
  t0: number;
  duree: number;
  etat: 'glisse' | 'pose' | 'range';
  vise: boolean;
  couleur: string;
  saut?: number;
}
interface Particule { x: number; y: number; vx: number; vy: number; g: number; t0: number; vie: number; col: string }
interface Etoile { x: number; y: number; t0: number; vie: number }

const MONDE = { largeur: 176, hauteur: 112 };
/** Hauteur de monde montrée au plus avant de rogner les côtés, et largeur montrée au moins. */
const HAUTEUR_VUE = 132;
const LARGEUR_MIN = 148;
/** Vitre du bureau (bords inclus) et ses deux meneaux. */
const VITRE = { x0: 6, y0: 6, x1: 169, y1: 63 };
const MENEAUX = [70, 135];
/** Guichets de la salle : x de chaque cabine (22 px de large). */
const CABINES = [12, 44, 76, 108, 140];
/** Le chef, son épaule (départ du bras), le tampon au repos et à la frappe. */
const CHEF = { x: 100, y: 46 };
const EPAULE = { x: CHEF.x + 8, y: CHEF.y + 20 };
const REPOS = { x: EPAULE.x - 10, y: 75 };
const FRAPPE = { x: EPAULE.x - 24, y: 75 };
/** Parapheur posé sur le sous-main, sous le tampon. */
const SOUS_MAIN = { x: FRAPPE.x - 2, y: 77 };
/** Corbeille à deux étages : arrivée en haut, départ en bas. */
const CORBEILLE = { x: 22, arrivee: 67, depart: 75 };
const PILE_MAX = 8;

/** Places assises de la salle d'attente (pieds), hors meneaux, dans un ordre de remplissage stable. */
const PLACES: { x: number; y: number }[] = (() => {
  const p: { x: number; y: number }[] = [];
  for (const y of [52, 61])
    for (let x = 16; x <= 160; x += 12)
      if (!MENEAUX.some((m) => m + 1 >= x - 1 && m <= x + 6)) p.push({ x, y });
  return p
    .map((pl, i) => ({ pl, k: hache(i, 7) }))
    .sort((a, b) => a.k - b.k)
    .map((e) => e.pl);
})();

const cacheAssis = new Map<number, Image>();
/** Usager numéroté assis, en petit (la salle est loin) : gris, un ticket blanc à la main. */
function spriteAssis(variante: number): Image {
  const v = variante % 3;
  const deja = cacheAssis.get(v);
  if (deja) return deja;
  const g = new Grille(9, 13);
  g.rect(3, 1, 3, 3, GRIS.peau[1]);
  g.rect(3, 1, 3, 1, GRIS.cheveux[v]);
  g.rect(2, 4, 5, 4, GRIS.haut[v + 1]);
  g.rect(2, 4, 1, 4, GRIS.haut[0]);
  g.rect(2, 8, 5, 1, GRIS.bas[1]);
  g.rect(5, 9, 2, 3, GRIS.bas[2]);
  g.set(7, 6, PX.blanc);
  g.set(7, 5, PX.blanc);
  const img = g.image();
  cacheAssis.set(v, img);
  return img;
}

const cacheAgents = new Map<string, Image>();
/** Agent d'un guichet de la salle, en petit : buste derrière la vitre, bras levé ou baissé. */
function spriteMiniAgent(i: number, leve: boolean): Image {
  const cle = `${i % 3}|${leve ? 1 : 0}`;
  const deja = cacheAgents.get(cle);
  if (deja) return deja;
  const g = new Grille(9, 8);
  const veste = [PX.costume, D.lampe[0], PX.cheveux[1]][i % 3];
  g.rect(2, 0, 4, 1, PX.cheveuxAgent[1 + (i % 2)]);
  g.rect(2, 1, 4, 3, PX.peauAgent[1]);
  g.set(1, 1, PX.cheveuxAgent[1 + (i % 2)]);
  g.rect(1, 4, 6, 4, veste);
  g.rect(3, 4, 2, 2, PX.chemise[0]);
  g.rect(7, leve ? 2 : 5, 1, 2, PX.peauAgent[2]);
  const img = g.image();
  cacheAgents.set(cle, img);
  return img;
}

/** Salle du service, derrière la vitre : mur, néons, guichets, panneau d'appel, bancs, borne. */
function peindreSalle(t: Toile) {
  const { x0, y0, x1, y1 } = VITRE, w = x1 - x0 + 1;
  t.rect(x0, y0, w, 36, c(D.salleMur[1]));
  t.rect(x0, y0, w, 2, c(D.salleMur[2]));
  [16, 120].forEach((x) => t.rect(x, 8, 30, 1, c(PX.blanc)));
  t.rect(x0, 34, w, 1, c(D.bande[0]));
  t.rect(x0, 35, w, 1, c(D.bande[1]));
  t.rect(x0, 41, w, y1 - 41 + 1, c(D.salleSol[0]));
  for (let y = 44; y <= y1; y += 4) t.rect(x0, y, w, 1, c(D.salleSol[1]));
  // Cabines des guichets : plaque bleue, vitre, comptoir (les agents sont animés)
  CABINES.forEach((bx, i) => {
    t.rect(bx - 4, 22, 2, 19, c(D.salleMur[2]));
    t.boite(bx, 24, 22, 6, PX.encre);
    texte(t, `G${3 + i}`, bx + 8, 25, c(PX.texteCreme));
    t.rect(bx, 31, 22, 6, c(D.vitreSalle));
    t.boite(bx - 1, 37, 24, 3, PX.bois[2]);
    t.rect(bx - 1, 37, 24, 1, c(PX.bois[1]));
  });
  // Panneau d'appel suspendu (chiffres animés)
  [84, 107].forEach((x) => t.rect(x, y0, 1, 3, c(PX.contour)));
  t.boite(78, 9, 36, 12, PX.afficheurFond);
  texte(t, 'APPEL', 87, 10, c(PX.texteCreme));
  texte(t, '8888', 89, 15, c(PX.afficheurEteint));
  // Bancs de la salle d'attente
  for (const y of [52, 61]) {
    t.rect(12, y - 10, 152, 2, c(PX.bois[3]));
    t.rect(12, y - 5, 152, 1, c(PX.contour));
    t.rect(12, y - 4, 152, 1, c(PX.bois[1]));
    t.rect(12, y - 3, 152, 1, c(PX.bois[3]));
    for (let x = 14; x <= 160; x += 24) t.rect(x, y - 2, 1, 2, c(PX.contour));
  }
  // Borne à tickets
  t.rect(9, 46, 1, 12, c(PX.contour));
  t.boite(7, 40, 6, 7, D.metal[0]);
  t.rect(7, 40, 6, 1, c(PX.encre));
  t.point(9, 44, c(PX.rouge));
}

/** Vitre du bureau : salle, store vénitien, cadre, meneaux et reflets. */
function peindreVitre(t: Toile) {
  peindreSalle(t);
  const { x0, y0, x1, y1 } = VITRE;
  // Store vénitien à moitié baissé sur le carreau de gauche, et son cordon
  for (let y = y0; y < y0 + 10; y += 2) {
    t.rect(x0, y, MENEAUX[0] - x0, 1, c(D.rideau[0]));
    t.rect(x0, y + 1, MENEAUX[0] - x0, 1, c(D.rideau[1]));
  }
  t.rect(64, y0 + 10, 1, 9, c(D.rideau[1]));
  // Cadre en bois et meneaux
  const bois = (x: number, y: number, w: number, h: number) => {
    t.rect(x - 1, y - 1, w + 2, h + 2, c(PX.contour));
    t.rect(x, y, w, h, c(PX.bois[2]));
    t.rect(x, y, w, 1, c(PX.bois[1]));
  };
  bois(3, 3, 170, 2);
  bois(3, y1 + 1, 170, 3);
  bois(3, 3, 2, y1 + 1);
  bois(x1 + 1, 3, 2, y1 + 1);
  MENEAUX.forEach((m) => bois(m, y0, 2, y1 - y0 + 1));
  // Reflets en diagonale sur chaque carreau
  const reflet = c(PX.blanc, 0.35);
  [[24, 40], [94, 108], [150, 160]].forEach(([a, b]) => {
    for (let k = 0; k < 30; k++) {
      t.point(a + 20 - Math.round(k * 0.6), y0 + 2 + k, reflet);
      t.point(b + 14 - Math.round(k * 0.6), y0 + 2 + k, reflet);
    }
  });
}

/** Fond fixe : mur du bureau, organigramme et horloge en haut (grands formats), vitre, lambris. */
function peindreFond(t: Toile) {
  const plafond = Math.min(0, t.oy);
  t.rect(t.ox, t.oy, t.w, t.h, c(D.murBureau[1]));
  t.rect(t.ox, plafond, t.w, 2, c(D.murBureau[2]));
  if (plafond <= -24) {
    // Organigramme encadré : la Direction au sommet, trois bureaux en dessous
    const y = Math.max(plafond + 6, -26);
    t.boite(66, y, 34, 20, PX.bois[2]);
    t.rect(68, y + 2, 30, 16, c(PX.papier[0]));
    t.boite(78, y + 4, 10, 3, PX.encre);
    t.rect(82, y + 8, 1, 3, c(PX.contour));
    t.rect(71, y + 10, 25, 1, c(PX.contour));
    [70, 79, 88].forEach((x) => t.boite(x, y + 12, 7, 3, PX.papier[2]));
    // Horloge murale
    for (let dy = -6; dy <= 6; dy++)
      for (let dx = -6; dx <= 6; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= 5.6) t.point(146 + dx, y + 9 + dy, c(d > 4.6 ? PX.contour : PX.horlogeCadran));
      }
    t.rect(146, y + 5, 1, 4, c(PX.contour));
    t.rect(146, y + 9, 3, 1, c(PX.contour));
  }
  peindreVitre(t);
  // Lambris sous la vitre
  t.rect(t.ox, 68, t.w, 8, c(PX.bois[2]));
  t.rect(t.ox, 68, t.w, 1, c(PX.bois[1]));
  for (let x = Math.floor(t.ox / 22) * 22; x < t.ox + t.w; x += 22) t.rect(x, 69, 1, 7, c(PX.bois[3]));
}

/** Bureau du chef (premier plan) : plateau, sous-main, façade à panneaux, plaque « DIRECTION », moquette. */
function peindreBureau(t: Toile) {
  const b = PX.bois, x0 = 6, fin = t.ox + t.w;
  t.rect(t.ox, t.oy, t.w, t.h, c(D.moquette[1]));
  for (let y = 102; y < t.oy + t.h; y += 3) t.rect(t.ox, y, t.w, 1, c(D.moquette[2]));
  t.rect(x0 - 1, 76, fin - x0 + 1, 1, c(PX.contour));
  t.rect(x0, 77, fin - x0, 3, c(b[0]));
  t.rect(x0, 80, fin - x0, 1, c(b[1]));
  t.rect(x0 - 1, 81, fin - x0 + 1, 1, c(PX.contour));
  t.rect(x0 - 1, 77, 1, 25, c(PX.contour));
  t.rect(x0, 82, fin - x0, 19, c(b[2]));
  for (let x = 12; x + 16 <= fin; x += 22) {
    t.rect(x, 84, 18, 1, c(b[3]));
    t.rect(x, 84, 1, 14, c(b[3]));
    t.rect(x, 97, 18, 1, c(b[1]));
    t.rect(x + 17, 85, 1, 13, c(b[1]));
  }
  t.rect(x0, 101, fin - x0, 1, c(b[4]));
  // Sous-main en cuir vert
  t.rect(62, 77, 32, 3, c(D.sousMain[0]));
  t.rect(62, 79, 32, 1, c(D.sousMain[1]));
  // Plaque
  t.boite(124, 87, 37, 7, PX.encre);
  t.rect(124, 87, 37, 1, c(PX.encreClaire));
  texte(t, 'DIRECTION', 125, 88, c(PX.texteCreme), c(PX.plaqueOmbre));
}

export class MoteurDirection {
  W = 0;
  H = 0;
  private t = 20000;
  private gauche = 0;
  private haut = 0;
  private toile: Toile | null = null;
  private fond: Toile | null = null;
  private bureau: Toile | null = null;
  private e: EtatDirection = { usagers: 0, visas: 0, guichets: 1, appel: null };
  private parapheur: Parapheur | null = null;
  private coup: { t0: number; impact: boolean } | null = null;
  private ranges = 2;
  private compteur = 0;
  private particules: Particule[] = [];
  private etoiles: Etoile[] = [];
  private dernierCoup = -9999;
  private onImpact?: () => void;

  constructor(onImpact?: () => void) {
    this.onImpact = onImpact;
  }

  /**
   * Adapte la résolution à la zone (en points). Toute la hauteur du monde est visible, plus le haut
   * du mur jusqu'à HAUTEUR_VUE ; une zone haute rogne les côtés plutôt que de montrer du mur vide,
   * sans jamais cacher la corbeille, le chef ni la plaque (LARGEUR_MIN).
   */
  redim(largeur: number, hauteur: number): boolean {
    if (largeur <= 0 || hauteur <= 0) return false;
    const e = Math.min(Math.max(hauteur / HAUTEUR_VUE, largeur / MONDE.largeur), hauteur / MONDE.hauteur, largeur / LARGEUR_MIN);
    const W = Math.round(largeur / e), H = Math.round(hauteur / e);
    if (W === this.W && H === this.H) return false;
    this.W = W;
    this.H = H;
    this.gauche = Math.round((MONDE.largeur - W) / 2);
    this.haut = MONDE.hauteur - H;
    this.toile = calque(this.gauche, this.haut, W, H);
    this.fond = calque(this.gauche, this.haut, W, H);
    peindreFond(this.fond);
    this.bureau = calque(this.gauche, 76, W, MONDE.hauteur - 76);
    peindreBureau(this.bureau);
    return true;
  }

  etat(e: EtatDirection) {
    this.e = { ...e };
  }

  private nouveauParapheur(): Parapheur {
    const n = Math.min(PILE_MAX, Math.ceil(this.e.visas));
    const de = { x: CORBEILLE.x, y: CORBEILLE.arrivee - 2 * Math.max(0, n - 1) };
    this.compteur++;
    return { x: de.x, y: de.y, de, vers: SOUS_MAIN, t0: this.t, duree: 220, etat: 'glisse', vise: false, couleur: D.parapheur[hache(this.compteur, 5) % D.parapheur.length] };
  }

  /** Coup de tampon du chef : il vise le parapheur posé (ou le prend directement dans la corbeille). */
  tamponner() {
    if (this.e.visas < 1 && (!this.parapheur || this.parapheur.vise)) return;
    const p = this.parapheur;
    if (!p || p.etat !== 'pose' || p.vise) this.parapheur = { ...this.nouveauParapheur(), x: SOUS_MAIN.x, y: SOUS_MAIN.y, etat: 'pose' };
    this.coup = { t0: this.t, impact: false };
    this.dernierCoup = this.t;
  }

  private impact() {
    const t = this.t, p = this.parapheur;
    if (p) {
      p.vise = true;
      p.saut = t;
    }
    for (let i = 0; i < 7; i++) {
      this.particules.push({ x: FRAPPE.x + 3, y: 76, vx: (i - 3) * 16 + (hache(t | 0, i) % 9) - 4, vy: -40 - (hache(t | 0, i + 9) % 40), g: 260, t0: t, vie: 420, col: i % 2 ? PX.encre : PX.encreOmbre });
    }
    this.etoiles.push({ x: FRAPPE.x + 3, y: 76, t0: t, vie: 130 });
    this.onImpact?.();
  }

  /** Fait avancer la scène de dt millisecondes. */
  avancer(dt: number) {
    this.t += dt;
    const t = this.t;
    if (!this.parapheur && !this.coup && this.e.visas >= 1) this.parapheur = this.nouveauParapheur();
    const p = this.parapheur;
    if (p && p.etat !== 'pose') {
      const k = adoucir((t - p.t0) / p.duree);
      p.x = p.de.x + (p.vers.x - p.de.x) * k;
      p.y = p.de.y + (p.vers.y - p.de.y) * k - Math.sin(k * Math.PI) * 6;
      if (k >= 1) {
        if (p.etat === 'glisse') p.etat = 'pose';
        else {
          this.parapheur = null;
          this.ranges = this.ranges >= 5 ? 1 : this.ranges + 1;
        }
      }
    }
    if (this.coup) {
      const k = t - this.coup.t0;
      if (k >= 105 && !this.coup.impact) {
        this.coup.impact = true;
        this.impact();
      }
      const q = this.parapheur;
      if (k >= 230 && q && q.etat === 'pose' && q.vise) {
        const vers = { x: CORBEILLE.x, y: CORBEILLE.depart - 2 * this.ranges };
        Object.assign(q, { etat: 'range', de: { x: q.x, y: q.y }, vers, t0: t, duree: 200 });
      }
      if (k > 380) this.coup = null;
    }
    this.particules = this.particules.filter((q) => {
      q.x += (q.vx * dt) / 1000;
      q.y += (q.vy * dt) / 1000;
      q.vy += (q.g * dt) / 1000;
      return t - q.t0 < q.vie;
    });
    this.etoiles = this.etoiles.filter((f) => t - f.t0 < f.vie);
  }

  private positionTampon(): { x: number; y: number; ecrase: boolean; trainee: boolean } {
    const R = REPOS, C = FRAPPE;
    if (!this.coup) return { ...R, ecrase: false, trainee: false };
    const k = this.t - this.coup.t0;
    if (k < 70) { const e = adoucir(k / 70); return { x: R.x + (C.x - R.x) * e, y: R.y - 20 * e, ecrase: false, trainee: false }; }
    if (k < 105) return { x: C.x, y: 55 + 20 * ((k - 70) / 35) ** 2, ecrase: false, trainee: true };
    if (k < 165) return { ...C, ecrase: k < 150, trainee: false };
    if (k < 230) return { x: C.x, y: C.y - 3 * Math.sin(((k - 165) / 65) * Math.PI), ecrase: false, trainee: false };
    if (k < 360) { const e = adoucir((k - 230) / 130); return { x: C.x + (R.x - C.x) * e, y: C.y - 6 * Math.sin(e * Math.PI), ecrase: false, trainee: false }; }
    return { ...R, ecrase: false, trainee: false };
  }

  /** Dessine l'image courante et la renvoie (null tant que la taille est inconnue). */
  peindre(): Toile | null {
    const T = this.toile, t = this.t;
    if (!T || !this.fond || !this.bureau) return null;
    T.px.set(this.fond.px);
    this.peindreSalleAnimee(T);
    const k = this.coup ? t - this.coup.t0 : Infinity;
    let v: VarianteAgent = 'normal';
    if (k < 260) v = 'effort';
    else if (t % 3700 < 140) v = 'cligne';
    else if (t - this.dernierCoup > 2500 && t % 9000 > 5200 && t % 9000 < 6600) v = 'regard';
    T.copier(spriteAgent(v), CHEF.x, CHEF.y + (Math.floor(t / 900) % 2));
    T.copier(this.bureau, this.bureau.ox, this.bureau.oy);
    this.peindreBureauAnime(T);
    this.peindreEffets(T);
    return T;
  }

  /** Agents aux guichets, rideaux des guichets fermés, numéro appelé, usagers assis. */
  private peindreSalleAnimee(T: Toile) {
    const t = this.t;
    CABINES.forEach((bx, i) => {
      if (i < this.e.guichets) {
        T.copier(spriteMiniAgent(i, (t + i * 700) % 1600 < 180), bx + 7, 30);
        T.rect(bx, 31, 22, 6, c(PX.blanc, 0.15));
      } else {
        for (let y = 31; y <= 36; y++) T.rect(bx, y, 22, 1, c(y % 2 ? D.rideau[0] : D.rideau[1]));
      }
    });
    if (this.e.appel !== null) texte(T, String(this.e.appel % 10000).padStart(4, '0'), 89, 15, c(PX.afficheurAllume));
    const n = Math.min(PLACES.length, Math.max(0, Math.round(this.e.usagers)));
    for (let i = 0; i < n; i++) {
      const p = PLACES[i];
      T.copier(spriteAssis(hache(i, 3)), p.x - 2, p.y - 12);
    }
    // Voyant de la borne à tickets
    if (Math.floor(t / 700) % 2) T.point(9, 44, c(PX.afficheurAllume));
  }

  /** Corbeille et ses piles, parapheur, encreur, téléphone, tasse, lampe, bras et tampon du chef. */
  private peindreBureauAnime(T: Toile) {
    const t = this.t, { x, arrivee, depart } = CORBEILLE;
    // Corbeille à deux étages
    T.rect(x - 2, arrivee - 8, 1, 17, c(D.metal[2]));
    T.rect(x + 13, arrivee - 8, 1, 17, c(D.metal[2]));
    T.rect(x - 2, arrivee + 2, 16, 1, c(D.metal[1]));
    const pile = Math.min(PILE_MAX, Math.ceil(this.e.visas)) - (this.parapheur?.etat === 'glisse' ? 1 : 0);
    for (let i = 0; i < pile; i++) this.dessinerParapheur(T, x, arrivee - 2 * i, D.parapheur[hache(i + this.compteur, 5) % D.parapheur.length], false);
    for (let i = 0; i < this.ranges; i++) this.dessinerParapheur(T, x, depart - 2 * i, D.parapheur[hache(i, 11) % D.parapheur.length], true);
    // Encreur, téléphone, tasse fumante
    T.boite(REPOS.x - 1, 77, 10, 2, PX.encreur);
    T.rect(REPOS.x, 77, 8, 1, c(PX.encre));
    T.boite(124, 74, 12, 3, PX.beige[1]);
    T.boite(123, 72, 14, 1, PX.beige[2]);
    T.boite(142, 73, 5, 4, PX.blanc);
    T.rect(142, 73, 5, 1, c(PX.cafe));
    for (let i = 0; i < 3; i++) {
      const k = (t / 1500 + i / 3) % 1;
      T.rect(144 + Math.round(Math.sin(k * 6 + i * 2) * 1.5), Math.round(71 - k * 12), 1, 2, c(PX.blanc, Math.round(7.5 * (1 - k)) / 10));
    }
    // Lampe de bureau et son halo
    for (let y = 61; y <= 76; y++) {
      const r = Math.round((y - 61) * 0.6) + 3;
      T.rect(160 - r, y, r * 2, 1, c(D.lumiere, 0.18));
    }
    T.boite(155, 76, 10, 1, D.lampe[1]);
    T.trait(160, 76, 164, 64, c(PX.contour), 2);
    T.trait(164, 64, 160, 58, c(PX.contour), 2);
    T.boite(155, 56, 10, 4, D.lampe[0]);
    // Parapheur en mouvement ou posé
    const p = this.parapheur;
    if (p) {
      const y = Math.round(p.y) - (p.saut && t - p.saut < 90 ? 1 : 0);
      this.dessinerParapheur(T, Math.round(p.x), y, p.couleur, p.vise);
    }
    // Bras et tampon du chef
    const pos = this.positionTampon(), bx = Math.round(pos.x), by = Math.round(pos.y);
    const main = { x: bx + 3, y: by - 9 + (pos.ecrase ? 1 : 0) };
    T.trait(EPAULE.x, EPAULE.y, main.x, main.y, c(PX.contour), 4);
    T.trait(EPAULE.x, EPAULE.y, main.x, main.y, c(PX.chemise[1]), 2);
    if (pos.trainee) for (let i = 0; i < 3; i++) T.rect(bx + 1 + i * 2, by - 22, 1, 9, c(PX.encreClaire, 0.55));
    T.copier(spriteTampon(pos.ecrase), bx - 2, by - 12);
    T.boite(main.x - 1, main.y - 1, 3, 3, PX.peauAgent[1]);
    T.point(main.x - 1, main.y - 1, c(PX.peauAgent[0]));
  }

  /** Parapheur vu de face : couverture colorée, tranche de papier ; marque VISA bleue une fois visé. */
  private dessinerParapheur(T: Toile, x: number, y: number, couleur: string, vise: boolean) {
    T.boite(x, y, 12, 1, couleur);
    T.rect(x, y + 1, 12, 1, c(PX.papier[1]));
    if (vise) T.rect(x + 4, y, 5, 1, c(PX.encre));
  }

  private peindreEffets(T: Toile) {
    const t = this.t;
    for (const q of this.particules) T.point(q.x, q.y, c(q.col));
    for (const f of this.etoiles) {
      const r = (t - f.t0) / f.vie < 0.5 ? 4 : 2, b = c(PX.blanc);
      T.rect(f.x - r, f.y, r * 2 + 1, 1, b);
      T.rect(f.x, f.y - r, 1, r + 1, b);
      T.point(f.x - r + 1, f.y - r + 1, b);
      T.point(f.x + r - 1, f.y - r + 1, b);
    }
  }
}
