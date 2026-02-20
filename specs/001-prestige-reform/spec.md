# Feature Specification: Système de Prestige "Réforme Administrative"

**Feature Branch**: `001-prestige-reform`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "Crée la spécification complète du système de Prestige \"Réforme Administrative\" pour BUREAUCRACY++"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualiser le Potentiel de Réforme (Priority: P1)

Le joueur a accumulé des ressources (Dossiers, Tampons, Formulaires) pendant sa partie. Il souhaite savoir combien de Trombones il peut obtenir avant de déclencher une Réforme Administrative. Il ouvre l'onglet Options et consulte la jauge "Potentiel de Réforme" qui affiche en temps réel : "Réforme Administrative disponible : X Trombones".

**Why this priority**: C'est le mécanisme de feedback fondamental du système de prestige. Sans cette visibilité, le joueur ne peut pas prendre de décision éclairée sur le moment optimal pour effectuer un reset. Cette fonctionnalité livre une valeur immédiate : l'information sur la progression.

**Independent Test**: Peut être testé indépendamment en accumulant différentes quantités de ressources et en vérifiant que la jauge calcule correctement le nombre de Trombones selon la formule trans-phasique. Délivre la valeur de transparence sur la progression.

**Acceptance Scenarios**:

1. **Given** le joueur est en Strate Locale avec 100 000 de Valeur Administrative Totale, **When** il ouvre l'onglet Options, **Then** la jauge affiche "Réforme Administrative disponible : 10 Trombones" (sqrt(100000/1000) = 10)
2. **Given** le joueur est en Strate Nationale avec 500 000 de Valeur Administrative Totale, **When** il ouvre l'onglet Options, **Then** la jauge affiche "Réforme Administrative disponible : 10 Trombones" (sqrt(500000/5000) = 10)
3. **Given** le joueur a 0 Valeur Administrative Totale, **When** il ouvre l'onglet Options, **Then** la jauge affiche "Réforme Administrative disponible : 0 Trombones"
4. **Given** le joueur accumule progressivement des ressources, **When** la Valeur Administrative Totale change, **Then** la jauge se met à jour en temps réel

---

### User Story 2 - Effectuer une Réforme Administrative (Priority: P1)

Le joueur décide de déclencher le prestige après avoir accumulé suffisamment de Valeur Administrative. Il clique sur le bouton "Réforme Administrative" (anciennement "Réinitialiser le jeu") dans l'onglet Options. Un dialogue de confirmation s'affiche : "Confirmer la Réforme Administrative ? Vous gagnerez X Trombones. Toutes vos ressources et infrastructures seront réinitialisées." Il confirme, et le jeu effectue le reset tout en créditant ses Trombones.

**Why this priority**: C'est le cœur du système de prestige. Sans cette capacité, le joueur ne peut pas progresser dans la boucle de progression long-terme. Cette story délivre la méta-progression complète.

**Independent Test**: Peut être testé en déclenchant manuellement le prestige et en vérifiant que : (1) les Trombones sont correctement crédités, (2) toutes les ressources sont remises à zéro, (3) les infrastructures sont réinitialisées, (4) les améliorations de prestige sont désactivées. Délivre la valeur de reset avec récompense.

**Acceptance Scenarios**:

1. **Given** le joueur a 10 Trombones potentiels et 0 Trombones en banque, **When** il confirme la Réforme Administrative, **Then** il possède 10 Trombones en banque et toutes ses ressources (Dossiers, Tampons, Formulaires) sont à 0
2. **Given** le joueur a 5 Trombones en banque et gagne 8 Trombones via prestige, **When** le reset est effectué, **Then** il possède 13 Trombones en banque (5+8)
3. **Given** le joueur avait recruté 10 agents et débloqué 5 administrations, **When** le prestige est effectué, **Then** tous les agents sont à 0 (owned=0) et toutes les administrations sont verrouillées sauf "administration-centrale"
4. **Given** le joueur avait acheté 3 améliorations de prestige dans son run précédent, **When** le prestige est effectué, **Then** toutes les améliorations de prestige sont désactivées et peuvent être rachetées
5. **Given** le joueur annule le dialogue de confirmation, **When** il clique "Annuler", **Then** aucun changement n'est appliqué et le jeu continue normalement

---

### User Story 3 - Acheter des Améliorations de Prestige (Priority: P2)

