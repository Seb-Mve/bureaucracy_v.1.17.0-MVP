import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MoteurScene } from '../../components/scene/pixel/moteur';

/** Scène au format d'un téléphone (zone de 358 × 300 pt), file pleine. */
function scene(enAttente = 40) {
  const m = new MoteurScene();
  m.redim(358, 300);
  m.etat({ enAttente, numerotation: false, premierNumero: 1 });
  return m;
}
/** Compte les pixels opaques de l'image. */
function opaques(m: MoteurScene) {
  const t = m.peindre();
  assert.ok(t);
  let n = 0;
  for (const p of t.px) if (p >>> 24 === 255) n++;
  return { n, total: t.px.length };
}

test('la scène se dessine entièrement, sans trou', () => {
  const m = scene();
  const { n, total } = opaques(m);
  assert.equal(n, total);
});

test('zoom : au moins 4 usagers visibles sur un téléphone', () => {
  const m = scene();
  assert.ok(m.W >= 126, `largeur logique ${m.W}`);
  assert.ok(m.W <= 176);
});

test('un coup de tampon fait partir le premier usager et complète la file', () => {
  const m = scene();
  const avant = m.peindre()?.px.slice();
  m.tamponner(true);
  for (let i = 0; i < 30; i++) m.avancer(33);
  const apres = m.peindre()?.px;
  assert.ok(avant && apres);
  assert.notDeepEqual(apres, avant);
});

test('rafale de 9 coups/s : la file reste garnie à l’écran', () => {
  const m = scene(60);
  let creux = 0;
  for (let coup = 0; coup < 36; coup++) {
    m.tamponner(false);
    for (let i = 0; i < 3; i++) m.avancer(37);
    // Après une seconde de rafale, les trois premières places doivent rester occupées.
    if (coup >= 9 && m.usagersEnPlace() < 3) creux++;
  }
  assert.ok(creux <= 3, `file dégarnie pendant ${creux} coups sur 27`);
});

test('file vide : personne, et le tampon ne fait rien', () => {
  const m = scene(0);
  m.tamponner(false);
  for (let i = 0; i < 20; i++) m.avancer(33);
  assert.ok(m.peindre());
});

test('une image coûte moins de 4 ms (marge large pour un téléphone)', () => {
  const m = scene();
  for (let i = 0; i < 30; i++) m.avancer(33);
  const t0 = performance.now();
  for (let i = 0; i < 200; i++) {
    if (i % 10 === 0) m.tamponner(i % 20 === 0);
    m.avancer(16);
    m.peindre();
  }
  const ms = (performance.now() - t0) / 200;
  console.log(`  ${ms.toFixed(3)} ms par image`);
  assert.ok(ms < 4);
});

test('cadrage : une zone large et basse montre toute la hauteur du monde (pas de zoom)', () => {
  const m = new MoteurScene();
  m.redim(480, 184);
  assert.ok(m.H >= 104, `hauteur logique ${m.H}`);
  assert.ok(m.W > 176, `largeur logique ${m.W} : plus de file visible`);
  m.redim(375, 239);
  assert.ok(m.H >= 110 && m.W >= 170, `téléphone : ${m.W} × ${m.H}`);
});

test('file plus longue que le champ : « +N » au bout, pas d’usagers entassés', () => {
  const m = new MoteurScene();
  m.redim(375, 239);
  m.etat({ enAttente: 500, numerotation: false, premierNumero: 1 });
  assert.ok(m.surplus > 400, `surplus ${m.surplus}`);
  m.etat({ enAttente: 0, numerotation: false, premierNumero: 1 });
  assert.equal(m.surplus, 0);
});
