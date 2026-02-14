# Feature Specification: Conformité Aléatoire System Update

**Feature Branch**: `001-compliance-system-update`  
**Created**: 2025-01-23  
**Status**: Draft  
**Input**: User description: "Mise à jour complète du système de Conformité Aléatoire dans le spec avec les nouvelles règles définies par l'utilisateur."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Progressive Unlock Discovery (Priority: P1)

Un joueur progresse dans le jeu et débloque les cinq administrations une par une. Après avoir débloqué la cinquième et dernière administration, un nouveau système mystérieux apparaît avec un bouton "Activer la conformité". Le joueur ne sait pas ce que cela coûte ni ce que cela fait exactement, créant une tension entre curiosité et prudence.

**Why this priority**: C'est le point d'entrée obligatoire du système. Sans ce mécanisme de découverte et d'activation initiale, aucune autre fonctionnalité n'est accessible. C'est la première interaction critique qui établit le mystère et l'engagement du système.

**Independent Test**: Peut être testé en jouant jusqu'au déblocage de la 5ème administration, vérifiant l'apparition du bouton, et tentant de l'activer avec différents niveaux de ressources (< 40k tampons, < 10k formulaires, exactement le seuil, au-dessus du seuil).

**Acceptance Scenarios**:

1. **Given** le joueur a débloqué les 4 premières administrations, **When** il consulte l'interface, **Then** le système de Conformité Aléatoire n'est pas visible
2. **Given** le joueur débloque la 5ème administration, **When** il consulte l'interface, **Then** le système de Conformité Aléatoire apparaît avec un bouton "Activer la conformité"
3. **Given** le bouton "Activer la conformité" est visible et le joueur a 35 000 tampons et 8 000 formulaires, **When** il clique sur le bouton, **Then** le bouton reste grisé/inactif et rien ne se passe
4. **Given** le bouton est visible et le joueur a exactement 40 000 tampons et 10 000 formulaires, **When** il clique sur le bouton, **Then** ses ressources diminuent à 0 tampons et 0 formulaires, la conformité démarre à 0%, et la barre de progression apparaît
5. **Given** le système est activé, **When** le joueur consulte l'interface, **Then** aucune indication de coût d'activation n'est affichée (mystery mechanic préservée)

---

### User Story 2 - Passive Progression Observation (Priority: P2)

Une fois le système de conformité activé, le joueur observe que sa barre de progression augmente automatiquement au fil du temps, en relation avec sa production de formulaires. Plus il progresse, plus il remarque que le rythme ralentit, créant une tension entre investissement et récompense.

**Why this priority**: C'est le cœur de la mécanique de progression. Une fois le système activé, c'est l'expérience principale que le joueur vit avec la conformité. Sans cette progression passive, le système n'a aucune dynamique.

**Independent Test**: Activer le système, produire des formulaires à un rythme constant, et observer l'augmentation de la barre de conformité. Comparer les vitesses de progression entre 0-10%, 10-20%, et 80-90% pour valider l'augmentation exponentielle du coût.

**Acceptance Scenarios**:

1. **Given** la conformité est à 0% et le joueur produit 1 000 formulaires, **When** la production est comptabilisée, **Then** la conformité augmente de 1%
2. **Given** la conformité est à 15% et le joueur produit 1 100 formulaires, **When** la production est comptabilisée, **Then** la conformité augmente de 1%
3. **Given** la conformité est à 55% et le joueur produit 1 771 formulaires (formule: 1000 × 1.1^5), **When** la production est comptabilisée, **Then** la conformité augmente de 1%
4. **Given** la conformité est à 9% et le joueur produit exactement 10 000 formulaires depuis l'activation, **When** la production est comptabilisée, **Then** la conformité passe à 10%
5. **Given** la conformité est à 89% et le joueur produit tous les formulaires nécessaires pour atteindre 100%, **When** la conformité atteint 100%, **Then** le bouton "Réaffectation différée" (Phase 2) apparaît

---

### User Story 3 - Mystery Mechanic Experience (Priority: P3)

Le joueur interagit avec le système de conformité sans jamais voir de coûts affichés explicitement. Il doit découvrir par l'expérience et l'observation que les formulaires sont consommés automatiquement, et que le coût augmente progressivement.

**Why this priority**: Cette priorité soutient l'expérience unique du jeu en préservant le mystère. Bien que moins critique pour la fonctionnalité de base, elle est essentielle pour l'expérience utilisateur visée et la cohérence thématique.

**Independent Test**: Observer l'interface du système de conformité à différents stades de progression et vérifier qu'aucun coût, formule ou indication de consommation n'est jamais affiché explicitement.

**Acceptance Scenarios**:

1. **Given** le bouton "Activer la conformité" est visible, **When** le joueur survole ou consulte le bouton, **Then** aucun coût ou prérequis n'est affiché
2. **Given** la conformité est en cours de progression, **When** le joueur consulte la barre de progression, **Then** seul le pourcentage actuel est affiché, sans indication du coût en formulaires
3. **Given** la conformité passe de 9% à 10%, **When** la tranche change, **Then** aucune notification ou indication de changement de coût n'est affichée
4. **Given** le joueur produit des formulaires avec la conformité active, **When** les formulaires sont consommés par la progression, **Then** seul le compteur de ressources global change, sans explication contextuelle

