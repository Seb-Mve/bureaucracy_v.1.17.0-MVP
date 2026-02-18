# Feature Specification: Système de Messages S.I.C.

**Feature Branch**: `001-sic-message-system`  
**Created**: 2025-01-23  
**Status**: Draft  
**Input**: User description: "Ajouter le système de messages S.I.C. (Service Inconnu de Coordination) sous deux formes complémentaires dans le jeu BUREAUCRACY++ : 1. Notifications toast visibles sur tous les écrans (messages S.I.C. mystérieux + alertes 'Tampon non conforme'). 2. Journal S.I.C. accessible via burger menu dans le header, contenant l'historique et indices narratifs cachés (administrations débloquables, système Conformité). Badge rouge indiquant entrées non lues."

## Clarifications

### Session 2025-01-23

- Q: Badge d'entrées non lues sur le bouton burger du journal S.I.C. — souhaitez-vous afficher un indicateur visuel (badge rouge avec compteur numérique) ou adopter une approche de découverte pure sans notification ? → A: Option A — Aucun badge, aucun indicateur (découverte pure)
- Q: Animation d'apparition des toasts — quelle approche préférez-vous pour l'animation d'entrée qui renforce l'atmosphère bureaucratique du S.I.C. ? → A: Option C — Slide + micro-bounce (effet "tampon qui frappe le papier")
- Q: Dismiss manuel des toasts — les joueurs doivent-ils pouvoir fermer manuellement les toasts en tapant dessus, ou préférez-vous qu'ils soient purement passifs et atmosphériques (auto-dismiss uniquement) ? → A: Pas de dismiss manuel, toasts auto-dismissed uniquement
- Q: Contradiction dans FR-004 — FR-004 stipule "Les utilisateurs DOIVENT pouvoir fermer manuellement un toast en tapant dessus", ce qui contredit la réponse précédente (toasts auto-dismiss uniquement). Voulez-vous mettre à jour FR-004 pour supprimer le dismiss manuel et garder les toasts passifs et atmosphériques, cohérent avec la philosophie "découverte pure" ? → A: Yes — mettre à jour FR-004 pour supprimer le dismiss manuel
- Q: Stratégie de débordement des toasts — si plus de 3 toasts sont déclenchés simultanément (limite d'affichage max 3), que se passe-t-il avec les suivants ? → A: Option A — Drop overflow silencieux (max 3 toasts actifs, les suivants ignorés)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recevoir messages S.I.C. en temps réel (Priority: P1)

Un joueur actif produit des ressources dans BUREAUCRACY++. Lorsqu'un palier de production est franchi (100 dossiers, 50 tampons ou 25 formulaires), le système peut déclencher un message S.I.C. qui apparaît instantanément en haut de l'écran sous forme de toast avec animation slide + micro-bounce (effet "tampon qui frappe le papier"), quel que soit l'écran affiché (Bureau, Agents, autres administrations). Le message reste visible 5 secondes puis disparaît automatiquement avec animation. Le toast est purement atmosphérique et passif (non cliquable). Le message a un style bureaucratique mystérieux typique du S.I.C. ("Ce dossier a été transféré au S.I.C. pour traitement ultérieur").

**Why this priority**: C'est la fonctionnalité core qui apporte la narration ambiante au jeu. Sans cela, le reste du système (journal, hints) n'a pas de sens. Cette story délivre immédiatement de la valeur narrative et de l'immersion.

**Independent Test**: Peut être testée en lançant le jeu, produisant 100 dossiers, et vérifiant qu'un toast S.I.C. apparaît en haut de l'écran avec animation slide-in. Testable sans le journal ou les autres features.

**Acceptance Scenarios**:

1. **Given** je suis sur l'écran Bureau avec 90 dossiers produits, **When** je franchis le seuil de 100 dossiers, **Then** un toast S.I.C. apparaît en haut de l'écran avec animation slide-in + micro-bounce (effet tampon), affichant un message bureaucratique aléatoire en français
2. **Given** un toast S.I.C. est visible depuis 5 secondes, **When** le temps d'auto-dismiss expire, **Then** le toast disparaît avec animation slide-out vers le haut
3. **Given** un toast S.I.C. est affiché, **When** je tape sur le toast, **Then** rien ne se passe (toast passif, non interactif)
4. **Given** je suis sur l'écran Agents (ou toute autre administration), **When** un message S.I.C. se déclenche, **Then** le toast apparaît au même endroit (haut de l'écran) de manière cohérente avec la même animation slide + micro-bounce
5. **Given** j'ai déjà reçu un message S.I.C. il y a 2 minutes, **When** un nouveau palier est franchi, **Then** la probabilité de nouveau message est réduite (cooldown actif) mais pas nulle
6. **Given** je n'ai pas reçu de message S.I.C. depuis 35 minutes, **When** un palier est franchi, **Then** la probabilité de message est augmentée (boost actif)

