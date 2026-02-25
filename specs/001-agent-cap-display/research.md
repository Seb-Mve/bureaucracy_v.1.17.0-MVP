# Research: Affichage du plafond d'achat des agents

**Feature**: `001-agent-cap-display`
**Date**: 2026-02-25

## Finding 1 — `maxOwned` déjà disponible sur le type `Agent`

**Decision**: Aucun changement de type nécessaire.

**Rationale**: Le champ `maxOwned?: number` a été ajouté à l'interface `Agent` dans `types/game.ts` lors de la feature 003. Il est déjà transmis au composant `AgentItem` via la prop `agent`.

**Alternatives considered**: N/A — le champ existait déjà.

---

## Finding 2 — Couleurs disponibles pour le rendu bi-ton

**Decision**: Numérateur (`x{owned}`) → `Colors.title` (`#4b6c8c`) ; Dénominateur (`/{maxOwned}`) → `Colors.textLight` (`#666666`).

**Rationale**: `Colors.title` est la couleur actuelle du style `ownedText` — cohérence visuelle garantie. `Colors.textLight` est le token atténué standard du projet, déjà utilisé pour les descriptions d'agents (`description` style). Aucun nouveau token couleur requis.

**Alternatives considered**: Créer un nouveau token `Colors.ownedCap` — rejeté, surcharge inutile pour deux éléments déjà disponibles.

---

## Finding 3 — Structure de rendu : un ou deux composants `Text` ?

**Decision**: Deux `Text` inline dans un `View` row pour les agents plafonnés ; `Text` unique conservé pour les agents non plafonnés.

**Rationale**: React Native ne supporte pas les spans inline avec des styles différents dans un seul `Text` (sauf nesting de `Text`). Deux `Text` dans un `View flexDirection:'row'` est le pattern canonique RN pour du texte bi-style sans rupture de ligne. Un `Text` imbriqué dans un `Text` serait également valide mais moins lisible.

**Alternatives considered**: Text imbriqué (`<Text>x3<Text style={light}>/10</Text></Text>`) — valide en RN, mais moins explicite. View row retenu pour la lisibilité.

---

## Finding 4 — Aucun changement dans `/context` ou `/data`

**Decision**: Changement strictement limité à `components/AgentItem.tsx`.

**Rationale**: `agent.maxOwned` est déjà disponible sur la prop `agent`. Pas besoin d'exposer de nouvelle méthode dans `GameStateContext`. Constitution Principle V respecté — la logique d'affichage (« est-ce que cet agent est plafonné ? ») est une dérivation directe d'un champ de la prop, pas une règle métier.

**Alternatives considered**: Ajouter un helper `isAgentCapped(agent)` dans `/data` — rejeté, trivial (`agent.maxOwned !== undefined`), l'inliner dans le composant ne viole pas Principle V.

---

## Finding 5 — `accessibilityLabel` existant à enrichir

**Decision**: Pour les agents plafonnés, remplacer `Possédé: ${agent.owned}` par `Possédé : ${agent.owned} sur ${agent.maxOwned}` dans `getAccessibilityLabel()`.

**Rationale**: AR-006 (spec) exige que les lecteurs d'écran communiquent le plafond. L'existant termine par `Possédé: ${agent.owned}` — il suffit de conditionner ce fragment.

**Alternatives considered**: Ajouter une phrase séparée « Limite : N unités » — rejeté, formuler en une seule phrase est plus fluide pour VoiceOver/TalkBack.
