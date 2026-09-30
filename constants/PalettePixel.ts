/**
 * Palette de la scène en pixel art du guichet.
 * Tirée de la charte (constants/Colors.ts) ; chaque matière a une rampe
 * clair → foncé, avec des ombres décalées vers le violet.
 */
import Colors from '@/constants/Colors';

export const PX = {
  contour: Colors.anthracite,
  blanc: '#FFFFFF',
  encre: Colors.encre,
  encreOmbre: '#C06A2C',
  encreClaire: Colors.encreClaire,
  texteCreme: '#FFF8E8',
  plaqueOmbre: '#B8602A',
  rouge: Colors.rouge,
  rougeClair: Colors.rougeClair,
  vert: Colors.vert,
  vertEncre: Colors.vertEncre,
  bleu: Colors.bleu,
  gris: '#9AA3A6',
  lignePapier: '#B8BEC2',
  bouche: '#94463A',
  boucheAgent: '#8A3E32',
  boucheOuverte: '#C8544A',
  monture: '#3E3530',
  bois: ['#F7CB8C', '#E9A865', '#CF8748', '#AA6631', '#7C4520'],
  mur: ['#FCF0CC', '#F6E3B2', '#EDD49B', '#DDBF82'],
  plafond: '#EAD39A',
  sauge: ['#D8DCB6', '#C4CA9F', '#AAB287', '#8C946C'],
  sol: ['#F0D197', '#E6C07F', '#D9AC68', '#C49356'],
  soleil: '#FFF7DA',
  chrome: ['#F6F8F9', '#CDD5D8', '#9AA6AB', '#6C777C'],
  sangle: ['#F6B27A', '#E6904E', '#C06A2C'],
  liege: ['#DDAA70', '#C99258', '#AE7843'],
  papier: ['#FFFFFF', '#F4F0E4', '#DDD6C4'],
  postit: ['#FAD2C6', '#FFF1B8'],
  ciel: ['#EAF6FB', '#CDE8F5', '#AED7EC'],
  immeubles: '#C3CFD6',
  stores: ['#F4EEDF', '#D9CFB8', '#B9AE94'],
  feuillage: ['#BCD37A', '#93B356', '#6A8C3E', '#4A682C'],
  terre: ['#F09A5A', '#D0773A', '#A55A28'],
  chemise: ['#FFFFFF', '#F2EDE2', '#D9D0BD', '#B9AD96'],
  peauAgent: ['#FFE6C6', '#F8D2A6', '#E3B383', '#C99468'],
  cheveuxAgent: ['#B07A40', '#8B5A2B', '#6B4220', '#4E2E14'],
  chaise: ['#A2724A', '#83573A', '#664028', '#4C2E1C'],
  beige: ['#F3EAD3', '#DDD0B0', '#BFAF89', '#9A8B68'],
  ecran: '#24413A',
  ecranTexte: '#8CF0A8',
  ecranLueur: ['#B4F0C8', '#E0FCEA'],
  encreur: '#4A4458',
  cafe: '#7A4A2A',
  pommeau: ['#EDBB82', '#C98746', '#9A5A2A'],
  manche: ['#9A5E34', '#8A5230', '#6A3C20'],
  semelle: '#5A3A30',
  chemiseCartonnee: ['#F6CF80', '#F2BE62', '#D9973F'],
  chaussures: ['#7A665A', '#463830'],
  sac: '#B5584A',
  canne: '#8A5A3A',
  horlogeCadran: '#FFFDF5',
  afficheurFond: '#2B2528',
  afficheurEteint: '#4A2E2E',
  afficheurAllume: '#FF6A55',
  poussiere: '#E8D6AE',
  ombrePieds: '#8C5A28',
  vitre: '#D6EEF3',
  basVitre: '#9FB9BF',
  neonEteint: '#CFCBBE',
  neonLueur: '#FFFCEB',
  boitierNeon: '#E4E0D4',
  joue: '#F07A6A',
  cadreDore: ['#F2D27A', '#E2B654'],
  costume: '#3E4A5E',
  cheveux: ['#E2E0DA', '#D2CFC6'],
  drapeau: ['#3B5BA9', '#D63031'],
  colere: '#E0503C',
  bulleColere: Colors.rouge,
  bulleNote: Colors.vertEncre,
} as const;

export const PEAUX = [
  ['#FFE6CC', '#F6D0A8', '#E2B086', '#C8926A'],
  ['#F8D6B2', '#E9B98E', '#CF9A6E', '#B07C55'],
  ['#E6B485', '#CC9462', '#AE7646', '#8C5A32'],
  ['#BE8558', '#9E6840', '#7E4F2C', '#5E3820'],
  ['#916043', '#744A30', '#583620', '#3E2414'],
];
export const CHEVEUX = [
  ['#A8743C', '#865628', '#653E1C', '#472812'],
  ['#5A534C', '#403A35', '#2C2825', '#1C1A18'],
  ['#F4DA90', '#E2BC62', '#C49A42', '#9C762E'],
  ['#E08A48', '#BE6A30', '#944C20', '#6C3414'],
  ['#F0EEE8', '#D2CFC6', '#AEAAA0', '#8A867C'],
  ['#9C4A3A', '#7A3428', '#5A241C', '#3E1812'],
];
/** Teintes de base des vêtements (rampées à l'usage). */
export const HAUTS = ['#FAB1A0', '#81ECEC', '#FFEAA7', '#A0C4FF', '#C7ECB5', '#E0C3FC', '#E6904E', '#5D9CEC', '#D98E8E', '#7FB685', '#B39CD0', '#F2C14E', '#E17055', '#8E9AAF'];
export const BAS = ['#6F7F92', '#7B6A58', '#5E6E5A', '#8A6F8C', '#4F5A66'];
export const CASQUETTES = ['#5D9CEC', '#D63031', '#4F7A12', '#636E72'];
/** Usagers « numérotés » : sans visage, tout en gris. */
export const GRIS = {
  peau: ['#DCD8CB', '#CBC6B6', '#B6B09E', '#9E9884'],
  cheveux: ['#C2BEB0', '#AEA999', '#968F7E', '#7C7666'],
  haut: ['#E4E0D2', '#D3CEBE', '#BCB6A4', '#A29B88'],
  bas: ['#B0ABA0', '#9A958A', '#837E72', '#6B665B'],
};
/** Rampe à ombres décalées vers le violet. */
export const TEINTE_CLAIRE = '#FFFBEA';
export const TEINTE_OMBRE = '#5B4062';
export const TEINTE_NOIRE = '#3A2A40';