---

### User Story 2 - Recevoir alertes critiques de non-conformité (Priority: P2)

Un joueur produit massivement des ressources. Très rarement (0.2% de chance, max 1 fois par 10 minutes), lors d'un franchissement de palier, au lieu d'un message S.I.C. normal, une alerte spéciale "Tampon non conforme détecté" apparaît en toast avec un style visuel plus inquiétant (bordure rouge au lieu de bleue) et la même animation slide + micro-bounce. Cette alerte reste aussi 5 secondes puis disparaît automatiquement (non dismissable manuellement, cohérent avec les toasts S.I.C.). Elle crée un moment de surprise et de tension narrative.

**Why this priority**: Cette story ajoute une couche d'événements rares et mémorables qui renforcent l'atmosphère mystérieuse du jeu. Moins critique que les messages S.I.C. normaux (P1) mais complète l'expérience narrative. Peut être développée indépendamment après P1.

**Independent Test**: Peut être testée en simulant manuellement un trigger de non-conformité (via débogage ou test unitaire) et vérifiant qu'un toast rouge avec texte d'alerte apparaît. Ne dépend pas du journal.

**Acceptance Scenarios**:

1. **Given** je franchis un palier de production, **When** le système tire une probabilité de 0.2% et l'alerte se déclenche, **Then** un toast d'alerte "Tampon non conforme" apparaît avec style visuel distinct (bordure rouge, fond sombre rougeâtre)
2. **Given** une alerte de non-conformité vient de se déclencher, **When** je franchis un nouveau palier dans les 10 minutes suivantes, **Then** aucune nouvelle alerte ne peut se déclencher (rate limiting actif)
3. **Given** une alerte de non-conformité est affichée, **When** 5 secondes s'écoulent, **Then** l'alerte disparaît avec animation identique aux messages S.I.C. normaux
4. **Given** un toast S.I.C. normal et un toast d'alerte se déclenchent simultanément, **When** les deux s'affichent, **Then** ils sont stackés verticalement (maximum 3 toasts visibles)

---

### User Story 3 - Consulter journal complet dans drawer latéral (Priority: P3)

Un joueur veut revoir les messages S.I.C. reçus précédemment ou explorer les indices narratifs cachés. Il tape sur le bouton burger (☰) dans le header de l'application (visible sur tous les tabs). Un panneau latéral glisse depuis la droite, occupant la pleine hauteur de l'écran, et affiche une liste chronologique inversée (plus récent en haut) de toutes les entrées : messages S.I.C., alertes de non-conformité, et indices narratifs. Le joueur peut scroller la liste, puis fermer le drawer en tapant à l'extérieur ou via un bouton de fermeture. Le journal offre une découverte pure sans indicateur visuel d'entrées non lues.

**Why this priority**: Le journal offre une fonctionnalité de référence et de discovery, mais n'est pas critique pour l'expérience core du jeu. Un joueur peut profiter des messages temps-réel (P1/P2) sans jamais ouvrir le journal. Cette story est parfaite pour développement ultérieur.

**Independent Test**: Testable indépendamment en créant manuellement des entrées dans le journal (via data seed) et vérifiant que le drawer s'ouvre, affiche les entrées en ordre inverse chronologique, et se ferme correctement.

**Acceptance Scenarios**:

1. **Given** le header de l'application est visible, **When** je regarde le headerRight, **Then** je vois un bouton burger (☰) avec minimum 44×44pt de touch target
2. **Given** je suis sur n'importe quel écran, **When** je tape sur le bouton burger, **Then** un drawer latéral glisse depuis la droite avec animation fluide (durée ~300ms)
3. **Given** le drawer S.I.C. est ouvert, **When** je regarde son contenu, **Then** je vois la liste des entrées en ordre chronologique inverse (plus récent en haut) avec scroll vertical
4. **Given** le drawer affiche 10 entrées (messages + alertes), **When** je scroll verticalement, **Then** la liste scroll fluidement avec tous les items accessibles
5. **Given** le drawer S.I.C. est ouvert, **When** je tape en dehors du drawer (overlay), **Then** le drawer se ferme avec animation slide vers la droite
6. **Given** le drawer est ouvert, **When** je tape sur un bouton de fermeture (si présent), **Then** le drawer se ferme immédiatement

