import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MoteurDirection } from '../../components/scene/pixel/direction';

/** Bureau du chef dans une zone de `largeur` × `hauteur` pt. */
function bureau(largeur = 358, hauteur = 300, visas = 12, usagers = 18) {
  const m = new MoteurDirection();
  m.redim(largeur, hauteur);
  m.etat({ usagers, visas, guichets: 3, appel: 47 });
  return m;
}

const image = (m: MoteurDirection) => {
  const t = m.peindre();
  assert.ok(t);
  return t.px.slice();
};

test('direction : la scène se dessine entièrement, sans trou, à toutes les tailles', () => {
  for (const [w, h] of [[358, 300], [358, 600], [700, 400], [300, 160], [375, 330]]) {
    const t = bureau(w, h).peindre();
    assert.ok(t);
    let n = 0;
    for (const p of t.px) if (p >>> 24 === 255) n++;
    assert.equal(n, t.px.length, `${w} × ${h}`);
  }
});

test('direction : toute la hauteur du monde, et la corbeille, le chef et la plaque toujours visibles', () => {
  for (const [w, h] of [[375, 330], [375, 460], [358, 300], [700, 400]]) {
    const m = bureau(w, h);
    const gauche = Math.round((176 - m.W) / 2);
    assert.ok(m.H >= 112, `${w} × ${h} : hauteur ${m.H}`);
    assert.ok(gauche <= 18 && gauche + m.W >= 162, `${w} × ${h} : x ${gauche}..${gauche + m.W}`);
  }
});

test('direction : un coup de tampon vise le parapheur et le range', () => {
  const m = bureau();
  for (let i = 0; i < 20; i++) m.avancer(33);
  const avant = image(m);
  m.tamponner();
  for (let i = 0; i < 6; i++) m.avancer(33);
  const pendant = image(m);
  assert.notDeepEqual(pendant, avant);
});

test('direction : sans visa en attente, le tampon ne bouge pas', () => {
  const tape = bureau(358, 300, 0), temoin = bureau(358, 300, 0);
  tape.tamponner();
  for (let i = 0; i < 6; i++) {
    tape.avancer(33);
    temoin.avancer(33);
  }
  assert.deepEqual(image(tape), image(temoin));
});

test('direction : la salle d’attente se vide quand les usagers partent', () => {
  const pleine = bureau(358, 300, 12, 20), vide = bureau(358, 300, 12, 0);
  pleine.avancer(1);
  vide.avancer(1);
  assert.notDeepEqual(image(pleine), image(vide));
});
