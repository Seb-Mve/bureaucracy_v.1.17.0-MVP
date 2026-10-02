/**
 * Moteur de la scène du guichet en pixel art : la file visible, le coup de tampon
 * et le dessin de chaque image dans une Toile. Aucune dépendance à React :
 * les composants ScenePixel (Skia sur téléphone, canvas sur le web) l'affichent.
 */
import { PX } from '@/constants/PalettePixel';
import { calque, peindreComptoir, peindreFacade, peindreFond, peindrePotelets } from './decor';
import { hautTete, specUsager, spriteAgent, spriteTampon, spriteUsager, type SpecUsager, type VarianteAgent } from './sprites';
import { Toile, adoucir, couleur as c, hache, texte } from './toile';

/** Ce que la scène reçoit du jeu. */
export interface EtatScene {
  enAttente: number;
  numerotation: boolean;
  /** Numéro du premier usager de la file (identités stables d'une image à l'autre). */
  premierNumero: number | null;
}

interface UsagerScene {
  numero: number;
  spec: SpecUsager;
  x: number;
  cible: number;
  rang: number;
  dist: number;
  phase: number;
  marche: boolean;
  vitesse: number;
  /** En train de partir : accepté, rejeté ou simplement sorti de la file. */
  depart?: 'accepte' | 'rejete' | 'discret';
  pousse: number;
}
interface Dossier { x: number; de: number; vers: number; t0: number; duree: number; etat: 'glisse' | 'pose' | 'retour'; marque?: 'ok' | 'rej'; saut?: number }
interface Coup { t0: number; rejete: boolean; impact: boolean }
interface Particule { x: number; y: number; vx: number; vy: number; g: number; t0: number; vie: number; col: string; fondu?: boolean }
/** Étoile d'impact du tampon (le gain s'affiche dans les compteurs, pas dans la scène). */
interface Etoile { x: number; y: number; t0: number; vie: number }

/** Dimensions du monde dessiné (px). */
const MONDE = { largeur: 176, hauteur: 112 };
/** Hauteur de monde visée : les 112 px du guichet et 28 px de mur au-dessus (px). */
const HAUTEUR_VUE = 140;
/** Largeur de monde au-delà de laquelle on ne dézoome plus (px). */
const LARGEUR_MAX = 280;
const PIEDS_FILE = 104, PIEDS_DEPART = 100;
/** Allure de rattrapage dans la file : px/s par px de retard (un retard de 16 px se comble en ~0,2 s). */
const RATTRAPAGE = 8;
/** Allure des usagers qui repartent pendant une rafale de coups (px/s). */
const PRESSE_DEPART = 160;
const COLERE = ['x.x.x', '.xxx.', 'xx.xx', '.xxx.', 'x.x.x'];
const NOTE = ['..xx.', '..x.x', '..x..', 'xxx..', 'xxx..'];

export class MoteurScene {
  W = 0;
  H = 0;
  private t = 20000;
  private gauche = 0;
  private haut = 0;
  private slots = 0;
  private toile: Toile | null = null;
  private fond: Toile | null = null;
  private facade: Toile = calque(101, 32, 76, 46);
  private comptoir: Toile = calque(95, 76, 82, 29);
  private potelets: Toile | null = null;
  private file: UsagerScene[] = [];
  private parts: UsagerScene[] = [];
  private particules: Particule[] = [];
  private etoiles: Etoile[] = [];
  private dossier: Dossier | null = null;
  private coup: Coup | null = null;
  private depart: { t: number; rejete: boolean } | null = null;
  private cible = 0;
  /** Usagers en attente qui ne tiennent pas dans le champ : affichés « +N » au bout de la file. */
  surplus = 0;
  private prochain = 1;
  private numerotation = false;
  private pile = 3;
  private dernierCoup = -9999;
  private demarre = false;
  private onImpact?: () => void;

  constructor(onImpact?: () => void) {
    this.onImpact = onImpact;
    peindreFacade(this.facade);
    peindreComptoir(this.comptoir);
  }

