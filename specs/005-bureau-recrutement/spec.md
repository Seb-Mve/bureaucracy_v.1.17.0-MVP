# Feature Specification: Fusion des onglets Bureau et Recrutement

**Feature Branch**: `005-bureau-recrutement`
**Created**: 2026-02-26
**Status**: Draft
**Input**: "la fusion des onglets Bureau et Recrutement. À l'usage les joueurs passent beaucoup de temps dans l'onglet Recrutement (à juste titre) et l'onglet Bureau ne sert finalement qu'à voir la conformité aléatoire. De plus dans l'onglet Bureau il y a : le nom de l'administration, une illustration et un tableau des ressources. Le nom de l'administration et l'illustration ne sont même pas liées, et surtout le tableau des ressources ne sert pas à grand chose. Donc on pourrait : lier le nom de l'administration avec son illustration (notamment au swipe) ET mettre tous les agents directement en dessous à la place du tableau."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Onglet unique : recruter sans changer d'onglet (Priority: P1)

Le joueur ne passe plus d'un onglet à l'autre pour voir ses agents et les recruter. Depuis l'onglet Bureau, il peut voir directement les agents de l'administration active, consulter leurs coûts, et acheter des agents — sans jamais toucher à l'onglet Recrutement. L'onglet Recrutement disparaît de la barre de navigation.

**Why this priority** : C'est le cœur de la fusion. Sans ça, les deux fonctionnalités restent séparées. C'est aussi la valeur principale pour le joueur : un flux de jeu concentré dans un seul onglet.

**Independent Test** : L'onglet Recrutement n'existe plus dans la barre de navigation. Depuis l'onglet Bureau, on peut acheter un agent (voir son coût, taper le bouton d'achat, voir le compteur d'agents augmenter). La ResourceBar ne s'affiche qu'une fois.

**Acceptance Scenarios** :

1. **Étant donné** que le joueur est dans la barre d'onglets, **quand** il la consulte, **alors** il voit « Bureau », « Progression », « Options » — mais pas « Recrutement ».
2. **Étant donné** que le joueur est dans l'onglet Bureau, **quand** il fait défiler la vue vers le bas sous les cartes d'administration, **alors** il voit la liste complète des agents de l'administration active avec leurs boutons d'achat et leurs coûts.
3. **Étant donné** que le joueur a suffisamment de ressources, **quand** il tape le bouton d'achat d'un agent dans l'onglet Bureau, **alors** l'agent est recruté et son compteur augmente immédiatement.
4. **Étant donné** que la ResourceBar était présente dans les deux onglets, **quand** les onglets sont fusionnés, **alors** la ResourceBar n'apparaît qu'une seule fois en haut de l'écran.

---

### User Story 2 — Nom + illustration synchronisés au swipe (Priority: P1)

Actuellement, le nom de l'administration est affiché séparément des cartes illustrées : si le joueur swipe les cartes manuellement, le nom ne change pas. Cette incohérence disparaît. Le nom fait partie de la carte et se déplace avec elle ; en fin de swipe, l'administration snappée est l'administration active.

**Why this priority** : Ce bug UX est visible et perturbant dès qu'on swipe. Il est directement mentionné comme un problème. Le corriger est fondamental avant d'ajouter du contenu sous les cartes — sinon le joueur pourrait scroller des agents qui ne correspondent pas à la carte visible.

**Independent Test** : Swiper manuellement les cartes (doigt, sans tapper une carte précise). En fin de geste, la carte snappée est active : son nom est affiché sur la carte et les agents listés en dessous correspondent à cette administration.

**Acceptance Scenarios** :

1. **Étant donné** que plusieurs administrations sont débloquées, **quand** le joueur swipe horizontalement les cartes et que le geste se termine, **alors** la carte la plus proche du centre devient l'administration active.
2. **Étant donné** que le joueur swipe vers l'administration suivante, **quand** la carte snappe en position centrale, **alors** le nom affiché sur la carte et la liste des agents en dessous correspondent tous deux à cette administration.
3. **Étant donné** que le joueur tape directement sur une carte non-active, **quand** il relève le doigt, **alors** la vue scrolle vers cette carte, elle devient active, et les agents en dessous se mettent à jour.

---

### User Story 3 — Administrations verrouillées et upgrades de stockage accessibles (Priority: P2)

Les fonctionnalités de déverrouillage d'administration et d'achat d'upgrades de stockage, qui existaient dans l'onglet Recrutement, restent accessibles dans la vue fusionnée. Le joueur ne perd aucune fonctionnalité de progression.

**Why this priority** : Sans ça, le joueur ne peut plus débloquer de nouvelles administrations ni acheter les upgrades de stockage. C'est bloquant sur le long terme, mais pas pour le MVP immédiat si le joueur a déjà toutes les administrations débloquées.

**Independent Test** : Avoir une administration verrouillée. Dans la vue fusionnée, sa carte indique le verrouillage. Tapper la carte (avec les ressources nécessaires) → l'administration se déverrouille. Avoir un upgrade de stockage disponible → il apparaît dans la liste au-dessus des agents.

**Acceptance Scenarios** :

