# Feature Specification: Rééquilibrage des administrations et de la conformité aléatoire

**Feature Branch**: `003-admin-rebalance`
**Created**: 2026-02-25
**Status**: Draft
**Input**: Règles complètes des 5 administrations (agents, coûts, production, bonus, plafonds) + système de conformité aléatoire (condition d'affichage, activation, formule de progression exponentielle par bracket de 5%).

---

## Clarifications

### Session 2026-02-25

- Q: Les formulaires produits en excès (stockage plein) comptent-ils dans l'accumulation de conformité ? → A: Non — seuls les formulaires effectivement stockés comptent (Option A).
- Q: Que se passe-t-il quand la conformité atteint 100 % ? → A: Le bouton phase 2 s'active. Au clic, un message placeholder s'affiche (ex. "Vous allez bientôt être promu dans la bureaucratie"). Le système phase 2 complet n'est pas dans le scope de cette feature.
- Q: Le "coût de déverrouillage" des administrations est-il un coût réel déduit ou un simple seuil d'éligibilité ? → A: Coût réel — les ressources sont dépensées au moment du clic de déverrouillage (comportement actuel conservé).
- Q: Sur clics répétés sur le bouton phase 2 à 100 % — le message réapparaît-il ? → A: Oui — un toast s'affiche à chaque clic, comportement idempotent.
- Q: Pour les agents dont le bonus est "+X% toute production (local)" (ex. Directeur de pôle), le bonus s'applique-t-il uniquement aux agents de la même administration ou à toutes les administrations ? → A: Uniquement à l'administration d'appartenance. Un bonus `isGlobal: false, target: 'all'` multiplie toute la production locale (dossiers + tampons + formulaires) de l'administration de l'agent, et n'a aucun effet sur les autres administrations.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Progression fluide à travers les 5 administrations (Priority: P1)

Le joueur débute avec le Bureau des Documents Obsolètes disponible, puis débloque chaque administration en atteignant les seuils requis. Chaque administration propose des agents dont les coûts, productions et bonus correspondent exactement aux règles définies.

**Why this priority**: C'est le cœur de la boucle de jeu. Si les coûts ou productions sont incorrects, toute la progression est brisée.

**Independent Test**: Démarrer une nouvelle partie, acheter tous les agents disponibles du Bureau des Documents Obsolètes, vérifier que leurs productions et bonus correspondent aux règles. Répéter pour chaque administration après déverrouillage.

**Acceptance Scenarios**:

1. **Given** une nouvelle partie, **When** le joueur ouvre le recrutement, **Then** seul le Bureau des Documents Obsolètes est disponible, avec ses 5 agents aux coûts et productions exacts.
2. **Given** le joueur a atteint 1 000 tampons au total, **When** il consulte le recrutement, **Then** le Service des Tampons Tamponnés est déverrouillé.
3. **Given** le joueur a atteint 15 000 tampons au total, **When** il consulte le recrutement, **Then** la Cellule de Double Vérification est déverrouillée.
4. **Given** le joueur a atteint 5 000 formulaires au total, **When** il consulte le recrutement, **Then** la Division de l'Archivage Physique est déverrouillée.
5. **Given** le joueur a atteint 10 000 formulaires au total, **When** il consulte le recrutement, **Then** l'Agence de Redondance Non Justifiée est déverrouillée.
6. **Given** un agent avec bonus local acheté, **When** le joueur observe la production, **Then** le bonus n'affecte que son administration d'appartenance.
7. **Given** un agent avec bonus global acheté, **When** le joueur observe la production, **Then** le bonus affecte toutes les administrations déverrouillées.

---

### User Story 2 — Plafonds d'achat respectés (Priority: P2)

Certains agents ont un nombre maximum d'unités achetables. Le joueur ne peut pas dépasser ce plafond.

**Why this priority**: Sans ce plafond, les bonus de production exploseraient et casseraient l'équilibre du jeu.

**Independent Test**: Acheter un agent plafonné jusqu'au maximum, puis tenter un achat supplémentaire — le bouton doit être désactivé.

**Acceptance Scenarios**:

1. **Given** un agent avec un plafond de 10 unités déjà atteint, **When** le joueur tente un achat supplémentaire, **Then** le bouton d'achat est désactivé.
2. **Given** un agent plafonné à 5 unités avec 4 achetées, **When** le joueur achète la 5ème, **Then** le bouton d'achat se désactive immédiatement.

---

### User Story 3 — Escalade de prix par tranches de 10 achats (Priority: P2)

À chaque tranche de 10 unités achetées d'un même agent, son coût augmente de 9 % (arrondi à l'entier supérieur).

