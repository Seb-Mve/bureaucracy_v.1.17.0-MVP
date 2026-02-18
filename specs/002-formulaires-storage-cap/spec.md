# Feature Specification: Limite de Stockage des Formulaires

**Feature Branch**: `002-formulaires-storage-cap`  
**Created**: 2025-01-24  
**Status**: Draft  
**Input**: User description: "Créer une barrière administrative invisible et irrationnelle pour forcer la progression et le prestige via une limite de stockage des formulaires avec déblocages progressifs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découverte du Blocage Initial (Priority: P1)

Le joueur produit des formulaires normalement jusqu'à atteindre le premier seuil de stockage. Au moment où le stock atteint exactement 983 formulaires, le compteur se fige, le nombre passe en rouge (#FF0000) et commence à clignoter. Aucune explication n'est fournie, créant une tension et incitant le joueur à explorer les menus d'Administration pour comprendre ce qui se passe.

**Why this priority**: C'est le mécanisme de base qui introduit le système de limite de stockage. Sans ce blocage initial, toute la fonctionnalité n'a pas de raison d'être. C'est la première interaction du joueur avec ce système et elle doit créer l'effet de surprise et de frustration intentionnelle.

**Independent Test**: Peut être testé en produisant 983 formulaires (manuellement ou via automation) et en vérifiant que le compteur se bloque, change de couleur et clignote. La valeur est immédiatement apparente : le joueur comprend qu'il y a une limite même sans texte explicatif.

**Acceptance Scenarios**:

1. **Given** le joueur possède 982 formulaires, **When** il produit 1 formulaire supplémentaire, **Then** le compteur affiche "983" en rouge (#FF0000) et commence à clignoter
2. **Given** le joueur possède 983 formulaires (limite atteinte), **When** il tente de produire un formulaire supplémentaire, **Then** le compteur reste à "983" et le formulaire n'est pas ajouté
3. **Given** le compteur est bloqué à 983, **When** le joueur consulte les menus d'Administration 2 à 5, **Then** les améliorations de stockage deviennent visibles dans leur menu respectif

---

### User Story 2 - Premier Déblocage de Stockage (Priority: P2)

Une fois le joueur conscient du blocage, il découvre dans le menu de l'Administration 2 une amélioration nommée "Casier de Secours B-9" qui coûte exactement 983 formulaires (l'intégralité de son stock actuel). En achetant cette amélioration, son stock est remis à zéro et la nouvelle limite passe à 1 983 formulaires. Le joueur comprend alors le mécanisme de sacrifice pour progresser.

**Why this priority**: Cette user story introduit le mécanisme central de progression : sacrifier tout son stock pour augmenter la capacité. C'est la récompense directe à la frustration créée par le blocage initial. Sans ce déblocage, le joueur serait bloqué définitivement.

**Independent Test**: Peut être testé en atteignant 983 formulaires, en achetant l'amélioration, et en vérifiant que le stock revient à 0 et que la nouvelle limite est 1 983. La valeur délivrée est claire : le joueur peut maintenant produire plus de formulaires.

**Acceptance Scenarios**:

1. **Given** le joueur a 983 formulaires et le compteur est bloqué, **When** il achète "Casier de Secours B-9" dans Administration 2, **Then** son stock de formulaires passe à 0 et la nouvelle limite est 1 983
2. **Given** le joueur a moins de 983 formulaires, **When** il consulte "Casier de Secours B-9", **Then** l'amélioration est affichée mais non achetable (coût insuffisant)
3. **Given** le joueur a acheté "Casier de Secours B-9", **When** il produit des formulaires, **Then** le compteur fonctionne normalement jusqu'à atteindre 1 983

---

### User Story 3 - Progression Séquentielle des Déblocages (Priority: P2)

Le joueur découvre qu'il existe plusieurs améliorations de stockage (dans Administrations 2, 3, 4 et 5), mais qu'elles doivent être achetées dans l'ordre strict. Il ne peut pas acheter "Rayonnage Vertical Optimisé" (Admin 3) sans avoir d'abord acheté "Casier de Secours B-9" (Admin 2). Cette progression linéaire force le joueur à passer par chaque étape de sacrifice.

