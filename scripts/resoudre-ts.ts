/**
 * Permet à Node d'exécuter les sources du jeu (imports relatifs sans extension).
 * Utilisé par `npm test` : node --import ./scripts/resoudre-ts.ts --test …
 */
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (e) {
      if (specifier.startsWith('.')) return next(`${specifier}.ts`, context);
      throw e;
    }
  },
});