**Why this priority**: Mécanisme fondamental d'équilibre économique — il rend chaque agent progressivement plus coûteux et ralentit l'automatisation.

**Independent Test**: Acheter 10 unités d'un même agent, vérifier que le coût à la 11ème unité est `ceil(coût_base × 1,09)`.

**Acceptance Scenarios**:

1. **Given** un Stagiaire administratif au coût de base 50 dossiers, **When** le joueur en possède 10, **Then** le coût de la prochaine unité est 55 dossiers (`ceil(50 × 1,09)`).
2. **Given** un agent dont le joueur possède 20 unités, **When** il consulte le prix, **Then** le coût est `ceil(coût_base × 1,09²)`.
3. **Given** un agent avec un plafond d'achat en approche du maximum, **When** l'escalade s'applique, **Then** le prix escaladé est correctement affiché jusqu'au plafond.

---

### User Story 4 — Activation et progression de la conformité aléatoire (Priority: P1)

Le widget de conformité apparaît dès que la 5ème administration est débloquée. Une fois les ressources rassemblées, le joueur active le système. La progression monte passivement selon la formule exponentielle par bracket de 5%.

**Why this priority**: C'est le second système de progression majeur du jeu, indispensable pour la mécanique de prestige aval.

**Independent Test**: Débloquer la 5ème administration, vérifier l'affichage du widget, activer, produire des formulaires et observer la montée du % selon la formule.

**Acceptance Scenarios**:

1. **Given** les 4 premières administrations débloquées mais pas la 5ème, **When** le joueur consulte l'écran principal, **Then** le widget de conformité n'est pas visible.
2. **Given** la 5ème administration débloquée, **When** le joueur consulte l'écran principal, **Then** le widget de conformité est visible.
3. **Given** le widget visible avec < 40 000 tampons ou < 10 000 formulaires, **When** le joueur consulte le bouton d'activation, **Then** ce bouton est désactivé.
4. **Given** le joueur possède ≥ 40 000 tampons et ≥ 10 000 formulaires, **When** il clique sur le bouton d'activation, **Then** 40 000 tampons et 10 000 formulaires sont déduits, `percentage = 0` et l'accumulation démarre.
5. **Given** la conformité activée, **When** 10 000 formulaires ont été produits depuis l'activation (bracket 0–4 %), **Then** la progression affiche 1 %.
6. **Given** la conformité à exactement 5 %, **When** 11 000 formulaires supplémentaires sont produits (bracket 5–9 %), **Then** la progression affiche 6 %.
7. **Given** la conformité activée, **When** ~2 863 745 formulaires au total ont été accumulés depuis l'activation, **Then** la progression atteint 100 %.

---

### Edge Cases

- Que se passe-t-il si le joueur possède exactement 40 000 tampons et 10 000 formulaires lors de l'activation ? Les deux ressources tombent à zéro.
- Que se passe-t-il à la frontière exacte entre deux brackets de conformité (ex. accumulation = 50 000 formulaires, juste au seuil du bracket 5 %) ?
- Que se passe-t-il si le joueur clique plusieurs fois de suite sur le bouton phase 2 à 100 % ? (le message doit-il réapparaître ou être idempotent ?)
- Que se passe-t-il si un joueur possède déjà plus d'unités d'un agent que le nouveau plafond lors d'une mise à jour (migration de save) ?
- Les formulaires qui dépassent le plafond de stockage et ne sont pas stockés contribuent-ils à l'accumulation de conformité ?

---

## Requirements *(mandatory)*

### Functional Requirements — Déverrouillage des administrations

- **FR-001**: Le Bureau des Documents Obsolètes DOIT être déverrouillé dès le début, sans coût.
- **FR-002**: Le bouton de déverrouillage du Service des Tampons Tamponnés DOIT devenir actif quand le joueur possède ≥ 1 000 tampons. Au clic, 1 000 tampons sont déduits.
- **FR-003**: Le bouton de déverrouillage de la Cellule de Double Vérification DOIT devenir actif quand le joueur possède ≥ 15 000 tampons. Au clic, 15 000 tampons sont déduits.
- **FR-004**: Le bouton de déverrouillage de la Division de l'Archivage Physique DOIT devenir actif quand le joueur possède ≥ 5 000 formulaires. Au clic, 5 000 formulaires sont déduits.
- **FR-005**: Le bouton de déverrouillage de l'Agence de Redondance Non Justifiée DOIT devenir actif quand le joueur possède ≥ 10 000 formulaires. Au clic, 10 000 formulaires sont déduits.

