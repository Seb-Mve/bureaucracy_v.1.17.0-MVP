/**
 * Géométrie de l'illustration du guichet (assets/scene/).
 * Le bras de l'agent est un calque découpé dans l'illustration d'origine :
 * au repos, il se superpose exactement au fond ; il pivote autour du coude.
 */
export const FOND_GUICHET = require('@/assets/scene/guichet-fond.png');
export const BRAS_GUICHET = require('@/assets/scene/guichet-bras.png');

/** Dimensions de l'image de fond (px). */
const IMAGE = { largeur: 1152, hauteur: 768 };

/** Calque du bras dans le repère de l'image (px), pivot en fraction du calque. */
const BRAS = { x: 430.5, y: 382.5, largeur: 226, hauteur: 163, pivotX: 0.1163, pivotY: 0.318 };

/** Centre de l'empreinte sur le papier du bureau, à droite du tampon posé (px de l'image). */
const EMPREINTE = { x: 668, y: 512 };

/** Bras levé : rotation (degrés, sens antihoraire) et remontée (px de l'image). */
export const LEVEE = { angle: 28, remontee: 8 };

export interface Cadre {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CadresIllustration {
  /** Échelle image → écran. */
  echelle: number;
  fond: Cadre;
  /** Calque du bras, avec son origine de rotation (le coude). */
  bras: Cadre & { transformOrigin: string };
  /** Centre de l'empreinte du tampon sur le papier, dans le repère de la zone. */
  empreinte: { x: number; y: number };
}

/** Cadrage « cover » de l'illustration dans une zone donnée, calque du bras compris. */
export function cadrerIllustration(largeurZone: number, hauteurZone: number): CadresIllustration {
  const echelle = Math.max(largeurZone / IMAGE.largeur, hauteurZone / IMAGE.hauteur);
  const width = IMAGE.largeur * echelle;
  const height = IMAGE.hauteur * echelle;
  const left = (largeurZone - width) / 2;
  const top = (hauteurZone - height) / 2;
  return {
    echelle,
    fond: { left, top, width, height },
    bras: {
      left: left + BRAS.x * echelle,
      top: top + BRAS.y * echelle,
      width: BRAS.largeur * echelle,
      height: BRAS.hauteur * echelle,
      transformOrigin: `${BRAS.pivotX * 100}% ${BRAS.pivotY * 100}%`,
    },
    empreinte: { x: left + EMPREINTE.x * echelle, y: top + EMPREINTE.y * echelle },
  };
}