---

### Edge Cases

- **Activation avec ressources exactes**: Que se passe-t-il si le joueur a exactement 40 000 tampons et 10 000 formulaires et clique sur "Activer la conformité" ? → Le système doit consommer les ressources et activer la conformité à 0%.

- **Activation avec ressources insuffisantes**: Que se passe-t-il si le joueur n'a pas assez de ressources et tente de cliquer sur le bouton ? → Le bouton doit être grisé/désactivé et ne pas répondre au clic. Aucun message d'erreur explicite n'est affiché (mystery mechanic).

- **Progression avec production simultanée de formulaires**: Si le joueur produit un grand nombre de formulaires d'un coup (par exemple via un multiplicateur ou bonus), la conformité doit progresser par paliers de 1% de manière fluide, en consommant les formulaires selon la formule appropriée pour chaque tranche.

- **Atteinte de 100% avec surplus de formulaires**: Si le joueur produit plus de formulaires que nécessaire pour atteindre 100%, le surplus n'est pas perdu mais reste dans les ressources globales. La conformité s'arrête simplement à 100%.

- **Redémarrage du jeu après activation**: Une fois la conformité activée, l'état doit persister entre les sessions. Le système ne doit jamais permettre de "réactiver" ou "réinitialiser" la conformité sans interaction spécifique (non définie dans cette spec).

- **Conformité à 0% versus système non activé**: Il doit y avoir une distinction claire dans la persistance entre "système jamais activé" et "système activé à 0%". La barre de progression n'apparaît que dans le second cas.

- **Déblocage de la 5ème administration pendant que le joueur consulte une autre vue**: Si le joueur débloque la 5ème administration alors qu'il n'est pas sur la vue où le système apparaît, le système doit être visible immédiatement lorsqu'il revient sur cette vue, sans nécessiter un rechargement.

## Requirements *(mandatory)*

### Functional Requirements

#### Unlock & Activation

- **FR-001**: Le système de Conformité Aléatoire DOIT apparaître UNIQUEMENT après que le joueur ait débloqué la 5ème administration (dernière administration du jeu)
- **FR-002**: Avant activation, le système DOIT afficher un bouton avec le label "Activer la conformité" (ou formulation similaire en français authentique)
- **FR-003**: Le bouton "Activer la conformité" DOIT être cliquable SEULEMENT si les ressources actuelles du joueur sont ≥ 40 000 tampons ET ≥ 10 000 formulaires
- **FR-004**: Lorsque le joueur clique sur le bouton avec les ressources suffisantes, le système DOIT déduire exactement 40 000 tampons et 10 000 formulaires des ressources actuelles
- **FR-005**: Après l'activation réussie, le système DOIT afficher une barre de progression de conformité initialisée à 0%
- **FR-006**: Le bouton "Activer la conformité" DOIT disparaître après activation réussie et ne DOIT jamais réapparaître
- **FR-007**: Aucun coût ou prérequis de ressources ne DOIT être affiché sur le bouton ou dans l'interface avant ou après l'activation (mystery mechanic)

#### Progression Passive

- **FR-008**: La conformité DOIT progresser UNIQUEMENT de manière passive, basée sur la production de formulaires du joueur
- **FR-009**: Le coût en formulaires pour augmenter la conformité de 1% DOIT suivre la formule: `coût_par_% = 1000 × (1.1)^(tranche_actuelle)`  
  où `tranche_actuelle` = floor(conformité_actuelle / 10)
- **FR-010**: Les tranches de progression DOIVENT être définies comme suit:
  - Tranche 0 (0-9%): 1 000 formulaires par point de %
  - Tranche 1 (10-19%): 1 100 formulaires par point de %
  - Tranche 2 (20-29%): 1 210 formulaires par point de %
  - Tranche 3 (30-39%): 1 331 formulaires par point de %
  - Tranche 4 (40-49%): 1 464 formulaires par point de %
  - Tranche 5 (50-59%): 1 610 formulaires par point de %
  - Tranche 6 (60-69%): 1 771 formulaires par point de %
  - Tranche 7 (70-79%): 1 948 formulaires par point de %
  - Tranche 8 (80-89%): 2 143 formulaires par point de %
  - Tranche 9 (90-99%): 2 357 formulaires par point de %
- **FR-011**: Le système DOIT consommer les formulaires produits automatiquement pour faire progresser la conformité, sans action manuelle du joueur
- **FR-012**: La conformité ne DOIT PAS dépasser 100%
- **FR-013**: Lorsque la conformité atteint exactement 100%, le bouton "Réaffectation différée" (Phase 2) DOIT apparaître

#### UI/UX et Mystery Mechanic