---

### User Story 4 - Découvrir indices narratifs cachés (Priority: P4)

Un joueur explore le journal S.I.C. et remarque des entrées spéciales avec du texte partiellement masqué style "document officiel censuré" (█████ ███████ ████). Ces entrées correspondent à des déverrouillages futurs :
- Lorsqu'une nouvelle administration devient débloquable (conditions remplies mais pas encore achetée), une entrée redactée apparaît dans le journal
- Lorsque le système de Conformité aléatoire se déverrouille (atteinte du seuil), une entrée spéciale redactée apparaît

Quand le joueur remplit effectivement la condition (achète l'administration, déverrouille la Conformité), l'entrée passe de l'état "redacté" à "révélé" avec le texte complet affiché. Cela crée une mécanique de discovery narrative.

**Why this priority**: Cette story est purement narrative et optionnelle. Elle enrichit l'expérience mais n'impacte pas le gameplay core. Peut être développée en dernier sans bloquer les autres stories. Nécessite que le journal (P3) soit déjà fonctionnel.

**Independent Test**: Testable en créant manuellement des conditions de déblocage (via data manipulation) et vérifiant que les entrées redactées apparaissent, puis se révèlent quand les conditions sont remplies.

**Acceptance Scenarios**:

1. **Given** j'ai atteint les ressources nécessaires pour débloquer la 2e administration (mais je ne l'ai pas encore achetée), **When** j'ouvre le journal S.I.C., **Then** je vois une nouvelle entrée avec texte partiellement redacté (█████ ███████ ████)
2. **Given** une entrée d'administration est en état "redacté", **When** j'achète effectivement cette administration, **Then** l'entrée dans le journal se met à jour et affiche le texte complet révélé (par exemple : "Nouvelle administration disponible : Ministère des Affaires Obscures")
3. **Given** j'atteins le seuil de déblocage du système Conformité (1000 tampons + 500 formulaires), **When** j'ouvre le journal, **Then** une entrée spéciale redactée apparaît concernant le système Conformité
4. **Given** l'entrée Conformité est redactée, **When** le système Conformité est activé, **Then** l'entrée se révèle avec le texte complet visible
5. **Given** une entrée narrative est en état "révélé", **When** je recharge le jeu, **Then** l'entrée reste révélée (persistance de l'état)
6. **Given** plusieurs indices narratifs existent (2 administrations + Conformité), **When** j'ouvre le journal, **Then** ces entrées sont mélangées chronologiquement avec les messages S.I.C. et alertes selon leur timestamp de création

---

### Edge Cases

