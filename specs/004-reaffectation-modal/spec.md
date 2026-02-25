# Feature Specification: Modale de Réaffectation Différée

**Feature Branch**: `004-reaffectation-modal`
**Created**: 2026-02-25
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Affichage de la modale à 100 % (Priority: P1)

Le joueur atteint 100 % de conformité aléatoire. Le bouton « Réaffectation différée » est visible. En tapant dessus, une modale bloquante s'ouvre avec un message d'alerte bureaucratique et deux choix exclusifs : accepter la migration ou refuser.

**Why this priority**: C'est le déclencheur central de la feature. Sans cette modale, les deux parcours (accepter / refuser) sont inaccessibles.

**Independent Test**: Peut être testé seul en forçant `conformite.percentage = 100` et en tapant le CTA.

**Acceptance Scenarios**:

1. **Given** la conformité est à 100 % et le système est activé, **When** le joueur tape « Réaffectation différée », **Then** une modale s'affiche avec le message d'alerte complet et les deux boutons.
2. **Given** la modale est ouverte, **When** le joueur tente de la fermer sans choisir (tap en dehors ou geste retour), **Then** la modale reste ouverte — le choix est obligatoire.
3. **Given** la conformité est inférieure à 100 %, **When** le joueur consulte l'écran de progression, **Then** le CTA « Réaffectation différée » n'est pas visible.

---

### User Story 2 — Parcours « Accepter la migration » (Priority: P2)

Le joueur choisit d'accepter. Il voit un message « Coming soon » lui indiquant que cette fonctionnalité arrivera prochainement. L'état de la conformité n'est pas modifié.

**Why this priority**: Parcours principal, même si le contenu est un placeholder. Le joueur doit recevoir un retour visuel immédiat.

**Independent Test**: Peut être testé indépendamment en tapant [ACCEPTER LA MIGRATION] depuis la modale ouverte.

**Acceptance Scenarios**:

1. **Given** la modale est ouverte, **When** le joueur tape [ACCEPTER LA MIGRATION], **Then** la modale affiche un message « Coming soon » et un bouton de fermeture.
2. **Given** le message « Coming soon » est affiché, **When** le joueur ferme la modale, **Then** il retourne à l'écran de progression — la conformité reste à 100 % et le CTA reste visible.

---

### User Story 3 — Parcours « Refuser » (Priority: P2)

Le joueur refuse la migration. Le système « pilonne » ses dossiers en excès : la conformité redescend immédiatement à un seuil aléatoire entre 23 % et 65 %. La progression passive reprend depuis ce nouveau seuil. Lorsque la conformité atteindra à nouveau 100 %, la modale réapparaîtra.

**Why this priority**: Mécanisme narratif et de gameplay central — justifie le cycle infini de progression et donne du sens à la réinitialisation.

**Independent Test**: Peut être testé indépendamment en tapant [REFUSER] depuis la modale et en vérifiant l'état de la conformité immédiatement après.

**Acceptance Scenarios**:

1. **Given** la modale est ouverte et la conformité est à 100 %, **When** le joueur tape [REFUSER], **Then** la modale se ferme, la conformité descend à une valeur entière aléatoire dans [23, 65] avec une animation descendante de ~300 ms sur la barre de progression.
2. **Given** le joueur a refusé une première fois, **When** la conformité atteint à nouveau 100 %, **Then** la modale réapparaît de façon identique (cycle illimité).
3. **Given** le joueur a refusé, **When** la progression reprend, **Then** la progression passive normale continue depuis le seuil réinitialisé sans blocage.

---

### Edge Cases

