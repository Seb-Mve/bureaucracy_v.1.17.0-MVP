import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../../data/acte2/vues';
import * as F from '../../data/acte2/fiche';
import * as P from '../../data/acte2/production';
import { NOTES2 } from '../../data/acte2/notes2';
import { LETTRES_ACTE2, lettreAbsence2 } from '../../data/acte2/courrier2';
import {
  PRESETS_INFO,
  sauvegardePreset,
  type Preset,
} from '../../data/presets';
import { ETAPES } from '../../constants/balanceActe2';
import { articlesDirection } from '../../components/direction/reglementDirection';
import type { GameState } from '../../types/game';

const T = 1_000_000_000;
const INTERDITS = /dossier|parapheur/i;
/** Des moments de l'acte II, de la prise de fonctions à la fin. */
const MOMENTS: Preset[] = [
  'debut',
  'visasEpuises',
  'atelier',
  'achats',
  'avantBoucle',
  'boucle',
  'fin',
];

/** Tout ce que l'acte II écrit à l'écran pour une partie donnée (hors noms propres). */
function textesEcran(s: GameState): string[] {
  const d = V.vueDirection(s, T);
  const sv = V.vueService2(s, T);
  const f = F.vueFiche2(s, T);
  const lignes = P.lignesProduction(s, T) ?? [];
  return [
    ...(d
      ? [
          d.parapheur?.titre ?? '',
          d.parapheur?.attente ?? '',
          d.parapheur?.repart ?? '',
          d.ville,
          d.delivrance.nom,
          ...d.etapes.map((e) => e.nom),
          ...articlesDirection(d, true, 80).flatMap((a) => [a.titre, a.texte]),
        ]
      : []),
    ...(sv
      ? [sv.guichet.description, ...sv.agents.map((a) => a.description)]
      : []),
    ...(f ? f.lignes.flatMap((l) => [l.titre, l.texte]) : []),
    ...lignes.flatMap((l) => [
      l.demandesTexte,
      l.delivresTexte,
      ...(l.valeur ?? []).map((e) => e.texte),
    ]),
    ...LETTRES_ACTE2.map((l) => `${l.objet} ${l.corps(s)}`),
  ];
}

test('acte II : un seul mot, « demande » — ni dossier ni parapheur à l’écran', () => {
  const fixes = [
    ...NOTES2.flatMap((n) => [n.titre, n.texte, n.effet]),
    ...Object.values(ETAPES).flatMap((e) => [e.nom, e.description]),
    lettreAbsence2(3600, 100, 200, T).corps,
    ...PRESETS_INFO.filter((p) => p.titre.startsWith('Acte II')).flatMap(
      (p) => [p.titre, p.detail],
    ),
  ];
  for (const t of fixes) assert.ok(!INTERDITS.test(t), t);
  for (const p of MOMENTS)
    for (const t of textesEcran(sauvegardePreset(p, T)))
      assert.ok(!INTERDITS.test(t), `${p} : ${t}`);
});

test('étapes renommées : « pièce » ne désigne plus que la vérification', () => {
  assert.equal(ETAPES.piece.nom, 'Vérification des pièces');
  assert.equal(ETAPES.pieceService.nom, 'Justificatif exigé');
  for (const e of Object.values(ETAPES))
    if (e.type !== 'piece') assert.ok(!/pièce/i.test(e.nom), e.nom);
});