- **Que se passe-t-il si le joueur reçoit 5 toasts simultanément ?** Le système affiche les 3 premiers toasts uniquement (max stacking). Les toasts supplémentaires au-delà de 3 sont ignorés silencieusement (drop overflow). Cela préserve la simplicité et l'atmosphère passive du système. Les toasts ignorés NE créent PAS d'entrée dans le journal.
- **Que se passe-t-il si le joueur ouvre le journal pendant qu'un toast est visible ?** Les deux UI doivent coexister sans conflit de z-index. Le toast doit rester au-dessus du drawer overlay.
- **Comment gérer les entrées du journal sur un nouvel appareil après restauration cloud ?** Toutes les entrées doivent être persistées dans GameState et restaurées. Le compteur d'entrées non lues doit être recalculé au chargement.
- **Que se passe-t-il si un message S.I.C. se déclenche alors que l'app est en background ?** Pas de notification push prévue. Le message sera visible au retour en foreground si le trigger survient pendant l'activité de production passive.
- **Comment gérer l'accessibilité du texte redacté ?** Les blocs █████ doivent avoir un accessibilityLabel approprié ("Texte censuré" ou "Information classifiée") pour les screen readers.
- **Que se passe-t-il si le joueur supprime manuellement les données de jeu ?** Le journal est perdu (pas de backup externe). Comportement identique à une nouvelle installation.
- **Comment gérer la performance du journal avec 1000+ entrées ?** Utiliser une FlatList avec virtualisation pour n'afficher que les entrées visibles à l'écran. Prévoir un maximum d'entrées stockées (par exemple 500) avec rotation automatique des plus anciennes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher des toasts de messages S.I.C. en haut de l'écran (sous la safe area) avec animation slide-in + micro-bounce (effet "tampon qui frappe le papier"), visibles sur tous les écrans de l'application
- **FR-002**: Les toasts S.I.C. DOIVENT utiliser le texte fourni par `getRandomSICMessage()` de `data/messageSystem.ts`, avec style visuel bureaucratique (fond sombre, bordure bleue, police claire)
- **FR-003**: Chaque toast S.I.C. DOIT s'auto-dismisser après 5000 millisecondes avec animation slide-out vers le haut
- **FR-004**: Les toasts DOIVENT être purement atmosphériques et passifs (non interactifs) — taper sur un toast ne produit aucun effet (pas de dismiss manuel)
- **FR-005**: Le système DOIT afficher des toasts d'alerte "Tampon non conforme détecté" avec style visuel distinct (bordure rouge, fond rougeâtre) selon probabilité et rate limiting de `data/messageSystem.ts`
- **FR-006**: Le système DOIT vérifier à chaque franchissement de palier de production (100 dossiers, 50 tampons, 25 formulaires) s'il faut déclencher un message S.I.C. ou une alerte
- **FR-007**: Le système DOIT appliquer la logique de cooldown/boost de probabilité selon `calculateSICProbability()` et `shouldTriggerNonConformity()`
- **FR-008**: Le système DOIT persister `messageSystem.sicLastTriggerTime` et `messageSystem.nonConformityLastTriggerTime` dans GameState à chaque déclenchement
- **FR-009**: Le système DOIT limiter le nombre de toasts affichés simultanément à 3 maximum, stackés verticalement avec offset de 10pt. Les toasts supplémentaires au-delà de cette limite DOIVENT être ignorés silencieusement (drop overflow) sans créer d'entrée de journal.
- **FR-010**: L'application DOIT afficher un bouton burger (☰) dans le `headerRight` du header partagé, visible sur tous les tabs/écrans
- **FR-011**: Le système DOIT ouvrir un drawer latéral pleine hauteur depuis la droite avec animation fluide (~300ms) quand l'utilisateur tape sur le bouton burger
- **FR-012**: Le drawer S.I.C. DOIT afficher une liste scrollable en ordre chronologique inverse (plus récent en haut) de toutes les entrées du journal
- **FR-013**: Le journal DOIT contenir trois types d'entrées : messages S.I.C., alertes de non-conformité, et indices narratifs cachés
- **FR-014**: Chaque entrée de message S.I.C. ou alerte DOIT afficher le texte du message, le timestamp de création, et un indicateur visuel du type (icône ou couleur)
- **FR-015**: Le système DOIT créer une entrée de journal pour chaque toast affiché (messages S.I.C. et alertes), avec timestamp automatique
- **FR-016**: Le système DOIT persister toutes les entrées du journal dans GameState pour restauration au rechargement
- **FR-017**: Le drawer DOIT se fermer avec animation slide vers la droite quand l'utilisateur tape sur l'overlay extérieur ou un bouton de fermeture
- **FR-018**: Le système DOIT créer une entrée narrative "redactée" dans le journal quand une nouvelle administration devient débloquable (ressources suffisantes mais pas encore achetée)
- **FR-019**: Le système DOIT créer une entrée narrative "redactée" dans le journal quand le système Conformité se déverrouille (seuils atteints)
- **FR-020**: Les entrées narratives redactées DOIVENT afficher du texte partiellement masqué avec blocs █████ ███████ ████
- **FR-021**: Le système DOIT révéler le texte complet d'une entrée narrative quand la condition associée est effectivement remplie (administration achetée, Conformité activée)
- **FR-022**: Le système DOIT garantir que le ToastContainer est monté au niveau racine de l'application (App.tsx ou layout root), pas seulement sur l'écran Bureau
- **FR-023**: Le système DOIT utiliser le composant `ToastContainer` existant ou l'adapter pour être monté globalement avec accès au GameState
- **FR-024**: Le drawer S.I.C. DOIT utiliser une FlatList avec virtualisation pour afficher efficacement jusqu'à 500 entrées sans dégradation de performance
- **FR-025**: Le système DOIT implémenter une rotation automatique des entrées du journal si le nombre dépasse 500 (suppression des plus anciennes)

### Accessibility Requirements (Constitutional - Principle IV)