  /** Adapte la résolution à la zone (en points). Renvoie vrai si la taille a changé. */
  redim(largeur: number, hauteur: number): boolean {
    if (largeur <= 0 || hauteur <= 0) return false;
    // Vue dézoomée : toute la hauteur du monde plus le haut du mur (panneau « ACCUEIL », portrait officiel) ;
    // une zone large montre plus de file à gauche plutôt que de zoomer. Au moins 4 usagers visibles
    // (on rogne alors le haut), et pas plus de 280 px de monde.
    const e = Math.max(Math.min(hauteur / HAUTEUR_VUE, largeur / 126), largeur / LARGEUR_MAX);
    const W = Math.round(largeur / e), H = Math.round(hauteur / e);
    if (W === this.W && H === this.H) return false;
    this.W = W;
    this.H = H;
    this.gauche = W >= MONDE.largeur ? MONDE.largeur - W : MONDE.largeur - Math.min(16, Math.round((MONDE.largeur - W) * 0.35)) - W;
    this.haut = H >= MONDE.hauteur ? MONDE.hauteur - H : Math.min(46, Math.max(0, 108 - H));
    this.slots = 0;
    while (this.slotX(this.slots) >= this.gauche + 4) this.slots++;
    this.toile = calque(this.gauche, this.haut, W, H);
    this.fond = calque(this.gauche, this.haut, W, H);
    peindreFond(this.fond, this.haut < -40);
    this.potelets = calque(this.gauche - 8, 90, MONDE.largeur - this.gauche, 22);
    peindrePotelets(this.potelets, this.gauche);
    this.file.forEach((u, i) => { u.cible = this.slotX(i); });
    this.ajuster();
    return true;
  }

  private slotX(i: number) { return 90 - i * 16; }

  private nouvel(numero: number, x: number): UsagerScene {
    return { numero, spec: specUsager(numero), x, cible: x, rang: 0, dist: 0, phase: hache(numero, 31) % 5000, marche: false, vitesse: 48, pousse: 0 };
  }

  /** Aligne la file visible sur la demande : on complète par la gauche, on retire par la fin. */
  private ajuster() {
    const voulu = Math.min(this.slots + 1, this.cible + (this.depart ? 1 : 0));
    const placeDirecte = !this.demarre;
    while (this.file.length < voulu) {
      const i = this.file.length;
      this.file.push(this.nouvel(this.prochain++, placeDirecte ? this.slotX(i) : this.gauche - 12));
    }
    while (this.file.length > voulu) {
      const u = this.file.pop() as UsagerScene;
      // La file raccourcit (moins d'usagers en attente) : ils sortent vite, pour que la scène suive le compteur.
      Object.assign(u, { depart: 'discret', cible: this.gauche - 16, vitesse: PRESSE_DEPART });
      this.parts.push(u);
    }
    this.file.forEach((u, i) => { u.rang = i; u.cible = this.slotX(i); });
    if (this.file.length > 0) this.demarre = true;
  }

  etat(e: EtatScene) {
    this.numerotation = e.numerotation;
    const n = Math.max(0, Math.floor(e.enAttente));
    this.cible = Math.min(this.slots, n);
    this.surplus = Math.max(0, n - this.cible);
    if (!this.demarre && e.premierNumero !== null) this.prochain = e.premierNumero;
    if (this.slots > 0) this.ajuster();
  }

  /** Usagers de la file à moins d'une demi-place de la leur (une place fait 16 px). */
  usagersEnPlace(): number {
    return this.file.filter((u) => Math.abs(u.cible - u.x) < 12).length;
  }

