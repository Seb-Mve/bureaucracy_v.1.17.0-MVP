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
  trait: 3,
  traitFin: 2,
  rayon: 16,
  rayonPetit: 12,
  ombre: 3,
} as const;