- **AR-001**: Le bouton burger (☰) DOIT avoir une zone tactile minimum de 44×44pt pour faciliter la sélection
- **AR-002**: Le bouton burger DOIT avoir un accessibilityLabel descriptif ("Ouvrir le journal S.I.C.") et accessibilityRole="button"
- **AR-003**: Les toasts DOIVENT avoir accessibilityLiveRegion="polite" pour annoncer les nouveaux messages aux screen readers
- **AR-004**: Chaque toast DOIT avoir un accessibilityLabel égal au texte du message (pas de accessibilityHint car les toasts ne sont pas interactifs)
- **AR-005**: Les entrées du journal DOIVENT avoir des accessibilityLabels clairs incluant type, timestamp et contenu
- **AR-006**: Le texte redacté (█████) DOIT avoir un accessibilityLabel approprié ("Information classifiée" ou "Texte censuré") pour les screen readers
- **AR-007**: Le contraste de couleur des toasts DOIT respecter WCAG 2.1 AA : texte blanc sur fond sombre avec ratio minimum 4.5:1
- **AR-008**: Les bordures de couleur des toasts (bleue/rouge) NE DOIVENT PAS être le seul indicateur de type (ajouter icône ou texte explicite)
- **AR-009**: Le drawer DOIT être dismissable au clavier (touche Escape si support clavier externe) en plus du tap

### Localization Requirements (Constitutional - Principle III)

- **LR-001**: Tous les messages S.I.C. DOIVENT être en français correct avec accents appropriés (déjà fournis dans `SIC_MESSAGES`)
- **LR-002**: Le texte d'alerte "Tampon non conforme détecté" DOIT utiliser la terminologie bureaucratique française authentique
- **LR-003**: Les labels d'accessibilité DOIVENT être en français ("Appuyez pour fermer cette notification", "Ouvrir le journal S.I.C.")
- **LR-004**: Les timestamps dans le journal DOIVENT utiliser le format français : "23 janv. 2025 à 14:30" ou format relatif ("Il y a 2 minutes")
- **LR-005**: Les textes révélés des indices narratifs DOIVENT utiliser un vocabulaire bureaucratique français cohérent avec le tone du jeu
- **LR-006**: Le titre du drawer DOIT être "Journal S.I.C." ou "Historique S.I.C." en français
- **LR-007**: Les messages d'état vide (journal sans entrées) DOIVENT être en français ("Aucune entrée pour le moment")

### Key Entities *(include if feature involves data)*

- **JournalEntry**: Représente une entrée dans le journal S.I.C. Attributs : `id` (unique), `type` ('sic' | 'non-conformity' | 'narrative-hint'), `text` (contenu du message), `timestamp` (date de création), `isRevealed` (booléen, seulement pour narrative-hints), `revealedText` (texte complet pour hints, optionnel)

- **NarrativeHint**: Sous-type de JournalEntry pour indices narratifs. Attributs additionnels : `triggerCondition` (quelle condition déverrouille cet indice), `targetId` (ID de l'administration ou système concerné), `redactedText` (texte avec █████), `revealedText` (texte complet)

- **ToastQueue**: Queue interne maintenue par ToastContainer. Gère l'affichage séquentiel des toasts avec maximum 3 visibles simultanément. Non persisté dans GameState (éphémère).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les joueurs reçoivent un message S.I.C. visible dans les 500ms suivant le franchissement d'un palier de production (si trigger activé), sur n'importe quel écran de l'application
- **SC-002**: 100% des toasts S.I.C. et alertes s'auto-dismissent après exactement 5 secondes ± 100ms, avec animation fluide sans saccade
- **SC-003**: Le drawer S.I.C. s'ouvre et se ferme en moins de 350ms avec animation fluide à 60fps minimum
- **SC-004**: Le journal affiche correctement jusqu'à 500 entrées avec scroll fluide (60fps) sur appareils mid-range (iPhone 12 / Android équivalent)
- **SC-005**: Les joueurs peuvent découvrir au moins une entrée narrative cachée avant d'acheter la 2e administration (hint de déblocage visible)
- **SC-006**: Les entrées narratives passent de l'état "redacté" à "révélé" instantanément (< 100ms) quand la condition est remplie
- **SC-007**: Le système maintient 100% de cohérence de données entre toasts affichés et entrées du journal (chaque toast génère exactement une entrée)
- **SC-008**: Le taux de complétion de la user story P1 (messages temps-réel) permet aux 90% des joueurs de recevoir au moins 1 message S.I.C. dans les 10 premières minutes de jeu
- **SC-009**: L'accessibilité permet aux utilisateurs de VoiceOver/TalkBack de naviguer le journal et comprendre 100% des entrées (testable via audit d'accessibilité)