  /** Coup de tampon du joueur : l'agent tamponne, puis l'usager repart. */
  tamponner(rejete: boolean) {
    if (this.depart) {
      // Nouveau coup avant que le précédent usager soit parti : c'est une rafale.
      // Ceux qui s'en vont filent pour ne pas traverser la file à pas lents.
      this.faireDepart();
      for (const p of this.parts) if (p.depart !== 'discret') p.vitesse = Math.max(p.vitesse, PRESSE_DEPART);
    }
    if (this.file.length === 0) return;
    const d = this.dossier;
    if (!d || d.etat !== 'pose' || d.marque) this.dossier = { x: 106, de: 106, vers: 106, t0: this.t, duree: 1, etat: 'pose' };
    this.coup = { t0: this.t, rejete, impact: false };
    this.dernierCoup = this.t;
    this.depart = { t: this.t + 330, rejete };
  }

  private faireDepart() {
    const rejete = this.depart?.rejete ?? false;
    this.depart = null;
    const u = this.file.shift();
    if (u) {
      Object.assign(u, { depart: rejete ? 'rejete' : 'accepte', cible: this.gauche - 16, vitesse: rejete ? 62 : 46 });
      this.parts.push(u);
    }
    this.ajuster();
  }

  private impact() {
    const t = this.t, d = this.dossier;
    if (d && this.coup) { d.marque = this.coup.rejete ? 'rej' : 'ok'; d.saut = t; }
    this.pile = this.pile >= 7 ? 2 : this.pile + 1;
    for (let i = 0; i < 7; i++) {
      this.particules.push({ x: 111, y: 75, vx: (i - 3) * 16 + (hache(t | 0, i) % 9) - 4, vy: -40 - (hache(t | 0, i + 9) % 40), g: 260, t0: t, vie: 420, col: i % 2 ? PX.encre : PX.encreOmbre });
    }
    this.etoiles.push({ x: 111, y: 75, t0: t, vie: 130 });
    this.onImpact?.();
  }

  private marcher(u: UsagerScene, dt: number) {
    // Dans la file, on presse le pas selon le retard : à 9 coups/s, les départs iraient
    // plus vite que la marche et la file se tasserait hors champ. Ceux qui partent gardent leur allure.
    const d = u.cible - u.x;
    const vitesse = u.depart ? u.vitesse : Math.max(u.vitesse, Math.abs(d) * RATTRAPAGE);
    const v = (vitesse * dt) / 1000;
    if (Math.abs(d) > 0.3) { const s = Math.sign(d) * Math.min(Math.abs(d), v); u.x += s; u.dist += Math.abs(s); u.marche = true; }
    else { u.x = u.cible; u.marche = false; }
  }

  /** Fait avancer la scène de dt millisecondes. */
  avancer(dt: number) {
    this.t += dt;
    const t = this.t;
    if (this.depart && t >= this.depart.t) this.faireDepart();
    this.file.forEach((u) => this.marcher(u, dt));
    this.parts = this.parts.filter((u) => {
      this.marcher(u, dt);
      if (u.depart === 'rejete' && u.marche && t - u.pousse > 170) {
        u.pousse = t;
        for (const s of [-1, 1]) this.particules.push({ x: u.x + (s > 0 ? 3 : -2), y: PIEDS_DEPART, vx: 12 * s, vy: -12, g: 40, t0: t, vie: 320, col: PX.poussiere });
      }
      return u.x > this.gauche - 14;
    });
    const premier = this.file[0];
    if (!this.dossier && !this.coup && premier && !premier.marche) this.dossier = { x: 94, de: 94, vers: 106, t0: t, duree: 200, etat: 'glisse' };
    const d = this.dossier;
    if (d && d.etat !== 'pose') {
      const e = adoucir((t - d.t0) / d.duree);
      d.x = d.de + (d.vers - d.de) * e;
      if (e >= 1) { if (d.etat === 'glisse') d.etat = 'pose'; else this.dossier = null; }
    }
    if (this.coup) {
      const k = t - this.coup.t0;
      if (k >= 105 && !this.coup.impact) { this.coup.impact = true; this.impact(); }
      if (k >= 230 && d && d.etat === 'pose' && d.marque) Object.assign(d, { etat: 'retour', de: d.x, vers: 94, t0: t, duree: 100 });
      if (k > 380) this.coup = null;
    }
    this.particules = this.particules.filter((p) => {
      p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.vy += (p.g * dt) / 1000;
      return t - p.t0 < p.vie;
    });
    this.etoiles = this.etoiles.filter((f) => t - f.t0 < f.vie);
  }