### Functional Requirements — Définition des agents

- **FR-006**: Chaque agent DOIT avoir exactement le coût de base, le taux de production (ou bonus) et le plafond définis dans les tableaux ci-dessous.
- **FR-007**: Un bonus `isGlobal: false` DOIT n'affecter que la production de l'administration où l'agent est recruté — quelle que soit la ressource ciblée. Un bonus local avec `target: 'all'` multiplie toute la production (dossiers + tampons + formulaires) de cette seule administration. Ceci nécessite une correction du moteur de calcul de production existant, qui ignore actuellement la combinaison `isGlobal: false, target: 'all'`.
- **FR-008**: Un bonus `isGlobal: true` DOIT affecter la production de toutes les administrations déverrouillées.
- **FR-009**: Un agent plafonné DOIT bloquer tout achat supplémentaire une fois le maximum atteint — le bouton d'achat est désactivé.

#### Bureau des Documents Obsolètes

| Agent | Coût | Effet | Plafond |
|---|---|---|---|
| Stagiaire administratif | 50 dossiers | +0,5 dossiers/s | — |
| Assistant administratif | 250 dossiers | +0,2 tampons/s | — |
| Superviseur de section | 200 tampons | +10 % production dossiers (local) | 10 |
| Chef de validation | 500 tampons | +0,1 formulaires/s | — |
| Directeur de pôle | 100 formulaires | +5 % toute production (local) | 10 |

#### Service des Tampons Tamponnés

| Agent | Coût | Effet | Plafond |
|---|---|---|---|
| Tamponneur débutant | 300 dossiers | +0,4 tampons/s | — |
| Tamponneur expérimenté | 800 dossiers | +1 tampon/s | — |
| Chef de poste tamponnage | 300 tampons | +5 % production tampons (local) | 10 |
| Contrôleur de conformité | 1 500 tampons | +0,3 formulaires/s | — |
| Coordinateur tamponnage | 200 formulaires | +3 % toute production (global) | 10 |

#### Cellule de Double Vérification

| Agent | Coût | Effet | Plafond |
|---|---|---|---|
| Vérificateur auxiliaire | 200 dossiers | +0,5 tampons/s | — |
| Analyste de conformité | 500 dossiers | +0,6 tampons/s | — |
| Contrôleur en chef | 300 tampons | +10 % production tampons (local) | 5 |
| Archiviste certifié | 200 tampons | +1 tampon/s | — |
| Coordinateur qualité | 300 formulaires | +10 % toute production (global) | 5 |

#### Division de l'Archivage Physique

| Agent | Coût | Effet | Plafond |
|---|---|---|---|
| Agent de rangement | 500 tampons | +0,3 formulaires/s | — |
| Archiviste méthodique | 1 000 tampons | +0,5 formulaires/s | — |
| Responsable des étagères | 350 formulaires | +15 % production formulaires (local) | 5 |
| Inspecteur des normes | 500 tampons | +1 formulaire/s | — |
| Chef de l'archivage | 400 formulaires | +20 % toute production (global) | 5 |

#### Agence de Redondance Non Justifiée

| Agent | Coût | Effet | Plafond |
|---|---|---|---|
| Assistant à la duplication | 500 dossiers | +5 dossiers/s | — |
| Répétiteur administratif | 1 200 dossiers | +8 dossiers/s | — |
| Chef de section copié-collé | 350 tampons | +10 % production tampons (local) | 5 |
| Responsable de la sur-validation | 250 formulaires | +1 formulaire/s | — |
| Grand redondant suprême | 500 formulaires | +15 % toute production (global) | 3 |

### Functional Requirements — Escalade de prix

- **FR-010**: Le coût d'achat d'un agent DOIT suivre la formule `ceil(coût_base × 1,09^floor(owned / 10))`, appliquée avant chaque achat.
- **FR-011**: L'escalade s'arrête naturellement quand le plafond d'achat est atteint.

### Functional Requirements — Conformité aléatoire

