/**
 * Charte « Pastel Dystopia / Soft-Vector ».
 * Voir la section « Direction visuelle » du document de design.
 */
const Colors = {
  // Fonds
  creme: '#F9F4E0',
  carton: '#E8E0C5',
  papier: '#FFFFFF',
  papierChaud: '#FFF8E8',

  // Encre de l'acte I (bouton poussoir)
  encre: '#E6904E',
  encreOmbre: '#D47A38',
  /** Flanc du bouton poussoir, plus sombre que l'ombre pour donner du relief. */
  encreFlanc: '#C06A2C',
  /** Lumière sur le haut de la face du bouton poussoir. */
  reflet: 'rgba(255,255,255,0.38)',
  encreClaire: '#F3B27E',
  encreFond: '#FDEBD8',
  /** Orange lisible pour du texte (contraste AA sur fond clair). */
  encreTexte: '#A0531C',

  // Secondaire
  bleu: '#5D9CEC',
  bleuOmbre: '#4A89DC',

  // Sémantique et texte
  anthracite: '#2D3436',
  crayon: '#636E72',
  crayonClair: '#9AA3A6',
  vert: '#A3CB38',
  vertClair: '#C8E07A',
  vertEncre: '#4F7A12',
  rouge: '#D63031',
  rougeClair: '#F08A7E',
  rougeFond: '#FDE3DE',
  /** Rouge lisible sur rougeFond. */
  rougeTexte: '#B3261E',
  texteSurEncre: '#FFF8E7',

  // Pastilles pastel (icônes de la fiche de poste, des notes, des fournitures)
  pastelBleu: '#A0C4FF',
  pastelJaune: '#FFEAA7',
  pastelVert: '#C7ECB5',
  /** Papier des documents officiels (Cerfa, circulaires, lettres). */
  papierFiche: '#FFFEF9',
  /** Voile derrière une fenêtre (anthracite translucide). */
  voile: 'rgba(45,52,54,0.55)',

  // Avatars des usagers (cercles pastel)
  avatars: ['#FAB1A0', '#81ECEC', '#FFEAA7', '#A0C4FF', '#C7ECB5', '#E0C3FC'],
} as const;

export default Colors;

export const Fonts = {
  titre: 'Fredoka-SemiBold',
  titreGras: 'Fredoka-Bold',
  texte: 'Nunito-SemiBold',
  texteGras: 'Nunito-ExtraBold',
  chiffres: 'RobotoMono-Bold',
  chiffresRegular: 'RobotoMono-Medium',
} as const;

/** Constructions de la charte : contours, arrondis, ombres dures. */
export const Charte = {
  /** Largeur maximale de l'app et de ses fenêtres sur grand écran (colonne de téléphone, web). */
  largeurColonne: 480,
  trait: 3,
  traitFin: 2,
  /** Cartes, scène, gros boutons. */
  rayon: 18,
  /** Capsules, boutons d'achat, bulles. */
  rayonPetit: 12,
  /** Cases à cocher, empreintes, petits repères. */
  rayonMini: 6,
  ombre: 3,
} as const;

/** Échelle typographique : six tailles (rapport ~1,2 à 1,5 entre deux marches). Rien sous 11. */
export const Typo = {
  micro: 11,
  petit: 13,
  corps: 15,
  titre: 18,
  grand: 24,
  heros: 36,
} as const;

/** Interlignes associés à l'échelle typographique. */
export const Interligne = {
  micro: 15,
  petit: 18,
  corps: 21,
  titre: 24,
  grand: 30,
  heros: 40,
} as const;

/** Grille d'espacement de 4 (marges, retraits, écarts). */
export const Espace = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;