- **FR-014**: L'interface DOIT afficher uniquement le pourcentage actuel de conformité (par exemple: "Conformité: 45%")
- **FR-015**: Aucune indication de coût, de formule, de consommation de formulaires ou de progression détaillée ne DOIT être affichée dans l'interface
- **FR-016**: La barre de progression DOIT être visuelle et indiquer clairement le pourcentage actuel
- **FR-017**: Lorsque le bouton "Activer la conformité" est grisé (ressources insuffisantes), aucun message d'erreur ou tooltip explicatif ne DOIT apparaître
- **FR-018**: Le système ne DOIT fournir aucun feedback explicite sur la consommation de formulaires pendant la progression

#### Persistance et État

- **FR-019**: L'état d'activation de la conformité DOIT persister entre les sessions de jeu
- **FR-020**: Le pourcentage de conformité actuel DOIT persister entre les sessions de jeu
- **FR-021**: Le système DOIT distinguer clairement entre "jamais activé" et "activé à 0%" dans la persistance des données
- **FR-022**: Les formulaires "en attente" de conversion vers la conformité DOIVENT être suivis avec précision pour éviter les pertes lors des calculs de progression

#### Removed Requirements (from old spec)

- ~~**FR-OLD-004**: Bouton "Réaliser un test de conformité" (150 formulaires pour +3%)~~ → SUPPRIMÉ
- ~~**FR-OLD-005**: Progression manuelle via bouton~~ → SUPPRIMÉ
- ~~**FR-OLD-024**: Lifetime totals pour unlock~~ → SUPPRIMÉ, remplacé par ressources actuelles (FR-003)

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Le bouton "Activer la conformité" DOIT avoir une cible tactile d'au moins 44×44pt
- **AR-002**: Le bouton "Activer la conformité" DOIT utiliser des indicateurs visuels multiples pour l'état actif/inactif (couleur + opacité + icône si possible)
- **AR-003**: La barre de progression DOIT avoir un contraste suffisant (minimum 4.5:1 pour le texte du pourcentage, 3:1 pour la barre elle-même)
- **AR-004**: Le bouton "Activer la conformité" DOIT avoir un label d'accessibilité descriptif pour les lecteurs d'écran (par exemple: "Activer le système de conformité aléatoire")
- **AR-005**: La barre de progression DOIT avoir un label d'accessibilité indiquant le pourcentage actuel (par exemple: "Progression de la conformité: 45 pour cent")
- **AR-006**: L'état grisé du bouton DOIT être communiqué aux lecteurs d'écran (attribut aria-disabled ou équivalent)

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Le label du bouton DOIT être en français authentique, par exemple "Activer la conformité" ou "Lancer la procédure de conformité"
- **LR-002**: Le texte de la barre de progression DOIT utiliser la terminologie bureaucratique française appropriée (par exemple: "Conformité administrative")
- **LR-003**: Les pourcentages DOIVENT être formatés avec le symbole % collé au nombre, sans espace (par exemple: "45%" et non "45 %", conformément à la typographie française standard pour les pourcentages)
- **LR-004**: Les nombres de ressources dans les calculs internes DOIVENT utiliser les séparateurs français si jamais affichés en debug (espace pour milliers: "40 000")

### Key Entities

- **État de Conformité (ComplianceState)**: Représente l'état global du système de conformité pour un joueur donné. Attributs clés:
  - Statut d'activation (jamais activé, activé)
  - Pourcentage de conformité actuel (0-100)
  - Formulaires accumulés non encore convertis en progression
  - Tranche de progression actuelle (0-9)

- **Administration**: Représente une administration déblocable dans le jeu. Relation avec la conformité:
  - Le système de conformité devient visible uniquement après le déblocage de la 5ème administration
  - Les administrations précédentes n'ont pas d'impact direct sur le système de conformité

- **Ressources du Joueur**: Représente les tampons et formulaires disponibles. Relation avec la conformité:
  - Coût d'activation: 40 000 tampons + 10 000 formulaires (ressources actuelles, non lifetime)
  - Progression passive: consommation continue de formulaires selon la formule exponentielle
  - Les tampons ne sont consommés que pour l'activation, pas pour la progression

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un joueur ayant débloqué les 5 administrations et possédant 40 000 tampons + 10 000 formulaires peut activer le système de conformité en un seul clic
- **SC-002**: La progression de 0% à 10% de conformité requiert exactement 10 000 formulaires produits au total
- **SC-003**: La progression de 90% à 100% de conformité requiert exactement 23 570 formulaires produits pour cette tranche (2 357 × 10)
- **SC-004**: Aucun coût, formule ou explication mécanique n'est visible dans l'interface à aucun moment (0 tooltip explicatif, 0 label de coût affiché)
- **SC-005**: Le système de conformité préserve son état (activation + pourcentage) à 100% entre les sessions de jeu (persistence complète)
- **SC-006**: Le bouton "Activer la conformité" est correctement désactivé quand le joueur a moins de 40 000 tampons OU moins de 10 000 formulaires
- **SC-007**: Lorsque la conformité atteint 100%, le bouton "Réaffectation différée" apparaît dans un délai maximum de 1 seconde