- **FR-012**: Le widget de conformité DOIT être visible si et seulement si l'Agence de Redondance Non Justifiée est déverrouillée.
- **FR-013**: Le bouton d'activation DOIT être actif uniquement quand `tampons ≥ 40 000 ET formulaires ≥ 10 000 ET isActivated === false`.
- **FR-014**: Au clic sur l'activation, le système DOIT déduire 40 000 tampons et 10 000 formulaires, puis initialiser `percentage = 0` et `accumulatedFormulaires = 0`.
- **FR-015**: Une fois activée, la progression DOIT augmenter passivement en fonction des formulaires **effectivement stockés** (production nette après application du plafond de stockage), selon la formule : `coût pour +1 % = 10 000 × (1,1)^⌊ percentage / 5 ⌋`. Les formulaires produits quand le stockage est plein ne comptent pas.
- **FR-015b**: Quand `percentage === 100`, le bouton phase 2 DOIT être actif et cliquable. Au clic, un toast DOIT s'afficher à chaque fois — ex. *"Vous allez bientôt être promu dans la bureaucratie"* — sans déclencher aucun autre effet. Le bouton reste actif indéfiniment (comportement idempotent). Le système phase 2 est hors scope de cette feature.
- **FR-016**: Les brackets de coût DOIVENT être :

| Bracket | Tranche | Coût par 1 % |
|---|---|---|
| 0 | 0–4 % | 10 000 formulaires |
| 1 | 5–9 % | 11 000 formulaires |
| 2 | 10–14 % | 12 100 formulaires |
| 3 | 15–19 % | 13 310 formulaires |
| ... | ... | × 1,1 |
| 19 | 95–99 % | 61 159 formulaires |

- **FR-017**: La progression DOIT être plafonnée à 100 %. Le total cumulé pour atteindre 100 % depuis l'activation est ~2 863 745 formulaires produits.

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Tous les boutons d'achat d'agents DOIVENT avoir une zone tactile minimum de 44×44pt.
- **AR-002**: L'état désactivé (plafond atteint, ressources insuffisantes) DOIT être indiqué visuellement ET via un `accessibilityState`, pas uniquement par la couleur.
- **AR-003**: La progression de conformité DOIT avoir un `accessibilityLabel` mis à jour dynamiquement.

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Tous les noms d'agents DOIVENT être en français avec accents corrects.
- **LR-002**: Les coûts et productions DOIVENT utiliser le formatage numérique français (espace séparateur de milliers, virgule pour les décimales).
- **LR-003**: Les noms d'administrations DOIVENT refléter la terminologie bureaucratique française authentique telle que définie dans cette spec.

### Key Entities

- **Agent** : Unité recrutée. Attributs clés : nom, coût de base par ressource, production de base (par ressource et par seconde), bonus (optionnel : ressource ciblée, valeur en %, portée local/global), nombre possédé, plafond maximum d'achat.
- **Administration** : Groupe d'agents. Attributs clés : condition de déverrouillage (seuil de ressource), statut déverrouillé, liste d'agents.
- **ConformiteState** : État du système. Attributs clés : `isActivated`, `percentage` (0–100), `accumulatedFormulaires` (compteur depuis l'activation).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les 25 agents répartis en 5 administrations sont disponibles avec les coûts, productions et bonus exacts — vérifiable en inspection directe des données de jeu.
- **SC-002**: Les 5 seuils de déverrouillage des administrations correspondent exactement aux valeurs définies (0, 1 000 tampons, 15 000 tampons, 5 000 formulaires, 10 000 formulaires).
- **SC-003**: Le coût à la 11ème unité de tout agent sans plafond est exactement `ceil(coût_base × 1,09)`, vérifié sur au moins 3 agents représentatifs.
- **SC-004**: Aucun agent plafonné ne peut être acheté au-delà de son maximum — bouton désactivé à l'unité N+1 pour chaque agent concerné.
- **SC-005**: Après activation, accumuler exactement 10 000 formulaires affiche 1 %, et passer de 5 % avec 11 000 formulaires supplémentaires affiche 6 % — les brackets sont correctement calculés.
- **SC-006**: Le widget de conformité n'est pas visible avant le déverrouillage de la 5ème administration et apparaît immédiatement après.

---

## Assumptions

- La migration de save pour les joueurs ayant déjà des agents au-delà des nouveaux plafonds n'est pas dans le scope de cette spec : les agents en surplus restent fonctionnels mais aucun achat supplémentaire n'est possible.
- Les formulaires qui dépassent le plafond de stockage et ne sont pas stockés ne contribuent PAS à l'accumulation de conformité. Le code actuel utilise la production brute — ce comportement devra être corrigé pour utiliser uniquement les formulaires effectivement stockés.
- L'escalade de 9 % s'applique sur le nombre total d'unités achetées depuis le début de la partie, pas par session.
- Les conditions de déverrouillage des administrations sont basées sur les ressources **actuellement détenues** par le joueur (pas les maximums historiques). Les ressources sont dépensées au moment du clic.