**Why this priority**: La séquentialité garantit que le joueur expérimente chaque palier de frustration et de libération, créant un rythme de gameplay intentionnel. Cela empêche les joueurs de "sauter" des étapes et diluer l'expérience.

**Independent Test**: Peut être testé en vérifiant qu'avec 1 983 formulaires, le joueur ne peut pas acheter "Rayonnage Vertical Optimisé" s'il n'a pas déjà acheté "Casier de Secours B-9". La valeur est la cohérence de la progression.

**Acceptance Scenarios**:

1. **Given** le joueur n'a pas acheté "Casier de Secours B-9", **When** il consulte le menu de l'Administration 3, **Then** "Rayonnage Vertical Optimisé" n'est pas visible ou est grisé
2. **Given** le joueur a acheté "Casier de Secours B-9" et atteint 1 983 formulaires, **When** il achète "Rayonnage Vertical Optimisé", **Then** son stock passe à 0 et la limite devient 4 583
3. **Given** le joueur a débloqué toutes les améliorations jusqu'à Administration 4, **When** il achète "Vide Juridique de Stockage" (Admin 5), **Then** la limite devient illimitée (null) et le compteur ne se bloque plus jamais

---

### User Story 4 - Interaction avec le Prestige (Priority: P3)

Le joueur qui a débloqué l'amélioration de prestige "Extension des Classeurs" (+20% de stockage) voit toutes les limites de stockage augmentées de 20%. Par exemple, le premier blocage se produit à 1 179 au lieu de 983. Lors d'une Réforme Administrative (prestige reset), toutes les améliorations de stockage sont perdues et le joueur revient au seuil initial (983 ou son équivalent boosté).

**Why this priority**: Cette user story connecte le système de stockage au système de prestige existant, créant une synergie entre les mécanismes de jeu. C'est moins critique que les stories précédentes car elle suppose que le prestige existe déjà.

**Independent Test**: Peut être testé en activant "Extension des Classeurs" et en vérifiant que le premier seuil passe à 1 179 (983 × 1.2). Après un prestige, vérifier que les améliorations sont perdues.

**Acceptance Scenarios**:

1. **Given** le joueur a débloqué "Extension des Classeurs" (+20%), **When** il produit des formulaires, **Then** le premier blocage se produit à 1 179 (983 × 1.2)
2. **Given** le joueur a acheté plusieurs améliorations de stockage, **When** il effectue une Réforme Administrative, **Then** toutes les améliorations de stockage sont perdues et il revient au seuil de base (modifié par les bonus de prestige actifs)
3. **Given** le joueur atteint le palier "Illimité", **When** il effectue une Réforme Administrative, **Then** il bénéficie d'un bonus multiplicateur massif à la Valeur Administrative Totale (augmentant les Trombones gagnés)

---

### User Story 5 - Gestion du Surplus Automatique (Priority: P3)

Le joueur qui utilise des productions automatiques (agents ou améliorations) peut voir sa production dépasser le seuil de stockage. Dans ce cas, tout formulaire produit au-delà de la limite est définitivement perdu. Le compteur se fige strictement au plafond, et les formulaires excédentaires disparaissent sans trace.

**Why this priority**: Cette story gère un edge case important pour les joueurs avancés qui utilisent l'automation. Elle renforce le design de "perte par bureaucratie" mais n'est pas critique pour l'expérience de base.

**Independent Test**: Peut être testé en configurant une production automatique qui génère plusieurs formulaires par seconde, puis en observant le comportement au moment où la limite est atteinte.

**Acceptance Scenarios**:

1. **Given** le joueur a 980 formulaires et une limite de 983, **When** une production automatique génère 10 formulaires d'un coup, **Then** le compteur se fige à 983 et 7 formulaires sont perdus
2. **Given** le compteur est bloqué à la limite, **When** une production automatique continue de générer des formulaires, **Then** tous les formulaires générés sont perdus sans notification
3. **Given** le joueur achète une amélioration de stockage, **When** il a à nouveau de l'espace disponible, **Then** les productions automatiques recommencent à ajouter des formulaires au stock

---

### Edge Cases