Après avoir effectué une Réforme Administrative, le joueur possède 50 Trombones. Il accède à la "Boutique de Prestige" (section dédiée dans l'onglet Options ou nouvel onglet). Il voit 5 améliorations disponibles avec leurs coûts. Il achète "Optimisation des Flux" (50 Trombones) pour bénéficier de +10% de production de Dossiers durant tout son prochain run. Le bouton de l'amélioration passe à l'état "ACTIF" et se grise pour empêcher un rachat.

**Why this priority**: Les améliorations de prestige sont la récompense tangible du système de prestige et offrent la progression permanente (via les effets temporaires récurrents). Sans elles, le prestige serait peu motivant. Cette story délivre la valeur de customisation et d'optimisation du run.

**Independent Test**: Peut être testé en créditant manuellement des Trombones au joueur, en accédant à la boutique, et en vérifiant que les achats fonctionnent correctement, que les coûts sont déduits, et que les effets s'appliquent. Délivre la valeur d'amélioration du run.

**Acceptance Scenarios**:

1. **Given** le joueur a 50 Trombones en banque, **When** il achète "Optimisation des Flux" (50 Trombones), **Then** son solde passe à 0 Trombones, le bouton de l'amélioration affiche "ACTIF" et est grisé, et un toast "Amélioration achetée : Optimisation des Flux" s'affiche avec animation de déduction des Trombones
2. **Given** le joueur a 30 Trombones en banque, **When** il tente d'acheter "Optimisation des Flux" (50 Trombones), **Then** le bouton est désactivé ou affiche un message d'erreur "Trombones insuffisants"
3. **Given** le joueur a acheté "Optimisation des Flux", **When** il tente de la racheter dans le même run, **Then** le bouton reste grisé et l'achat est impossible (non cumulable)
4. **Given** le joueur a acheté "Tampon Double Flux" (10 Trombones), **When** il clique sur le bouton TAMPONNER, **Then** il génère 2 Dossiers au lieu de 1 et un feedback visuel "+2" s'affiche
5. **Given** le joueur a acheté plusieurs améliorations, **When** il effectue une nouvelle Réforme Administrative, **Then** toutes les améliorations sont désactivées et peuvent être rachetées dans le nouveau run

---

### User Story 4 - Observer les Effets des Améliorations (Priority: P3)

Le joueur a acheté "Synergie Administrative" (+10% production globale). Il remarque que toutes ses productions (Dossiers, Tampons, Formulaires) augmentent de 10%. Il consulte ses statistiques ou observe les nombres générés et constate l'amélioration en action.

**Why this priority**: Cette story valide que les effets des améliorations s'appliquent correctement au gameplay. C'est moins critique que l'achat lui-même (P2) mais essentiel pour la satisfaction du joueur.

**Independent Test**: Peut être testé en activant manuellement une amélioration et en mesurant les productions avant/après pour vérifier l'application correcte des multiplicateurs. Délivre la valeur de feedback sur l'efficacité de l'investissement.

**Acceptance Scenarios**:

1. **Given** le joueur produit 100 Dossiers/sec sans amélioration, **When** il achète "Optimisation des Flux" (+10% Dossiers), **Then** il produit 110 Dossiers/sec
2. **Given** le joueur a une capacité de stockage de 1000 Formulaires, **When** il achète "Extension des Classeurs" (+20% capacité), **Then** sa capacité passe à 1200 Formulaires
3. **Given** le joueur a acheté "Synergie Administrative" (+10% global), **When** il consulte toutes ses productions, **Then** chaque type de ressource affiche une augmentation de 10%
4. **Given** le joueur cumule plusieurs multiplicateurs (Optimisation des Flux +10% et Synergie Administrative +10%), **When** il calcule la production finale, **Then** les multiplicateurs s'appliquent correctement (multiplicatifs : 1.1 × 1.1 = 1.21 ou additifs : 1.2 selon la règle définie)

---

### User Story 5 - Progresser entre les Strates (Priority: P3)

Le joueur a débloqué la Strate Nationale dans un run précédent. Après une Réforme Administrative, il reste en Strate Nationale (persistance de la progression des strates). Le coefficient de phase utilisé pour calculer ses Trombones est maintenant 5 000 au lieu de 1 000. Le joueur doit donc accumuler plus de Valeur Administrative pour obtenir le même nombre de Trombones.

**Why this priority**: Cette story assure que la progression entre strates est persistante et que la difficulté augmente correctement. C'est une fonctionnalité de profondeur qui s'adresse aux joueurs avancés.

**Independent Test**: Peut être testé en changeant manuellement la strate du joueur et en vérifiant que : (1) la strate persiste après prestige, (2) le coefficient de phase change correctement, (3) les calculs de Trombones reflètent le nouveau coefficient. Délivre la valeur de progression long-terme.

**Acceptance Scenarios**:

1. **Given** le joueur est en Strate Locale, **When** il débloque la Strate Nationale et effectue un prestige, **Then** il reste en Strate Nationale après le prestige
2. **Given** le joueur est en Strate Nationale avec 500 000 de Valeur Administrative, **When** il consulte le Potentiel de Réforme, **Then** il voit 10 Trombones (sqrt(500000/5000) = 10) au lieu de 22 en Strate Locale (sqrt(500000/1000) = 22)
3. **Given** le joueur est en Strate Mondiale, **When** il effectue un prestige, **Then** le coefficient de phase reste à 25 000 pour les futurs calculs
4. **Given** le joueur effectue plusieurs prestiges en Strate Nationale, **When** il débloque la Strate Mondiale, **Then** la transition est définitive et ne peut pas être inversée

---

### Edge Cases

- **Prestige avec 0 Trombones potentiels** : Que se passe-t-il si le joueur tente de réformer sans avoir accumulé suffisamment de Valeur Administrative pour obtenir au moins 1 Trombone ? Le système doit afficher un avertissement : "Réforme impossible : Valeur Administrative insuffisante (minimum requis : [X])" où X est le seuil minimum selon la strate (ex: 1000 en Locale pour obtenir 1 Trombone).

- **Overflow de Valeur Administrative** : Si la Valeur Administrative Totale dépasse les limites numériques (très grande valeur), le calcul sqrt(V/Coefficient) doit rester précis. Le système doit utiliser des nombres suffisamment grands pour éviter les bugs d'overflow (JavaScript Number.MAX_SAFE_INTEGER = 2^53-1).

- **Achat simultané d'améliorations** : Si le joueur clique très rapidement sur plusieurs améliorations, le système doit gérer correctement les transactions séquentielles et éviter les achats en double ou les déductions incorrectes de Trombones.

- **Persistance après crash** : Si l'application crashe pendant le prestige (après le reset mais avant la sauvegarde des Trombones), le système implémente un two-phase commit avec un flag `prestigeInProgress=true`. Au redémarrage, si ce flag est détecté, le système récupère l'opération en cours : soit finalise le crédit des Trombones, soit annule complètement le prestige. Aucune perte de données ne doit survenir.

- **Migration de schéma AsyncStorage** : Lors de la migration v4 → v5, si un joueur a un état corrompu ou incomplet, le système doit appliquer des valeurs par défaut sûres (ex: Trombones = 0, améliorations désactivées) plutôt que de crasher.

- **Bonus de prestige après désinstallation** : Si le joueur achète des améliorations, désinstalle l'app, puis la réinstalle, les améliorations temporaires doivent être perdues (car elles sont valables pour un run), mais le solde de Trombones doit être restauré si la sauvegarde locale existe encore.

- **Calcul de floor avec nombres décimaux** : La formule floor(sqrt(V/Coefficient)) doit arrondir vers le bas. Par exemple, sqrt(99999/1000) = 9.999... doit donner 9 Trombones, pas 10.

- **Affichage de très grands nombres** : Si le joueur accumule des millions de Trombones (après de nombreux runs), l'interface doit formater les nombres correctement en français (ex: "1 234 567 Trombones" avec espaces comme séparateurs de milliers).

- **Réforme pendant une production automatique** : Si des agents sont en train de produire des ressources au moment du prestige, le système doit arrêter proprement toutes les productions automatiques avant d'effectuer le reset pour éviter les incohérences.

## Requirements *(mandatory)*

### Functional Requirements

**Calcul et Affichage du Potentiel de Réforme**

- **FR-001**: Le système DOIT calculer en temps réel la Valeur Administrative Totale (V) en cumulant tous les Dossiers, Tampons et Formulaires produits depuis le dernier prestige
- **FR-002**: Le système DOIT afficher dans l'onglet Options une jauge "Potentiel de Réforme" montrant le nombre de Trombones que le joueur gagnerait en effectuant une Réforme Administrative maintenant
- **FR-003**: Le calcul des Trombones DOIT suivre la formule : `floor(sqrt(V / Coefficient_de_Phase))`
- **FR-004**: Le Coefficient de Phase DOIT être : 1 000 (Strate Locale), 5 000 (Strate Nationale), 25 000 (Strate Mondiale)
- **FR-005**: La jauge DOIT se mettre à jour automatiquement lorsque la Valeur Administrative Totale change

**Déclenchement de la Réforme Administrative**

- **FR-006**: Le bouton "Réinitialiser le jeu" dans l'onglet Options DOIT être renommé "Réforme Administrative"
- **FR-007**: Le système DOIT afficher un dialogue de confirmation avant d'effectuer le prestige, indiquant le nombre exact de Trombones qui seront gagnés
- **FR-008**: Le dialogue de confirmation DOIT permettre d'annuler l'opération sans aucune conséquence
- **FR-009**: Le système DOIT empêcher le prestige si le joueur gagnerait 0 Trombones, avec un message d'erreur clair indiquant le seuil minimum requis
- **FR-010**: Après confirmation, le système DOIT créditer les Trombones gagnés au solde persistant du joueur
- **FR-011**: Le système DOIT réinitialiser immédiatement toutes les ressources (Dossiers, Tampons, Formulaires) à 0

**Reset de l'Infrastructure**

- **FR-012**: Le système DOIT réinitialiser tous les agents recrutés (owned = 0 pour chaque agent)
- **FR-013**: Le système DOIT verrouiller toutes les administrations débloquées, sauf "administration-centrale" qui reste déverrouillée par défaut
- **FR-014**: Le système DOIT désactiver toutes les améliorations de prestige achetées durant le run précédent
- **FR-015**: Le système DOIT remettre la Valeur Administrative Totale à 0 après le prestige

**Persistance Post-Prestige**

- **FR-016**: Le système DOIT conserver le solde de Trombones du joueur (non dépensés + nouvellement gagnés)
- **FR-017**: Le système DOIT conserver la progression des strates (Locale → Nationale → Mondiale) de manière permanente
- **FR-018**: Le système DOIT appliquer le coefficient de phase correspondant à la strate actuelle du joueur

**Boutique de Prestige**

- **FR-019**: Le système DOIT fournir une interface de "Boutique de Prestige" accessible via une nouvelle entrée dans le burger menu (au même niveau que le journal S.I.C.)
- **FR-020**: La boutique DOIT afficher les 5 améliorations disponibles avec leurs noms, coûts en Trombones, et descriptions des effets
- **FR-021**: Le système DOIT permettre l'achat d'une amélioration si le joueur possède suffisamment de Trombones
- **FR-022**: Le système DOIT déduire le coût en Trombones du solde du joueur immédiatement après l'achat
- **FR-023**: Le système DOIT empêcher l'achat d'une amélioration déjà possédée durant le run courant (non cumulable)
- **FR-024**: Le bouton d'une amélioration achetée DOIT passer à l'état "ACTIF" avec un style visuel distinct et être grisé pour empêcher un rachat

**Effets des Améliorations**

- **FR-025**: "Tampon Double Flux" DOIT faire générer 2 Dossiers par clic sur le bouton TAMPONNER au lieu de 1
- **FR-026**: "Optimisation des Flux" DOIT augmenter la production de Dossiers de 10% (multiplicateur de run)
- **FR-027**: "Encre Haute Densité" DOIT augmenter la production de Tampons de 5% (multiplicateur de run)
- **FR-028**: "Extension des Classeurs" DOIT augmenter la capacité de stockage de Formulaires de 20%
- **FR-029**: "Synergie Administrative" DOIT augmenter toute la production (Dossiers, Tampons, Formulaires) de 10% (multiplicateur final)

**Feedback Visuel**

- **FR-030**: Le système DOIT afficher un feedback visuel "+2" ou deux "+1" flottants lorsque "Tampon Double Flux" est actif et que le joueur clique sur TAMPONNER
- **FR-031**: Le système DOIT afficher le solde de Trombones actuel du joueur dans la boutique de prestige
- **FR-032**: Le système DOIT indiquer clairement quelles améliorations sont actives durant le run courant
- **FR-033**: Lors de l'achat d'une amélioration de prestige, le système DOIT afficher un toast notification contenant le texte "Amélioration achetée : [Nom de l'amélioration]" accompagné d'une animation visuelle montrant la déduction des Trombones du solde

**Catalogue des Améliorations**

Les 5 améliorations disponibles sont :

| ID | Intitulé | Coût (Trombones) | Effet |
| --- | --- | --- | --- |
| `prestige_01` | Tampon Double Flux | 10 | Le bouton TAMPONNER génère 2 dossiers par clic |
| `prestige_02` | Optimisation des Flux | 50 | Production de Dossiers +10% |
| `prestige_03` | Encre Haute Densité | 200 | Production de Tampons +5% |
| `prestige_04` | Extension des Classeurs | 500 | Capacité de stockage de Formulaires +20% |
| `prestige_05` | Synergie Administrative | 1 500 | Production Globale +10% |

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Tous les boutons de la boutique de prestige DOIVENT avoir des zones tactiles d'au moins 44×44pt
- **AR-002**: Le statut "ACTIF" d'une amélioration achetée DOIT être indiqué par une icône ET du texte, pas uniquement par la couleur
- **AR-003**: Le contraste entre le texte et le fond DOIT respecter WCAG 2.1 AA (4.5:1 pour texte normal, 3:1 pour texte large)
- **AR-004**: Toutes les icônes des améliorations DOIVENT avoir des étiquettes d'accessibilité pour les lecteurs d'écran (ex: "Tampon Double Flux - Coût : 10 Trombones - Actif")
- **AR-005**: Le dialogue de confirmation du prestige DOIT être navigable au clavier/lecteur d'écran avec focus logique sur les boutons "Confirmer" et "Annuler"

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Tous les textes de la boutique et des dialogues DOIVENT être en français avec accents corrects (ex: "Réforme Administrative", "Trombones gagnés")
- **LR-002**: La terminologie bureaucratique DOIT être authentique : "Réforme Administrative" (prestige), "Décret temporaire" (upgrade temporaire), "Potentiel de Réforme" (prestige potential)
- **LR-003**: Les nombres de Trombones DOIVENT utiliser le formatage français avec espaces comme séparateurs de milliers (ex: "1 234 567 Trombones")
- **LR-004**: Les pourcentages DOIVENT utiliser la virgule comme séparateur décimal si nécessaire (ex: "10,5%" bien que les bonus actuels soient entiers)

### Key Entities

- **Trombone (Paperclip)**: Monnaie de prestige gagnée lors d'une Réforme Administrative. Attributs : quantité totale possédée (persistante entre les runs), montant gagné lors du dernier prestige. Relation : utilisée pour acheter des Améliorations de Prestige.

- **Valeur Administrative Totale (Total Administrative Value)**: Métrique invisible accumulée en arrière-plan. Attributs : somme cumulative de tous les Dossiers, Tampons et Formulaires produits depuis le dernier prestige. Relation : utilisée pour calculer les Trombones potentiels selon la formule trans-phasique.

- **Amélioration de Prestige (Prestige Upgrade)**: Bonus temporaire acheté avec des Trombones. Attributs : ID unique, nom, coût en Trombones, effet (multiplicateur ou capacité), statut (actif/inactif pour le run courant). Relation : achetée avec des Trombones, applique des modificateurs aux ressources ou capacités.

- **Coefficient de Phase (Phase Coefficient)**: Diviseur utilisé dans la formule de conversion de Valeur Administrative en Trombones. Attributs : valeur numérique (1 000, 5 000, ou 25 000), associée à une Strate. Relation : détermine la difficulté de génération de Trombones selon la progression du joueur.

- **Strate (Tier)**: Niveau de progression global du joueur. Attributs : nom (Locale, Nationale, Mondiale), coefficient de phase associé. Relation : persiste après prestige, influence le coefficient de phase utilisé pour les calculs de Trombones.

- **Dialogue de Confirmation (Confirmation Dialog)**: Interface de validation avant le prestige. Attributs : texte affiché, nombre de Trombones à gagner, boutons Confirmer/Annuler. Relation : déclenché par le bouton "Réforme Administrative", conditionne l'exécution du prestige.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le joueur peut consulter son Potentiel de Réforme et comprendre combien de Trombones il gagnera avant de déclencher le prestige, sans ambiguïté ni calcul manuel requis
- **SC-002**: Le système calcule les Trombones gagnés avec une précision de 100% selon la formule trans-phasique, vérifié par des tests avec différentes Valeurs Administratives et Coefficients de Phase
- **SC-003**: Le joueur peut effectuer une Réforme Administrative en moins de 30 secondes (clic sur bouton → lecture dialogue → confirmation → affichage du nouvel état), sans lag ni blocage
- **SC-004**: Après un prestige, 100% des ressources et infrastructures sont correctement réinitialisées (0 ressources, agents à 0, administrations verrouillées sauf centrale, améliorations désactivées)
- **SC-005**: Le solde de Trombones persiste à 100% entre les sessions (sauvegarde AsyncStorage fiable, pas de perte même après redémarrage de l'app)
- **SC-006**: Le joueur peut acheter une amélioration de prestige et observer son effet immédiatement (ex: "Tampon Double Flux" fait apparaître "+2" dès le premier clic après achat)
- **SC-007**: Les multiplicateurs de production s'appliquent correctement avec une marge d'erreur de ±1% maximum (testable en mesurant les taux de production avant/après achat)
- **SC-008**: La progression entre strates (Locale → Nationale → Mondiale) persiste à 100% après prestige (aucune régression possible)
- **SC-009**: Le système supporte des Valeurs Administratives allant jusqu'à 1 000 000 000 (1 milliard) sans overflow ni erreur de calcul
- **SC-010**: Aucune perte de données lors d'un prestige, même en cas de crash inopiné pendant l'opération (transaction atomique ou rollback complet)
- **SC-011**: La migration du schéma AsyncStorage v4 → v5 réussit pour 100% des joueurs existants sans perte de données (Trombones, strate, progression)
- **SC-012**: L'interface de la boutique de prestige affiche clairement l'état de chaque amélioration (disponible, achetée, bloquée par manque de Trombones) avec un taux de compréhension de 95%+ (testable via feedback utilisateur ou tests d'observation)

## Assumptions & Dependencies

### Assumptions

- **Assumption 1**: Le joueur comprend le concept de prestige dans les jeux incrémentaux (reset avec récompense pour accélérer les runs suivants). Si ce n'est pas le cas, un tutoriel ou une explication contextuelle devra être ajouté ultérieurement.

- **Assumption 2**: La Valeur Administrative Totale est trackée de manière invisible sans impact perceptible sur les performances. Le calcul incrémental (addition lors de chaque production) est suffisamment rapide.

- **Assumption 3**: Les multiplicateurs de prestige s'appliquent de manière multiplicative entre eux. Par exemple, "Optimisation des Flux" (+10% Dossiers) et "Synergie Administrative" (+10% global) donnent 1.1 × 1.1 = 1.21 (21% d'augmentation totale).

- **Assumption 4**: L'ordre d'application des multiplicateurs est : modificateurs spécifiques (par ressource) → multiplicateur global. Exemple : si un agent produit 100 Dossiers/sec, avec "Optimisation des Flux" (+10%) et "Synergie Administrative" (+10%), le calcul est : 100 × 1.1 (Optimisation) × 1.1 (Synergie) = 121 Dossiers/sec.

- **Assumption 5**: Le joueur ne peut pas acheter d'amélioration pendant le dialogue de confirmation du prestige (l'interface de boutique est inaccessible ou bloquée).

- **Assumption 6**: Le seuil minimum pour effectuer un prestige est d'obtenir au moins 1 Trombone. En Strate Locale (coefficient 1 000), cela nécessite une Valeur Administrative minimale de 1 000 (car sqrt(1000/1000) = 1).

- **Assumption 7**: Le formatage des grands nombres suit la convention française avec espaces insécables comme séparateurs de milliers (ex: "1 234 567"), géré par une fonction utilitaire réutilisable.

- **Assumption 8**: Les améliorations de prestige n'affectent pas les ressources déjà accumulées, seulement les productions futures. Par exemple, acheter "Extension des Classeurs" n'augmente pas rétroactivement les Formulaires déjà stockés.

- **Assumption 9**: La désactivation des améliorations lors du prestige est instantanée et ne nécessite pas d'animation ou de transition visuelle complexe.

- **Assumption 10**: Le dialogue de confirmation du prestige est modal (bloque toute interaction avec le reste de l'interface) pour éviter les actions concurrentes.

### Dependencies

- **Dependency 1**: Le système de strates (Locale, Nationale, Mondiale) doit être déjà implémenté et fonctionnel dans la version v4 du schéma AsyncStorage, avec un champ `currentTier` ou équivalent.

- **Dependency 2**: Le tracking des ressources produites (Dossiers, Tampons, Formulaires) doit être accessible pour calculer la Valeur Administrative Totale. Si ce tracking n'existe pas actuellement, il devra être ajouté.

- **Dependency 3**: Le bouton "Réinitialiser le jeu" existe déjà dans l'onglet Options. Son comportement sera modifié mais sa position et son contexte d'UI restent inchangés.

- **Dependency 4**: Le schéma AsyncStorage v4 doit être documenté pour permettre la conception de la migration v5 (ajout des champs `paperclips`, `totalAdministrativeValue`, `prestigeUpgrades`, etc.).

- **Dependency 5**: Les fonctions de calcul de production (Dossiers, Tampons, Formulaires) doivent être modulaires et accepter des multiplicateurs externes pour que les améliorations de prestige puissent s'intégrer proprement.

- **Dependency 6**: Le système de sauvegarde AsyncStorage doit supporter les transactions atomiques ou un mécanisme de rollback pour garantir l'intégrité des données lors du prestige.

- **Dependency 7**: Une fonction utilitaire de formatage des nombres en français doit être disponible (ou créée) pour afficher correctement les Trombones et les grandes Valeurs Administratives.

- **Dependency 8**: Le système de feedback visuel flottant (ex: "+1" lors d'un clic) doit être extensible pour afficher "+2" lorsque "Tampon Double Flux" est actif.

## Technical Constraints

### Data Persistence

- **TC-001**: Le schéma AsyncStorage doit migrer de v4 à v5 pour inclure les nouveaux champs liés au prestige
- **TC-002**: Les nouveaux champs requis dans le schéma v5 sont :
  - `paperclips`: nombre total de Trombones possédés (integer, valeur par défaut 0)
  - `totalAdministrativeValue`: Valeur Administrative Totale accumulée depuis le dernier prestige (integer, valeur par défaut 0)
  - `prestigeUpgrades`: objet/dictionnaire des améliorations actives (ex: `{ prestige_01: true, prestige_02: false, ... }`)
  - `currentTier`: strate actuelle (string, valeurs possibles : "local", "national", "global", par défaut "local" si non existant en v4)
  - `prestigeInProgress`: flag de transaction two-phase commit (boolean, valeur par défaut false, utilisé pour la récupération après crash)
- **TC-003**: La migration v4 → v5 doit préserver toutes les données existantes et initialiser les nouveaux champs avec des valeurs par défaut sûres
- **TC-004**: La sauvegarde AsyncStorage doit implémenter une transaction atomique en deux phases : (1) écriture d'un flag `prestigeInProgress=true` + snapshot de l'état pré-prestige, (2) exécution du reset et crédit des Trombones, (3) écriture finale et suppression du flag. Au redémarrage, si `prestigeInProgress=true` est détecté, le système complète ou annule l'opération selon l'état intermédiaire.

### Performance

- **TC-005**: Le calcul de la Valeur Administrative Totale doit être incrémental (mise à jour à chaque production) plutôt que cumulatif (recalcul complet), pour éviter les boucles coûteuses
- **TC-006**: La mise à jour de la jauge "Potentiel de Réforme" doit être throttled ou debounced si la Valeur Administrative change très rapidement (ex: toutes les 500ms maximum)
- **TC-007**: Le dialogue de confirmation du prestige doit s'afficher en moins de 200ms après le clic sur le bouton

### Logging & Observability

- **TC-016**: Les opérations de prestige (calcul de Trombones, reset des ressources, sauvegarde) DOIVENT logger les étapes critiques via console.log en mode développement uniquement
- **TC-017**: Les logs de production DOIVENT être désactivés pour éviter la pollution de la console en environnement release
- **TC-018**: Les logs de développement DOIVENT inclure : (1) Valeur Administrative avant prestige, (2) Trombones calculés, (3) Confirmation du reset des ressources, (4) Succès de la sauvegarde AsyncStorage

### UI/UX Constraints

- **TC-008**: La boutique de prestige doit être accessible via une nouvelle entrée dans le burger menu, au même niveau que le journal S.I.C. (pas un onglet de navigation principal)
- **TC-009**: Le renommage du bouton "Réinitialiser le jeu" → "Réforme Administrative" doit être cohérent dans tous les contextes (titre du bouton, dialogue de confirmation, messages d'erreur)
- **TC-010**: Le feedback visuel "+2" pour "Tampon Double Flux" doit être immédiatement perceptible et ne pas se superposer de manière illisible si le joueur clique rapidement
- **TC-019**: La nouvelle entrée "Boutique de Prestige" dans le burger menu NE DOIT PAS afficher de badge, notification, ou indicateur visuel pour encourager sa découverte. Le joueur doit la découvrir par exploration pure du menu

### Codebase Architecture

- **TC-011**: La logique de calcul des Trombones (formule trans-phasique) doit résider dans `data/` (logique pure, pas d'import React)
- **TC-012**: Les définitions statiques des améliorations de prestige doivent être ajoutées dans `data/gameData.ts`
- **TC-013**: Les types TypeScript pour les nouvelles entités (Trombone, Amélioration de Prestige, Coefficient de Phase) doivent être ajoutés dans `types/game.ts`
- **TC-014**: Le Context API (`GameStateContext.tsx`) doit exposer les fonctions : `performPrestige()`, `buyPrestigeUpgrade(upgradeId)`, `getPrestigePotential()`
- **TC-015**: Le reset des ressources et infrastructures doit réutiliser les fonctions existantes de reset (si disponibles) pour éviter la duplication de code

## Clarifications

### Session 2026-02-20

- Q: Comment garantir l'atomicité du prestige en cas de crash pendant l'opération (après reset des ressources mais avant sauvegarde des Trombones) ? → A: Two-phase commit avec flag `prestigeInProgress=true`, récupération au redémarrage si crash.
- Q: Quelle profondeur de logging doit être utilisée pour les opérations de prestige et de calcul de Trombones ? → A: Logging détaillé en mode dev uniquement (console.log des étapes critiques, mais désactivé en production pour éviter la pollution).
- Q: Quel feedback visuel doit être affiché lors de l'achat d'une amélioration de prestige ? → A: Toast "Amélioration achetée : [Nom]" + animation déduction Trombones.
- Q: Où la Boutique de Prestige doit-elle être accessible dans l'interface utilisateur ? → A: Une nouvelle entrée dans le burger menu (avec le journal S.I.C.) — la boutique de prestige est accessible via le menu burger, au même niveau que le journal S.I.C., pas un onglet de navigation principal.
- Q: Comment la Boutique de Prestige doit-elle être signalée ou découverte par le joueur la première fois ? → A: Aucun signal, découverte par exploration pure (pas de badge, notification, ou indicateur visuel).

## Out of Scope

Les éléments suivants ne font **PAS** partie de cette feature et seront traités séparément si nécessaire :

- **Tutoriel ou explication du prestige** : Aucune interface d'aide, tooltip ou guide explicatif n'est inclus dans cette spec. Le joueur est supposé comprendre le prestige ou l'apprendre par expérimentation.

- **Statistiques de prestige** : Pas de tracking du nombre total de prestiges effectués, du temps moyen par run, ou d'autres métriques historiques.

- **Événements spéciaux ou quêtes liées au prestige** : Pas de débloquables conditionnels, de succès (achievements), ou de récompenses bonus pour avoir effectué X prestiges.

- **Prestige automatique** : Pas de fonctionnalité permettant au joueur de configurer un prestige automatique lorsqu'un seuil de Trombones est atteint.

- **Import/Export de sauvegarde** : La gestion de backups manuels ou de transfert de sauvegarde entre appareils n'est pas couverte.

- **Animations élaborées** : Les transitions visuelles lors du prestige sont minimales (dialogue → reset → nouvel état). Pas d'animations complexes de particules, de fondu enchaîné, ou d'effets spéciaux.

- **Équilibrage des coûts et effets** : Les valeurs des coefficients de phase (1 000, 5 000, 25 000) et des coûts d'améliorations (10, 50, 200, 500, 1 500) sont fixées dans cette spec. Leur ajustement suite à des tests de gameplay sera traité dans une itération future.

- **Nouvelles améliorations de prestige** : Le catalogue est limité à 5 améliorations. L'ajout de nouvelles améliorations (ex: "Bureaucrate Zélé", "Surcharge Administrative") sera traité dans une feature distincte.

- **Intégration avec des systèmes futurs** : Cette feature ne prévoit pas d'interactions avec des mécaniques non encore implémentées (ex: événements aléatoires, mini-jeux, système de réputation).
