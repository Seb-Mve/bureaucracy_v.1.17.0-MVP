# Feature Specification: Acte I — Le Guichet

**Feature Branch**: `main` (développement direct, choix du porteur de projet)
**Created**: 2026-09-28
**Status**: Draft
**Input**: Refonte complète du jeu selon le document de design « Bureaucracy++ — Document de design » (6 actes). Ce ticket couvre le prototype de l'acte I uniquement, dans la charte « Pastel Dystopia / Soft-Vector ».

## Intention

En 90 minutes environ, le joueur découvre qu'une administration financée à l'activité gagne plus à **rejeter** qu'à **accepter** les dossiers, et il choisit de le faire. Le prototype remplace entièrement la P1 actuelle (3 ressources, 25 agents, 5 administrations). L'ancienne sauvegarde est ignorée.

## Glossaire (ressources de l'acte I)

| Ressource | Rôle | Visible |
|---|---|---|
| Tampons apposés | Score : +1 par dossier traité, ne baisse jamais | Toujours |
| Budget (€) | Dotation reçue par dossier traité (accepté **ou** rejeté) | Toujours |
| Formulaires | Consommés à chaque dossier (N pièces). Achetés avec le budget | Toujours |
| Dossiers | File d'attente du guichet (nouvelles demandes + retours) | Toujours |
| Usagers | Population du périmètre, avec une patience | Cachée (visages dans la file seulement) |
| Conformité | Note du S.I.C. : monte avec les rejets et les pièces | Cachée jusqu'à la note « Audit interne » |

## Boucle de jeu

1. Les usagers **inactifs** du périmètre déposent des demandes à un rythme fixe (`demandeRate`). Au lancement, 30 dossiers en retard attendent déjà.
2. **Tamponner** (tap) traite le dossier en tête de file. Les **collègues** traitent automatiquement.
3. Chaque dossier consomme `pieces` formulaires. Sans formulaires, rien n'est traité (« Rupture d'imprimés »).
4. Chaque dossier traité rapporte `+1 tampon` et la **dotation** en budget.
5. Une fraction `tauxRejet` des dossiers est rejetée (répartition déterministe, pas de hasard) :
   - l'usager perd 1 point de patience et **revient** après `delaiRetour` secondes ;
   - à 0 patience, il **abandonne** définitivement (il quitte la population, sans message) ;
   - chaque rejet rapporte des points de Conformité.
6. Un dossier accepté renvoie l'usager parmi les inactifs ; il redéposera plus tard.

Conséquence voulue : quand le guichet traite plus vite que la demande (milieu d'acte), **rejeter multiplie le nombre de dossiers**, donc le budget. C'est la découverte centrale de l'acte.

## Parcours joueur

### US1 — Le Cerfa d'embauche (P1)
Au premier lancement, un formulaire plein écran « Cerfa n° 00001*01 — Demande d'emploi d'agent administratif » demande un prénom (facultatif, 20 caractères max) et deux cases à cocher. Le bouton TAMPONNER valide et affiche « Bienvenue. Guichet 3. ». Le prénom est stocké **uniquement** dans la sauvegarde locale.

**Acceptance**
1. Sans prénom, le joueur peut valider ; il est alors « Agent sans prénom ».
2. Après validation, l'écran du Guichet s'affiche et le Cerfa ne réapparaît plus.

### US2 — Le Guichet (P1)
Écran principal, dans l'ordre vertical de la charte : compteurs, scène (illustration existante du bureau + bulle de l'usager en tête de file), panneau (file d'attente et curseur de rejet), bouton TAMPONNER, navigation.

**Acceptance**
1. La file affiche les 3 premiers usagers : avatar pastel avec initiales, prénom + nom, demande, humeur selon la patience (content, neutre, excédé).
2. Après la note « Numérotation des usagers », les noms sont remplacés par des numéros de ticket et les avatars par un pictogramme de ticket.
3. Un tap sur TAMPONNER traite 1 dossier (plus avec les améliorations) avec retour immédiat : le bouton s'enfonce, haptique légère, « +1 » flottant sur le compteur.
4. Si la file est vide, le bouton reste actif et affiche « Aucun dossier ». Si les formulaires manquent, il affiche « Rupture d'imprimés ».

### US3 — Le Taux de rejet (P1)
Débloqué par la note de service n° 2. Curseur de 0 % à `rejetMax` (50 %, puis 80 %). Jauge hachurée orange.

**Acceptance**
1. À 0 %, aucun dossier n'est rejeté ; à 50 %, exactement un dossier sur deux l'est.
2. Un dossier rejeté affiche brièvement le tampon « REJETÉ » (rouge rejet) sur la bulle de la scène.

### US4 — Recrutement et fournitures (P1)
Onglet « Recrutement » : collègues (coût exponentiel ×1,15) et achat de formulaires par ramette.

### US5 — Notes de service (P1)
Onglet « Notes » : liste des notes débloquées, chacune avec numéro, titre, texte satirique, coût, effet. Certaines exigent un **délai d'instruction** en temps réel (1 à 8 minutes) avant de prendre effet. Une pastille signale les notes nouvelles.

### US6 — Le courrier du S.I.C. (P2)
Une enveloppe dans l'en-tête ouvre le courrier. Des lettres arrivent sur des jalons (voir `data/courrier.ts`). Le courrier est aussi le résumé des absences (« Pendant votre absence, le guichet a traité 1 240 dossiers »).

### US7 — Démission (P2)
Options → « Déposer ma démission » : formulaire, puis « Demande n° 000001 enregistrée. Délai d'instruction : indéterminé. » Des lettres du S.I.C. répondent ensuite que la demande est incomplète, en citant une pièce que le joueur vient d'ajouter.

### US8 — Fin de l'acte I (P1)
Quand la Conformité atteint 100 %, la note finale « Demande de réaffectation » apparaît. Son achat affiche un écran de fin d'acte (« Une réaffectation de niveau supérieur pourrait être envisagée… — Fin de l'acte I »). Le joueur peut continuer à jouer ensuite.

### US9 — Progression hors-ligne (P2)
Au retour, le temps écoulé (plafonné à 2 h) est simulé avec les collègues seuls. Le résultat arrive par courrier.

## Rythme cible (vérifié par `scripts/simulate-acte1.ts`)

Mesures du joueur-robot (achats immédiats, rejet toujours au maximum). Un joueur humain, qui lit et hésite, est estimé 1,3 à 1,5 fois plus lent.

| Jalon | Robot 1 tap/s | Robot 3 taps/s | Cible humaine |
|---|---|---|---|
| Premier collègue | 0,3 min | 0,2 min | 1 – 3 min |
| Taux de rejet débloqué | 3,4 min | 2,3 min | 3 – 6 min |
| Numérotation des usagers | 29 min | 20 min | 25 – 40 min |
| Conformité révélée (audit) | 44 min | 38 min | 50 – 65 min |
| Fin de l'acte | 71 min | 63 min | 85 – 100 min |

## Hors périmètre
Actes II à VI, trombones et Réforme, Atelier des Procédures, notifications push. Aucune migration de l'ancienne sauvegarde.

## Accessibilité et localisation
- Cibles tactiles ≥ 44×44 pt, libellés d'accessibilité sur tous les boutons et images.
- Aucune information portée par la seule couleur (humeur = icône + couleur ; rejet = mot « REJETÉ »).
- Nombres au format français (`1 234`, `1,5 k`).