- **Que se passe-t-il si le joueur atteint exactement la limite lors d'une production automatique ?** Le compteur se fige au plafond exact. Tout surplus est perdu.
- **Que se passe-t-il si le joueur tente d'acheter une amélioration hors séquence ?** L'amélioration est soit invisible, soit grisée/non achetable jusqu'à ce que les prérequis soient remplis.
- **Que se passe-t-il si le joueur effectue un prestige alors qu'il a le stockage illimité ?** Il revient au seuil de base (983 ou modifié par bonus), mais obtient un multiplicateur massif de Valeur Administrative pour compenser.
- **Que se passe-t-il si "Extension des Classeurs" est désactivée après avoir été activée ?** Les seuils reviennent aux valeurs de base (983, 1 983, etc.). Si le joueur dépasse déjà la nouvelle limite, le compteur se bloque immédiatement.
- **Que se passe-t-il si le joueur a exactement le coût requis pour une amélioration ?** L'amélioration peut être achetée, le stock passe à 0, et la nouvelle limite est appliquée.
- **Comment le système gère-t-il les arrondis avec le bonus de 20% ?** Les valeurs sont arrondies à l'entier supérieur (Math.ceil) pour éviter les seuils fractionnaires (ex: 983 × 1.2 = 1 179.6 → 1 180).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT bloquer le compteur de formulaires lorsque le stock atteint exactement 983 formulaires (ou la valeur modifiée par les bonus de prestige)
- **FR-002**: Le système DOIT afficher le nombre "983" en rouge (#FF0000) lorsque la limite est atteinte
- **FR-003**: Le système DOIT faire clignoter le compteur rouge lorsque la limite est atteinte
- **FR-004**: Le système NE DOIT PAS afficher de fenêtre modale ou de message explicatif lors du premier blocage
- **FR-005**: Le système DOIT rendre visibles les améliorations de stockage dans les menus d'Administration uniquement lorsque le compteur est bloqué (clignotement rouge actif)
- **FR-006**: Le système DOIT proposer quatre améliorations de stockage séquentielles : "Casier de Secours B-9" (Admin 2, limite 1 983, coût 983), "Rayonnage Vertical Optimisé" (Admin 3, limite 4 583, coût 1 983), "Compression d'Archives A-1" (Admin 4, limite 11 025, coût 4 583), "Vide Juridique de Stockage" (Admin 5, limite illimitée, coût 11 025)
- **FR-007**: Le système DOIT exiger le paiement de l'intégralité du plafond actuel pour acheter une amélioration (exemple : 983 formulaires pour passer de 983 à 1 983)
- **FR-008**: Le système DOIT remettre le stock de formulaires à zéro immédiatement après l'achat d'une amélioration de stockage
- **FR-009**: Le système DOIT appliquer la nouvelle limite immédiatement après l'achat d'une amélioration
- **FR-010**: Le système DOIT empêcher l'achat d'une amélioration si l'amélioration précédente dans la séquence n'a pas été achetée (ordre strict : Admin 2 → Admin 3 → Admin 4 → Admin 5)
- **FR-011**: Le système DOIT appliquer le bonus "Extension des Classeurs" (+20%) à toutes les limites de stockage si cette amélioration de prestige est active
- **FR-012**: Le système DOIT arrondir les limites modifiées par des bonus à l'entier supérieur (Math.ceil) pour éviter les valeurs fractionnaires
- **FR-013**: Le système DOIT réinitialiser toutes les améliorations de stockage lors d'une Réforme Administrative (prestige reset)
- **FR-014**: Le système DOIT ramener le joueur au seuil de base (983 ou modifié par bonus actifs) après une Réforme Administrative
- **FR-015**: Le système DOIT appliquer un bonus multiplicateur massif à la Valeur Administrative Totale si le joueur a atteint le palier "Illimité" avant une Réforme Administrative
- **FR-016**: Le système DOIT rejeter tout formulaire produit lorsque le stock est au plafond (surplus définitivement perdu)
- **FR-017**: Le système DOIT figer le compteur strictement au plafond même si une production automatique tente de dépasser cette limite
- **FR-018**: Le système NE DOIT PAS afficher de notification lorsque des formulaires produits automatiquement sont perdus au plafond
- **FR-019**: Le système DOIT afficher le compteur en couleur normale (non-rouge, non-clignotant) lorsque le stock est inférieur à la limite
- **FR-020**: Le système DOIT gérer correctement le passage de "limite illimitée" à "limite définie" lors d'un prestige (blocage immédiat si le stock dépasse la nouvelle limite)

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Le clignotement du compteur rouge DOIT respecter une fréquence maximale de 3 Hz pour éviter les risques épileptiques (WCAG 2.3.1)
- **AR-002**: Le changement de couleur du compteur (noir → rouge) NE DOIT PAS être le seul indicateur visuel du blocage ; le clignotement doit être également visible
- **AR-003**: Le contraste entre le texte rouge (#FF0000) et le fond DOIT respecter un ratio minimum de 4.5:1 (WCAG AA)
- **AR-004**: Les améliorations de stockage DOIVENT avoir des labels accessibles indiquant leur coût et le nouveau plafond pour les lecteurs d'écran
- **AR-005**: L'état "bloqué" du compteur DOIT être annoncé aux lecteurs d'écran (ex: "Stock de formulaires bloqué à 983, capacité maximale atteinte")

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Tous les noms d'améliorations DOIVENT être en français bureaucratique authentique ("Casier de Secours B-9", "Rayonnage Vertical Optimisé", "Compression d'Archives A-1", "Vide Juridique de Stockage")
- **LR-002**: Les nombres de formulaires DOIVENT utiliser la notation française avec espaces pour les milliers (ex: "11 025" et non "11025" ou "11,025")
- **LR-003**: Les descriptions et tooltips (si ajoutés ultérieurement) DOIVENT utiliser un ton bureaucratique absurde cohérent avec le thème du jeu
- **LR-004**: Le terme "Réforme Administrative" DOIT être utilisé pour désigner le prestige reset dans tous les textes liés à cette fonctionnalité

### Key Entities *(include if feature involves data)*

- **Amélioration de Stockage (Storage Upgrade)**: Représente un déblocage de capacité disponible dans une Administration spécifique. Attributs : nom, administration parente (2-5), nouveau plafond, coût en formulaires, index dans la séquence, statut acheté/non-acheté
- **Limite de Stockage (Storage Cap)**: Valeur numérique représentant le plafond actuel de formulaires. Peut être 983, 1 983, 4 583, 11 025, ou null (illimité). Modifiable par les bonus de prestige
- **État du Compteur (Counter State)**: État visuel du compteur de formulaires. Valeurs possibles : normal (affichage standard), bloqué (rouge + clignotant). Dépend de la comparaison stock actuel vs limite
- **Bonus de Prestige "Extension des Classeurs"**: Modificateur multiplicateur (+20%) appliqué à toutes les limites de stockage. Persiste entre les Réformes Administratives selon les règles de prestige
- **Valeur Administrative Totale**: Métrique calculée utilisée pour déterminer les gains de Trombones lors d'un prestige. Reçoit un multiplicateur massif si le joueur a atteint le stockage illimité

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le joueur expérimente le blocage initial dans les 5 premières minutes de jeu (pour un joueur actif produisant des formulaires activement)
- **SC-002**: 90% des joueurs découvrent l'amélioration "Casier de Secours B-9" dans les 60 secondes suivant le blocage du compteur
- **SC-003**: Le système gère correctement au moins 100 formulaires produits automatiquement par seconde sans lag ni bug au moment où la limite est atteinte
- **SC-004**: Le compteur se bloque exactement à la valeur du plafond (983, 1 179, 1 983, etc.) sans jamais dépasser ni sous-estimer d'une unité
- **SC-005**: Les améliorations de stockage apparaissent dans le bon ordre séquentiel et ne peuvent jamais être achetées hors séquence
- **SC-006**: Le bonus "Extension des Classeurs" (+20%) modifie correctement toutes les limites avec un arrondi à l'entier supérieur (ex: 983 → 1 180, pas 1 179.6)
- **SC-007**: Une Réforme Administrative réinitialise 100% des améliorations de stockage et ramène le joueur au seuil de base
- **SC-008**: Le multiplicateur de Valeur Administrative pour avoir atteint "Illimité" augmente les gains de Trombones d'au moins 200% lors du prochain prestige
- **SC-009**: Aucun formulaire ne peut être ajouté au stock lorsque la limite est atteinte, garantissant une application stricte du plafond
- **SC-010**: Le clignotement du compteur rouge reste stable à une fréquence de 2 Hz (±0.5 Hz) pour une visibilité optimale sans risque épileptique