1. **Étant donné** qu'une administration est verrouillée, **quand** le joueur voit sa carte dans le scroll horizontal, **alors** la carte indique qu'elle est verrouillée (icône cadenas + coût de déverrouillage).
2. **Étant donné** qu'une administration est verrouillée et que le joueur a les ressources nécessaires, **quand** il tape la carte verrouillée, **alors** l'administration se déverrouille et ses agents apparaissent dans la liste.
3. **Étant donné** qu'un upgrade de stockage est disponible pour l'administration active, **quand** le joueur consulte la liste sous les cartes, **alors** l'upgrade de stockage s'affiche en haut de cette liste, avant les agents.

---

### Edge Cases

- **Une seule administration débloquée** : pas de swipe possible, carte unique centrée, liste d'agents en dessous normalement.
- **Swipe partiel abandonné** : si le joueur commence un swipe mais n'atteint pas le snap suivant, la carte revient à la position précédente et l'administration active ne change pas.
- **Tous les agents au maximum de capacité** : les agents s'affichent dans la liste avec leur compteur max ; boutons d'achat désactivés.
- **ConformiteDisplay à 100 %** : le CTA « Réaffectation différée » reste visible (ConformiteDisplay est en haut, non liée à une administration spécifique).
- **Scroll long avec beaucoup d'agents** : le bouton Tamponner reste accessible à tout moment, même quand le joueur est en bas de la liste des agents.
- **Badge de notification** : le badge indiquant les agents recrutables (anciennement sur l'onglet Recrutement) doit rester visible quelque part dans la navigation.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** : L'onglet « Recrutement » DOIT être retiré de la barre de navigation.
- **FR-002** : L'onglet « Bureau » DOIT afficher, dans l'ordre depuis le haut : ResourceBar, ConformiteDisplay (si active), cartes d'administration (scroll horizontal snappant), liste des agents de l'administration active, bouton Tamponner fixe en bas.
- **FR-003** : Le nom de l'administration DOIT être intégré à l'intérieur de la carte (affiché sous l'illustration, dans les limites de la carte), et non comme un élément texte séparé au-dessus des cartes.
- **FR-004** : Quand le scroll horizontal des cartes se termine (fin du geste de swipe), la carte snappée au centre DOIT automatiquement devenir l'administration active — sans nécessiter un tap supplémentaire.
- **FR-005** : La liste des agents sous les cartes DOIT être la liste interactive complète : nom de l'agent, description de production, coût actuel (avec escalade), bouton d'achat, compteur d'agents possédés.
- **FR-006** : L'ancien affichage résumé des agents (icônes uniquement, sans bouton d'achat) DOIT être supprimé.
- **FR-007** : Pour les administrations verrouillées, la carte DOIT afficher un indicateur de verrouillage et le coût de déverrouillage. Tapper la carte DOIT déclencher le déverrouillage si les ressources sont suffisantes.
- **FR-008** : Les upgrades de stockage disponibles pour l'administration active DOIVENT s'afficher au-dessus des agents dans la liste, comme dans l'ancienne Recrutement.
- **FR-009** : Le bouton Tamponner DOIT rester fixe en bas de l'écran et accessible en permanence, indépendamment de la position de scroll de la liste des agents.
- **FR-010** : La ResourceBar DOIT apparaître une seule fois dans la vue fusionnée.
- **FR-011** : Le badge de notification indiquant des agents recrutables DOIT rester accessible dans la navigation (sur l'onglet Bureau ou fusionné avec le badge existant).

### Accessibility Requirements (Constitutional — Principle IV)

- **AR-001** : Toutes les cartes d'administration et boutons d'achat d'agents DOIVENT avoir une cible tactile minimale de 44×44 points.
- **AR-002** : Le statut de verrouillage d'une administration NE DOIT PAS être transmis uniquement par la couleur (icône cadenas requis en plus de tout changement visuel).
- **AR-003** : Le contraste des textes DOIT respecter WCAG 2.1 AA (4,5:1 texte normal, 3:1 grand texte), y compris le nom de l'administration affiché sur la carte.
- **AR-004** : Les cartes et illustrations DOIVENT avoir des labels d'accessibilité descriptifs pour les lecteurs d'écran.

### Localization Requirements (Constitutional — Principle III)

- **LR-001** : Tous les textes visibles DOIVENT rester en français avec accents et grammaire corrects.
- **LR-002** : La terminologie administrative française existante DOIT être préservée (noms d'administrations, agents, ressources).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Le joueur peut recruter un agent sans jamais quitter l'onglet Bureau — flux en 0 changement d'onglet contre 1 auparavant.
- **SC-002** : Après un swipe de carte suivi d'un snap, le nom affiché sur la carte et la liste des agents en dessous correspondent à la même administration — 100 % du temps, sans délai perceptible.
- **SC-003** : Toutes les fonctionnalités de l'ancien onglet Recrutement (achat d'agents, déverrouillage d'administration, upgrades de stockage) sont accessibles dans la vue fusionnée — 0 régression fonctionnelle.
- **SC-004** : Le bouton Tamponner est tappable en toutes circonstances dans la vue fusionnée (pendant le scroll des agents, pendant le swipe des cartes) — 0 cas où il est inaccessible.

---

## Assumptions

- L'illustration des administrations (`imagePath`) existe déjà dans AdministrationCard — elle est conservée.
- L'onglet « Progression » et l'onglet « Options » ne sont pas affectés.
- ConformiteDisplay n'est pas liée à une administration spécifique : elle reste en haut de l'écran, avant les cartes.
- La décision sur la fusion ou séparation des badges de notification (Bureau + Recrutement) est laissée au plan technique.