  private positionTampon(): { x: number; y: number; ecrase: boolean; trainee: boolean } {
    const R = { x: 122, y: 75 }, C = { x: 108, y: 75 };
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
    if (!T || !this.fond || !this.potelets) return null;
    T.px.set(this.fond.px);
    this.peindreMur(T);
    const k = this.coup ? t - this.coup.t0 : Infinity;
    let v: VarianteAgent = 'normal';
    if (k < 260) v = 'effort';
    else if (t % 3700 < 140) v = 'cligne';
    else if (t - this.dernierCoup > 2500 && t % 9000 > 5200 && t % 9000 < 6600) v = 'regard';
    T.copier(spriteAgent(v), 124, 46 + (Math.floor(t / 900) % 2));
    this.peindreEcran(T);
    T.copier(this.comptoir, this.comptoir.ox, this.comptoir.oy);
    this.peindreComptoirAnime(T);
    T.copier(this.facade, this.facade.ox, this.facade.oy);
    this.peindreUsagers(T);
    T.copier(this.potelets, this.potelets.ox, this.potelets.oy);
    // Bout de file : ceux qui attendent hors champ, plutôt que des usagers entassés les uns sur les autres.
    if (this.surplus > 0 && this.file.length > 0) {
      const n = this.surplus;
      const etiquette = `+${n < 1000 ? n : `${Math.floor(n / 1000)}K`}`;
      // Petite étiquette de papier, lisible sur le mur comme sur la file.
      const x = this.gauche + 3, y = 64, w = etiquette.length * 4 + 3;
      T.boite(x - 2, y - 2, w, 9, PX.papier[0]);
      texte(T, etiquette, x, y, c(PX.contour));
    }
    this.peindreEffets(T);
    return T;
  }

