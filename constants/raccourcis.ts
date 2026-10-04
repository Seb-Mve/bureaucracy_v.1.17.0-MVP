/**
 * Raccourcis de test sur un build exporté : `EXPO_PUBLIC_RACCOURCIS`, remplacé par sa valeur au build
 * (netlify.toml : aperçus seulement). Chargé uniquement hors développement (voir GameStateContext) :
 * en développement, Expo 53 sans fichier .env plante sur cette variable (« No modules in context »).
 */
export const RACCOURCIS_BUILD = process.env.EXPO_PUBLIC_RACCOURCIS === '1';
