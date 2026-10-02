import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCompact, formatEntier, formatEuros, formatPourcent } from '../../utils/formatters';

// toLocaleString('fr-FR') sépare les milliers par une espace fine insécable.
const sansEspaces = (s: string) => s.replace(/[\s  ]/g, ' ');

test('quantités : chiffres complets jusqu’à 99 999, puis compact', () => {
  assert.equal(sansEspaces(formatEntier(9540)), '9 540');
  assert.equal(sansEspaces(formatEntier(70440)), '70 440');
  assert.equal(formatEntier(124560), '124 k');
  assert.equal(formatEntier(401190), '401 k');
  assert.equal(formatEntier(4471000), '4,47 M');
});

test('montants : même règle que les quantités', () => {
  assert.equal(formatEuros(4.567), '4,56');
  assert.equal(formatEuros(9.1), '9,10');
  assert.equal(formatEuros(0.2), '0,20');
  assert.equal(sansEspaces(formatEuros(60000 / 10)), '6 000');
  assert.equal(sansEspaces(formatEuros(60000)), '60 000');
  assert.equal(formatEuros(120000), '120 k');
  assert.equal(formatEuros(401190.42), '401 k');
});

test('compact : arrondi vers le bas, sans zéros inutiles, au plus 4 chiffres', () => {
  assert.equal(formatCompact(1999), '1,99 k');
  assert.equal(formatCompact(999999), '999 k');
  assert.equal(formatCompact(4500000), '4,5 M');
  assert.equal(formatCompact(2e9), '2 Md');
  for (const v of [10000, 99999, 123456, 7654321, 98765432]) {
    assert.ok(formatCompact(v).replace(/[^0-9]/g, '').length <= 3, formatCompact(v));
  }
});

test('pourcentage à une décimale', () => {
  assert.equal(formatPourcent(0.24), '0,2');
  assert.equal(formatPourcent(100), '100,0');
  assert.equal(formatPourcent(99.99), '99,9');
});
