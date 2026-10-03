/**
 * Assemble le moteur de la scène pixel (components/scene/pixel) en un seul script pour les
 * maquettes HTML du dossier DESIGN, sans dépendance : `ScenePixel.MoteurScene` (le guichet, acte I)
 * et `ScenePixel.MoteurDirection` (le bureau du chef, acte II).
 *
 * Usage : node scripts/bundle-scene-pixel.ts <sortie.js> [--acte 2]
 *   --acte 2 : encre bleue de l'acte II (bouton, plaque, tampon, encreur).
 *
 * Sans outil externe : Node retire les types, puis chaque module est enveloppé dans une fonction.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const RACINE = resolve(import.meta.dirname, '..');
/** Modules d'entrée et classe exportée par chacun. */
const ENTREES = { 'components/scene/pixel/moteur.ts': 'MoteurScene', 'components/scene/pixel/direction.ts': 'MoteurDirection' };

/** Encre de l'acte II, appliquée aux couleurs de la charte avant le calcul de la palette pixel. */
const ENCRE_ACTE2 = {
  couleurs: { encre: '#5D9CEC', encreOmbre: '#4A89DC', encreClaire: '#A0C4FF', encreFond: '#EAF2FE', encreTexte: '#2F6DB8' },
  palette: { encreOmbre: '#3A6FB5', plaqueOmbre: '#3A6FB5' },
};

const sortie = process.argv[2];
const acte = process.argv.includes('--acte') ? Number(process.argv[process.argv.indexOf('--acte') + 1]) : 1;
if (!sortie) {
  console.error('Usage : node scripts/bundle-scene-pixel.ts <sortie.js> [--acte 2]');
  process.exit(1);
}

/** Chemin d'un module importé, relatif à la racine du dépôt. */
function resoudre(depuis: string, specifier: string): string {
  const abs = specifier.startsWith('@/') ? join(RACINE, specifier.slice(2)) : resolve(dirname(join(RACINE, depuis)), specifier);
  return relative(RACINE, abs.endsWith('.ts') ? abs : `${abs}.ts`);
}

const IMPORT = /import\s+([\s\S]*?)\s+from\s+'([^']+)';/g;

/** Code d'un module enveloppé : ses imports lus dans le registre, ses exports rangés dans `e`. */
function envelopper(id: string): { code: string; deps: string[] } {
  let code = stripTypeScriptTypes(readFileSync(join(RACINE, id), 'utf8'), { mode: 'strip' });
  const deps: string[] = [];
  code = code.replace(IMPORT, (_, clause: string, spec: string) => {
    const dep = resoudre(id, spec);
    deps.push(dep);
    const lignes: string[] = [];
    const accolades = clause.match(/\{([\s\S]*)\}/);
    const defaut = clause.replace(/\{[\s\S]*\}/, '').replace(',', '').trim();
    if (defaut) lignes.push(`const ${defaut} = R[${JSON.stringify(dep)}].default;`);
    if (accolades) {
      const noms = accolades[1]
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n && !n.startsWith('type '))
        .map((n) => n.replace(/\s+as\s+/, ': '));
      if (noms.length) lignes.push(`const { ${noms.join(', ')} } = R[${JSON.stringify(dep)}];`);
    }
    return lignes.join(' ');
  });
  const exports: string[] = [];
  code = code.replace(/export default (\w+);/, 'e.default = $1;');
  code = code.replace(/export (const|function|class) (\w+)/g, (_, genre: string, nom: string) => {
    exports.push(nom);
    return `${genre} ${nom}`;
  });
  return { code: `${code}\nObject.assign(e, { ${exports.join(', ')} });`, deps };
}

// Modules dans l'ordre des dépendances (parcours en profondeur depuis le moteur).
const ordre: string[] = [];
const codes = new Map<string, string>();
function visiter(id: string) {
  if (codes.has(id)) return;
  const m = envelopper(id);
  codes.set(id, m.code);
  m.deps.forEach(visiter);
  ordre.push(id);
}
Object.keys(ENTREES).forEach(visiter);

const correctifs: Record<string, string> = {};
if (acte === 2) {
  correctifs['constants/Colors.ts'] = `Object.assign(R['constants/Colors.ts'].default, ${JSON.stringify(ENCRE_ACTE2.couleurs)});`;
  correctifs['constants/PalettePixel.ts'] = `Object.assign(R['constants/PalettePixel.ts'].PX, ${JSON.stringify(ENCRE_ACTE2.palette)});`;
}

const corps = ordre
  .map((id) => `// ${id}\nR[${JSON.stringify(id)}] = (() => { const e = {};\n${codes.get(id)}\nreturn e; })();\n${correctifs[id] ?? ''}`)
  .join('\n');

writeFileSync(
  sortie,
  `// Généré par scripts/bundle-scene-pixel.ts${acte === 2 ? ' --acte 2' : ''} : ne pas modifier à la main.\n` +
    `var ScenePixel = (() => {\nconst R = {};\n${corps}\nreturn { ${Object.entries(ENTREES)
      .map(([id, nom]) => `${nom}: R[${JSON.stringify(id)}].${nom}`)
      .join(', ')} };\n})();\n`,
);
console.log(`${sortie} : ${ordre.length} modules (${ordre.join(', ')})`);
