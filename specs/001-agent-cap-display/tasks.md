# Tasks: Affichage du plafond d'achat des agents

**Input**: Design documents from `/specs/001-agent-cap-display/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

**Tests**: Aucune suite de tests dans le projet — validation manuelle via `quickstart.md`.

**Organisation**: Feature atomique (1 user story, 1 fichier). Pas de phase Setup ni Foundational requises — aucune infrastructure à créer.

## Format: `[ID] [P?] [Story] [label?] Description`

- **[P]**: Parallélisable (sections différentes du fichier, pas de dépendance sur une tâche incomplète)
- **[US1]**: User story unique
- **[a11y]**: Accessibilité
- **[i18n]**: Langue française

---

## Phase 1 : US1 — Compteur plafonné dans AgentItem (P1) 🎯 MVP

**Goal**: Les agents avec `maxOwned` affichent `x{owned}/{maxOwned}` avec le dénominateur atténué ; les agents sans limite affichent `x{owned}` comme avant.

**Independent Test**: Ouvrir l'onglet Recrutement → carte Directeur de pôle affiche `x0/10` (dénominateur grisé) → carte Stagiaire administratif affiche `x0` (inchangé).

- [x] T001 [US1] Dans `components/AgentItem.tsx`, ajouter dans `StyleSheet.create({...})` les deux nouveaux styles : `ownedRow: { flexDirection: 'row', alignItems: 'center' }` et `ownedCap: { fontFamily: 'Inter-Bold', fontSize: 14, color: Colors.textLight }` — voir data-model.md §Rendu du compteur

- [x] T002 [US1] Dans `components/AgentItem.tsx`, dans le JSX de `return`, remplacer `<Text style={styles.ownedText}>x{agent.owned}</Text>` (dans `<View style={styles.header}>`) par le bloc conditionnel : si `agent.maxOwned !== undefined` → `<View style={styles.ownedRow}><Text style={styles.ownedText}>x{agent.owned}</Text><Text style={styles.ownedCap}>/{agent.maxOwned}</Text></View>` ; sinon → `<Text style={styles.ownedText}>x{agent.owned}</Text>` (inchangé) — voir data-model.md §Rendu du compteur

- [x] T003 [P] [US1] [a11y] [i18n] Dans `components/AgentItem.tsx`, dans `getAccessibilityLabel()`, conditionner le fragment `Possédé` en fin de chaîne de retour : si `agent.maxOwned !== undefined` → `` `Possédé : ${agent.owned} sur ${agent.maxOwned}` `` ; sinon → `` `Possédé: ${agent.owned}` `` — voir data-model.md §getAccessibilityLabel

**Checkpoint US1**: Directeur de pôle → `x0/10` (grisé). Stagiaire → `x0`. Acheter 3 → `x3/10`. À 10/10 → bouton désactivé. VoiceOver → « Possédé : 0 sur 10 ».

---

## Phase 2 : Polish & Validation

**Purpose**: Lint et validation manuelle des scénarios de `quickstart.md`.

- [x] T004 Exécuter `npm run lint` depuis la racine du repo et corriger toute erreur TypeScript ou ESLint introduite par T001–T003

---

## Dependencies & Execution Order

```
T001 (styles — prérequis pour que T002 compile sans erreur)
  └─→ T002 (JSX conditionnel — référence styles.ownedRow et styles.ownedCap)
T003 [P] (accessibilityLabel — section indépendante, parallélisable avec T002 après T001)
  └─→ T004 (lint — valide l'ensemble)
```

### Parallélisme disponible

- **T002 ‖ T003** : sections différentes du même fichier (JSX `return` vs `getAccessibilityLabel`) — parallélisables une fois T001 terminé

---

## Implementation Strategy

### Stratégie agent solo (séquentiel recommandé)

Exécuter T001 → T002 → T003 → T004

T001 et T002 touchent des zones différentes du fichier (`StyleSheet` vs `return JSX`), mais T001 doit précéder T002 pour éviter les références à des styles inexistants.

---

## Notes

- T001 à T003 modifient tous `components/AgentItem.tsx` — exécuter dans l'ordre pour éviter les conflits.
- T003 est marqué `[P]` car il modifie une fonction (`getAccessibilityLabel`) sans lien structurel avec le JSX de T002. Un agent parallèle peut l'exécuter après T001.
- Aucun changement de type, de contexte ou de données — la feature est entièrement contenue dans ce fichier.