  private peindreMur(T: Toile) {
    const t = this.t, plafond = Math.min(0, this.haut);
    // Nuage qui passe derrière les stores
    const nx = Math.round(-6 + ((t / 380) % 50));
    const nuage = (x: number, y: number, w: number, h: number, col: string) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const X = x + i, Y = y + j;
        if (X >= 11 && X <= 37 && Y >= 29 && Y <= 47 && X !== 24 && Y !== 38) T.point(X, Y, c(col));
      }
    };
    nuage(nx + 2, 31, 5, 1, PX.blanc); nuage(nx, 32, 10, 2, PX.blanc); nuage(nx + 4, 30, 3, 1, PX.blanc); nuage(nx + 1, 34, 8, 1, PX.ciel[0]);
    // Néons, dont un qui grésille de temps en temps
    const eteint = t % 7300 < 150 && Math.floor(t / 45) % 2 === 1;
    (this.haut < -40 ? [20, 112] : [20]).forEach((tx, i) => {
      const off = eteint && i === 0;
      T.rect(tx + 1, plafond + 6, 39, 1, c(off ? PX.neonEteint : PX.blanc));
      if (!off) { T.rect(tx + 2, plafond + 8, 37, 2, c(PX.neonLueur, 0.45)); T.rect(tx - 1, plafond + 10, 43, 3, c(PX.neonLueur, 0.2)); }
    });
    // Aiguilles de l'horloge
    const a = (t / 60000) * Math.PI * 2, b = (t / 720000) * Math.PI * 2, s = (Math.floor(t / 1000) / 60) * Math.PI * 2;
    const aiguille = (ang: number, l: number, col: string) => T.trait(90, 20, 90 + Math.round(Math.sin(ang) * l), 20 - Math.round(Math.cos(ang) * l), c(col));
    aiguille(b, 2.4, PX.contour); aiguille(a, 3.6, PX.contour); aiguille(s, 4, PX.rouge);
    // Une feuille se soulève dans le courant d'air
    if (t % 3200 < 480 && Math.floor(t / 110) % 2) { T.point(77, 29, c(PX.liege[1])); T.point(76, 29, c(PX.postit[1])); T.point(77, 28, c(PX.postit[1])); }
    // Afficheur de tickets, après la note « Numérotation des usagers »
    if (this.numerotation && this.file[0]) {
      T.boite(148, 18, 26, 9, PX.afficheurFond);
      texte(T, '888', 156, 20, c(PX.afficheurEteint));
      texte(T, String(this.file[0].numero % 1000).padStart(3, '0'), 156, 20, c(PX.afficheurAllume));
    }
  }

  /** Écran de l'agent (texte qui défile) et pile des doubles posée dessus. */
  private peindreEcran(T: Toile) {
    const t = this.t, x = 159;
    T.boite(x, 58, 16, 18, PX.beige[1]);
    T.rect(x, 58, 16, 1, c(PX.beige[0])); T.rect(x, 58, 1, 18, c(PX.beige[0]));
    T.rect(x + 15, 59, 1, 17, c(PX.beige[2])); T.rect(x, 74, 16, 2, c(PX.beige[2]));
    T.boite(x + 2, 60, 11, 10, PX.ecran);
    for (let i = 0; i < 4; i++) T.rect(x + 3, 61 + i * 2, 3 + (hache(i + Math.floor(t / 700), 41) % 7), 1, c(PX.ecranTexte));
    if (Math.floor(t / 500) % 2) T.rect(x + 4, 69, 2, 1, c(PX.ecranTexte));
    T.rect(x + 2, 60, 11, 1, c(PX.blanc, 0.25));
    T.point(x + 13, 72, c(PX.ecranLueur[0]));
    for (let i = 0; i < this.pile; i++) {
      const y = 56 - i * 2, dx = (hache(i, 21) % 3) - 1;
      T.rect(x + dx, y - 1, 16, 3, c(PX.contour));
      T.rect(x + 1 + dx, y, 14, 1, c(i % 3 === 2 ? PX.postit[1] : PX.papier[0]));
    }
  }

  /** Encreur, tasse fumante, dossier, tampon et bras de l'agent. */
  private peindreComptoirAnime(T: Toile) {
    const t = this.t;
    T.boite(121, 77, 10, 2, PX.encreur); T.rect(122, 77, 8, 1, c(PX.encre));
    T.boite(162, 76, 10, 1, PX.beige[2]);
    T.boite(150, 73, 5, 5, PX.blanc); T.rect(154, 74, 1, 4, c(PX.papier[2])); T.rect(150, 73, 5, 1, c(PX.cafe));
    [[156, 74], [157, 75], [156, 76]].forEach(([x, y]) => T.point(x, y, c(PX.contour)));
    for (let i = 0; i < 3; i++) {
      const p = (t / 1500 + i / 3) % 1;
      T.rect(152 + Math.round(Math.sin(p * 6 + i * 2) * 1.5), Math.round(71 - p * 12), 1, 2, c(PX.blanc, Math.round(7.5 * (1 - p)) / 10));
    }
    const d = this.dossier;
    if (d) {
      const x = Math.round(d.x), y = 77 - (d.saut && t - d.saut < 90 ? 1 : 0);
      T.boite(x, y, 12, 2, PX.papier[0]);
      T.rect(x, y + 1, 12, 1, c(PX.papier[2])); T.rect(x + 1, y, 3, 1, c(PX.lignePapier)); T.rect(x + 10, y - 1, 2, 1, c(PX.encre));
      if (d.marque) {
        const m = d.marque === 'ok' ? [PX.vert, PX.vertEncre] : [PX.rougeClair, PX.rouge];
        T.rect(x + 4, y, 6, 2, c(m[1])); T.rect(x + 5, y, 4, 1, c(m[0]));
      }
    }
    const p = this.positionTampon(), bx = Math.round(p.x), by = Math.round(p.y);
    const main = { x: bx + 3, y: by - 9 + (p.ecrase ? 1 : 0) };
    T.trait(132, 66, main.x, main.y, c(PX.contour), 4);
    T.trait(132, 66, main.x, main.y, c(PX.chemise[1]), 2);
    if (p.trainee) for (let i = 0; i < 3; i++) T.rect(bx + 1 + i * 2, by - 22, 1, 9, c(PX.sangle[0], 0.55));
    T.copier(spriteTampon(p.ecrase), bx - 2, by - 12);
    T.boite(main.x - 1, main.y - 1, 3, 3, PX.peauAgent[1]);
    T.point(main.x - 1, main.y - 1, c(PX.peauAgent[0]));
  }

  private peindreUsagers(T: Toile) {
    const t = this.t, ombre = c(PX.ombrePieds, 0.28);
    for (const u of [...this.parts, ...this.file]) {
      const x = Math.round(u.x), y = u.depart ? PIEDS_DEPART + 1 : PIEDS_FILE + 1;
      T.rect(x - 4, y, 10, 1, ombre); T.rect(x - 3, y + 1, 8, 1, ombre);
    }
    for (const u of this.parts) {
      const pas = u.marche ? Math.floor(u.dist / 3) % 4 : -1;
      const img = spriteUsager(u.spec, { pas, bras: 'tient', fache: u.depart === 'rejete', numerote: this.numerotation });
      const saut = u.depart === 'accepte' && u.marche ? Math.floor(u.dist / 5) % 2 : 0;
      T.copier(img, Math.round(u.x) - 11, PIEDS_DEPART - 37 - saut, true);
    }
    for (let i = this.file.length - 1; i >= 0; i--) {
      const u = this.file[i];
      const pas = u.marche ? Math.floor(u.dist / 3) % 4 : -1;
      const bras = i === 0 && this.dossier && !u.marche ? 'vide' : 'tient';
      const regard = !u.marche && i > 0 && (t + u.phase) % 6500 < 700;
      const img = spriteUsager(u.spec, { pas, bras, fache: false, numerote: this.numerotation });
      T.copier(img, Math.round(u.x) - (regard ? 11 : 10), PIEDS_FILE - 37, regard);
    }
  }

  private bulle(T: Toile, motif: string[], x: number, y: number, col: string) {
    const k = c(PX.contour), b = c(PX.blanc);
    T.rect(x + 1, y, 7, 7, k); T.rect(x, y + 1, 9, 5, k); T.rect(x + 2, y + 7, 2, 1, k);
    T.rect(x + 1, y + 1, 7, 5, b); T.point(x + 2, y + 6, b);
    motif.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'x') T.point(x + 2 + i, y + 1 + j, c(col)); }));
  }

  private peindreEffets(T: Toile) {
    const t = this.t;
    for (const u of this.parts) {
      if (u.depart === 'discret') continue;
      const y = hautTete(u.spec, PIEDS_DEPART) - 11, x = Math.round(u.x) - 3;
      if (u.depart === 'rejete') this.bulle(T, COLERE, x, y, PX.bulleColere);
      else this.bulle(T, NOTE, x, y - Math.round(Math.abs(Math.sin(t / 150)) * 2), PX.bulleNote);
    }
    for (const p of this.particules) {
      const a = p.fondu ? Math.max(0, 1 - (t - p.t0) / p.vie) : 1;
      T.point(p.x, p.y, c(p.col, Math.round(a * 10) / 10));
    }
    for (const f of this.etoiles) {
      const k = (t - f.t0) / f.vie;
      const r = k < 0.5 ? 4 : 2, b = c(PX.blanc);
      T.rect(f.x - r, f.y, r * 2 + 1, 1, b); T.rect(f.x, f.y - r, 1, r + 1, b);
      T.point(f.x - r + 1, f.y - r + 1, b); T.point(f.x + r - 1, f.y - r + 1, b);
    }
  }
}