- Que se passe-t-il si le joueur ferme l'application pendant que la modale est ouverte ? → La modale réapparaît au prochain lancement si la conformité est toujours à 100 %.
- Le seuil aléatoire est-il le même à chaque refus ? → Non, tiré aléatoirement dans [23, 65] à chaque refus.
- Le bouton [REFUSER] doit-il être visuellement différencié ? → Oui, style avertissement pour signaler la conséquence négative (sans reposer uniquement sur la couleur).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher une modale bloquante lorsque le joueur tape le CTA « Réaffectation différée » et que la conformité est à 100 %.
- **FR-002**: La modale DOIT contenir le texte exact : *« Alerte : Le volume de dossiers locaux a atteint le seuil de compression critique. L'espace de stockage physique est saturé. Pour continuer à exister administrativement, votre dossier personnel doit être délocalisé vers l'échelon Départemental. »*
- **FR-003**: La modale DOIT contenir deux boutons : [ACCEPTER LA MIGRATION] avec sous-titre *« Transférer mon matricule et mes dossiers. »* et [REFUSER] avec sous-titre *« Rester ici (Attention : l'excès de dossiers sera pilonné pour libérer de l'espace). »*
- **FR-004**: La modale DOIT être non-dismissible — tap en dehors et geste retour n'ont aucun effet.
- **FR-005**: Lorsque le joueur tape [ACCEPTER LA MIGRATION], le système DOIT afficher un message « Coming soon » à la place du contenu initial de la modale, avec un bouton de fermeture.
- **FR-006**: Lorsque le joueur tape [REFUSER], le système DOIT fermer la modale et réinitialiser la conformité à une valeur entière aléatoire uniforme dans [23, 65].
- **FR-007**: Après refus, le compteur interne de formulaires accumulés DOIT être recalculé comme la somme exacte des coûts de 0 % à N−1 % (où N est le seuil aléatoire tiré), de sorte que le joueur reprenne la progression depuis le début du Nème pourcent.
- **FR-008**: Le cycle DOIT être illimité : chaque fois que la conformité atteint 100 %, la modale réapparaît avec les deux choix complets — aucun état d'acceptation antérieure n'est mémorisé.
- **FR-009**: Le bouton [REFUSER] DOIT avoir un style visuel d'avertissement distinct du bouton d'acceptation.

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Les deux boutons DOIVENT avoir une cible tactile minimale de 44 × 44 pt.
- **AR-002**: La distinction entre les deux boutons NE DOIT PAS reposer uniquement sur la couleur — les libellés et sous-titres sont suffisants.
- **AR-003**: Le contraste texte/fond DOIT respecter WCAG 2.1 AA (4,5:1 texte normal).
- **AR-004**: La modale DOIT avoir un `accessibilityLabel` descriptif pour les lecteurs d'écran.
- **AR-005**: Les boutons DOIVENT avoir des `accessibilityLabel` communiquant clairement l'action et ses conséquences.

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Tous les textes DOIVENT être en français avec accents et grammaire corrects.
- **LR-002**: La terminologie bureaucratique (*« matricule »*, *« échelon Départemental »*, *« pilonné »*) DOIT être préservée telle quelle — intentionnelle et authentique.

### Key Entities

- **ConformiteState** : Entité d'état de la conformité. Champs concernés après refus : `percentage` (réinitialisé à [23, 65]) et compteur interne de formulaires accumulés (recalculé pour cohérence). `isActivated` non modifié.
- **Modale de réaffectation** : Composant UI éphémère, affiché en superposition. Non persisté. Déclenché uniquement par `percentage === 100` et présence du CTA.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le joueur peut ouvrir la modale en 1 tap depuis la conformité à 100 % — aucune navigation supplémentaire.
- **SC-002**: Après refus, la barre de conformité effectue une animation descendante de ~300 ms vers le seuil aléatoire — l'effet « pilonnage » est perceptible et narrativement cohérent.
- **SC-003**: La modale est non-dismissible à 100 % — 0 moyen de l'ignorer sans faire un choix.
- **SC-004**: Le cycle refus → progression → 100 % → modale peut se répéter indéfiniment sans blocage ni erreur.
- **SC-005**: Le message « Coming soon » est affiché immédiatement après [ACCEPTER LA MIGRATION] (réponse perçue < 100 ms).

## Clarifications

### Session 2026-02-25

- Q: Après une acceptation (« Coming soon »), si le joueur retape le CTA à 100 %, voit-il la modale complète (deux choix) ou directement le « Coming soon » ? → A: Modale complète réapparaît à chaque tap — aucun état d'acceptation mémorisé.
- Q: Comment recalculer `accumulatedFormulaires` après refus pour le seuil N % ? → A: Somme des coûts de 0 % à N−1 % — le joueur repart du début du Nème pourcent.
- Q: La barre de conformité chute-t-elle instantanément ou avec animation lors du refus ? → A: Courte animation descendante (~300 ms) pour renforcer l'effet narratif « pilonnage ».

## Assumptions

- La modale est implémentée avec le composant `Modal` de React Native (overlay natif).
- Le texte exact des boutons et du message est figé tel que spécifié.
- « Coming soon » est un texte court sans date ni contenu supplémentaire.
- Après acceptation, la conformité reste à 100 % et le CTA reste visible jusqu'à l'implémentation réelle de la mécanique de prestige.
- Le recalcul de `accumulatedFormulaires` après refus = somme de `getFormulairesRequiredForNextPercent(p)` pour p de 0 à N−1, où N est le seuil aléatoire tiré dans [23, 65].
