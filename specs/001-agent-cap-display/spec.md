# Feature Specification: Affichage du plafond d'achat des agents

**Feature Branch**: `001-agent-cap-display`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "Pour tous les agents qui ont une limite d'achat (ex : Directeur de pôle limité à 10 unités), on puisse voir justement cette limite dans l'onglet recrutement. Peut-être à côté du nombre 'x0' on peut ajouter pour ceux-là uniquement un '/5' par ex."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visualiser le plafond d'un agent plafonné (Priority: P1)

Un joueur qui consulte l'onglet Recrutement voit, pour chaque agent doté d'une limite d'achat, le nombre d'unités possédées **et** le maximum autorisé, directement dans la carte de l'agent — sans avoir à acheter pour découvrir la limite.

**Why this priority**: C'est l'intégralité de la fonctionnalité demandée. La feature est entièrement contenue dans cette story.

**Independent Test**: Ouvrir l'onglet Recrutement sur une administration contenant un agent plafonné (ex. Directeur de pôle, max 10) → la carte affiche « x0/10 » dès le premier chargement.

**Acceptance Scenarios**:

1. **Given** un agent plafonné avec 0 unités possédées, **When** le joueur consulte l'onglet Recrutement, **Then** le compteur affiche « x0/10 » (ou le plafond correspondant à cet agent).
2. **Given** un agent plafonné avec 3 unités possédées, **When** le joueur consulte l'onglet Recrutement, **Then** le compteur affiche « x3/10 ».
3. **Given** un agent plafonné dont le joueur vient d'atteindre le maximum (ex. 10/10), **When** la carte est affichée, **Then** le compteur affiche « x10/10 » et le bouton d'achat est désactivé.
4. **Given** un agent **sans** plafond (ex. Stagiaire administratif), **When** le joueur consulte l'onglet Recrutement, **Then** le compteur affiche « x0 » (format inchangé — sans barre oblique ni dénominateur).

---

### Edge Cases

- Que se passe-t-il si un agent a un plafond de 1 ? → affiche « x0/1 » avant achat, « x1/1 » après (bouton désactivé).
- Que se passe-t-il si `maxOwned` n'est pas défini (agent sans limite) ? → affiche « x{owned} » exactement comme avant, aucune régression.
- L'accessibilityLabel doit-il inclure le plafond ? → Oui (voir AR-006) : « Possédé : 3 sur 10 ».

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pour tout agent dont un plafond d'achat est défini, le compteur d'unités possédées DOIT afficher « x{possédés}/{plafond} » (ex. « x3/10 »).
- **FR-002**: Pour tout agent sans plafond d'achat, le compteur DOIT continuer d'afficher « x{possédés} » (ex. « x7 ») — aucune modification visible.
- **FR-003**: L'indicateur de plafond DOIT être visible en permanence sur la carte de l'agent, sans interaction supplémentaire de la part du joueur.
- **FR-004**: Le compteur DOIT se mettre à jour immédiatement après chaque achat, reflétant le nouvel état possédés/plafond.
- **FR-005**: Lorsque le plafond est atteint (possédés === plafond), le compteur DOIT afficher « x{plafond}/{plafond} » et le bouton d'achat DOIT rester désactivé (comportement déjà existant, inchangé).

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: All interactive elements MUST have minimum 44×44pt touch targets
- **AR-002**: Color MUST NOT be sole means of conveying information (use icons + text)
- **AR-003**: Text contrast MUST meet WCAG 2.1 AA standards (4.5:1 normal, 3:1 large)
- **AR-004**: All icons/images MUST have accessibility labels for screen readers
- **AR-005**: Feature MUST be playable without sound/haptics (visual alternatives)
- **AR-006**: L'accessibilityLabel des agents plafonnés DOIT inclure l'information de plafond, ex. « Possédé : 3 sur 10 », afin que les lecteurs d'écran communiquent la contrainte.

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: All user-facing text MUST be in French with proper accents and grammar
- **LR-002**: French bureaucratic terminology MUST be authentic and contextually appropriate
- **LR-003**: Numbers MUST use French formatting (spaces for thousands: « 1 000 », comma for decimals: « 1,5 »)
- **LR-004**: Le séparateur entre le nombre possédé et le plafond DOIT être une barre oblique sans espace (« x3/10 »), cohérent avec les conventions du jeu.

### Key Entities

- **Agent** : entité de jeu représentant un recrutement dans une administration. Possède un compteur d'unités possédées et un plafond optionnel. La carte de l'agent dans l'onglet Recrutement affiche ces deux valeurs quand le plafond est défini.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un joueur peut déterminer en un coup d'œil combien d'unités d'un agent plafonné il lui reste à acheter, sans effectuer de calcul mental ni naviguer hors de la carte.
- **SC-002**: Les cartes des agents sans plafond sont visuellement et fonctionnellement identiques à leur état avant la fonctionnalité (aucune régression).
- **SC-003**: Le compteur « x{possédés}/{plafond} » se met à jour instantanément après chaque achat, sans délai perceptible.
- **SC-004**: L'information de plafond est lisible par les lecteurs d'écran via l'accessibilityLabel de la carte.

## Assumptions

- Le plafond (`maxOwned`) est défini statiquement dans les données du jeu et ne varie pas en cours de partie.
- Le format visuel retenu est « x{owned}/{maxOwned} » (barre oblique, sans espace), cohérent avec le style existant « x{owned} ».
- Un style visuellement distinct pour le dénominateur (ex. couleur atténuée) est hors périmètre de cette spec mais non exclu en planification.
