# Feature Specification: Lisibilité et équilibrage de l'acte I

**Feature Branch**: `main` (développement direct, choix du porteur de projet)
**Created**: 2026-09-29
**Status**: Draft
**Input**: Retours de playtest sur l'acte I (spec 007) :
1. On ne comprend pas la mécanique au démarrage : on clique pour voir, sans cadre.
2. Avec quelques collègues (~3 dossiers/s), la file d'attente reste bloquée entre 0 et -1 et ne remonte jamais. Taper en plus des collègues ne sert plus à rien.
3. Le prix des collègues est incohérent : le 11ᵉ stagiaire coûte 81 € pour +0,10 dossier/s, alors qu'un agent d'accueil coûte 170 € pour +0,5 dossier/s.

## Diagnostic

### Le goulot de la demande (retour 2)
Le débit d'arrivée vaut `(population − dossiers en cours) × demandeRate`. Avec `demandeRate = 1/60` et 100 usagers, le plafond est d'environ **1,7 dossier/s** (2,5/s après la note « Horaires »). Chaque dossier qui arrive est traité dans le même tick. Dès que la capacité des collègues dépasse ce plafond, la file reste à 0 : le compteur ne peut plus monter, et **le tap et les collègues se disputent les mêmes dossiers**. L'action principale devient inutile dès les premières minutes.

Reproduction : 10 stagiaires et 4 agents d'accueil (3 d/s), avec la note « Horaires », pendant 10 min. La file reste à exactement 0 tout du long, pendant que les dossiers traités augmentent de 2,5/s. Le simulateur actuel montre une file entre 0 et 4 pendant tout l'acte.

Le « -1 » est un résidu flottant (par exemple -1e-15) affiché avec `Math.floor`.

### Le prix des collègues (retour 3)
À prix de base, le stagiaire coûte 200 € par dossier/s et l'agent d'accueil 300 €. Avec une croissance de +15 % par achat, le stagiaire devient moins rentable dès le 3ᵉ exemplaire, et il ne le redevient jamais. En plus, les deux sont débloqués en même temps (note n° 1).

### L'accueil du joueur (retour 1)
La fiche de poste n'explique que « tamponner / budget / formulaires ». Ensuite, les collègues, le rejet, le périmètre et la Conformité arrivent sans aucun cadre.

## Décisions

| # | Décision | Alternative écartée |
|---|---|---|
| D1 | **Demande abondante** : la file est un stock qui ne se vide presque jamais. Le frein devient la capacité de traitement et les formulaires. | Garder le goulot de la demande et le rendre lisible (le tap resterait inutile). Donner une autre fonction au tap (frustrant pour un clicker). |
| D2 | Paliers d'ancienneté et ratios de prix croissants par rang. | Croissance des prix plus douce seule. Simple affichage de la rentabilité. |
| D3 | Onboarding par « Ordre du jour » (une consigne à la fois) et circulaires ponctuelles. | Fiche de poste enrichie. Tutoriel guidé avec surbrillances. |
| D4 | La découverte centrale de l'acte change de ressort : rejeter ne multiplie plus le nombre de dossiers, mais **un dossier rejeté rapporte plus** (prime) et produit de la Conformité. | — |

## US1 — Une file qui ne se vide plus (P1)

### Modèle
- On garde la règle « un usager, un dossier » : la file (+ retours) ne dépasse jamais la population.
- On passe `demandeRate` de 1/60 à **environ 1/8** (valeur finale fixée au simulateur).
- La file s'équilibre autour de `population − capacité / (demandeRate × demandeMult)`. Avec 100 usagers et une capacité de 2 d/s, elle tourne autour de 80 dossiers.
- Quand la capacité s'approche du plafond `population × demandeRate × demandeMult`, la file baisse progressivement. C'est le signal qu'il faut étendre le périmètre.
- Les extensions de périmètre (aujourd'hui +240, +900, +3 000) et leurs seuils sont recalés pour arriver **avant** la saturation, dans le rythme normal.
- Le rejet coûte des usagers : à patience 1, un rejet provoque un abandon, donc moins de demande future. C'est l'arbitrage entre Conformité et flux.

### Prime de rejet dès le déblocage (D4)
- La note n° 2 (« Rappel : tout dossier incomplet doit être rejeté ») donne une **prime de rejet de +20 %** en plus du curseur.
- La note n° 6 (« Prime de vigilance ») ajoute **+50 %** (+70 % au total).
- Sans cette prime immédiate, rejeter ne rapporterait rien et coûterait des usagers avant la note n° 6. Le joueur n'aurait aucune raison de toucher au curseur.

### Correctifs
- `traiter` ramène chaque niveau de `file` à 0 minimum (plus de résidu négatif).
- `formatEntier` n'affiche jamais de valeur négative.

### Acceptance
1. Dans le simulateur, un bot qui tape 2 fois/s **et** recrute ne reste jamais plus de 30 s d'affilée avec une file < 1, sauf juste avant l'achat d'une extension de périmètre.
2. Tout au long de l'acte, chaque tap traite au moins un dossier, sauf pendant ces fins de phase et les ruptures de formulaires.
3. Le compteur « En attente » n'affiche jamais de valeur négative.

## US2 — Des collègues cohérents (P1)

### Paliers d'ancienneté
- Chaque type de collègue double de vitesse à **10, 25 et 50** exemplaires (×2, ×4, ×8 cumulés). Ce multiplicateur s'ajoute à `agentSpeedMult`.
- Nouvelle fonction pure `multiplicateurAnciennete(possedes)` et nouvelle constante `BALANCE.paliersAnciennete = [10, 25, 50]`.

### Ratios de prix
- À prix de base, chaque rang est **environ 20 % plus rentable par euro** que le rang précédent (en € par dossier/s).
- Le stagiaire reste le moins cher en valeur absolue, et ses paliers le gardent compétitif en début de partie.
- La croissance par achat reste de +15 %, sauf si le simulateur montre qu'il faut la changer.
- L'agent d'accueil est débloqué par la note n° 2 au lieu de la note n° 1 : il faut que le stagiaire ait le temps de servir.
- Les coûts de base, les coûts des notes et la dotation sont recalés au simulateur, puisque la D1 augmente fortement le nombre de dossiers traités, donc le budget.

### Acceptance
1. Dans le simulateur, le bot (qui choisit le collègue le plus rentable **en tenant compte des paliers**) achète encore des stagiaires après la 20ᵉ minute.
2. Le 10ᵉ stagiaire (celui qui atteint le palier) est affiché avec un gain de vitesse qui tient compte du doublement de tous les stagiaires.

## US3 — Lire le flux (P1)

- Nouvelles fonctions pures dans `data/engine.ts` :
  - `fluxEntrant(s, m)` : dossiers arrivant par seconde (nouvelles demandes + retours) ;
  - `plafondDemande(s, m)` : `population × demandeRate × demandeMult`.
- **File d'attente** : sous le titre, une ligne « Arrivées X/s · Traitement Y/s ». Le traitement compte les collègues, plus les taps sur les 5 dernières secondes.
- **Saturation** : quand la capacité des collègues dépasse 80 % du plafond de demande, la ligne passe en couleur d'alerte (`Colors.encreTexte`) et affiche : « Le périmètre s'épuise : il faut de nouveaux usagers. »
- **Recrutement** : en tête de la liste des collègues, le total en dossiers/s. Sur chaque carte :
  - la vitesse par exemplaire, palier compris ;
  - le prochain palier (« Ancienneté : ×2 à 10 »).
  Au-delà de 80 % du plafond, l'avertissement de saturation s'affiche aussi en tête du recrutement.

### Acceptance
1. Les deux valeurs de la ligne de flux se mettent à jour à chaque rendu du contexte (100 ms).
2. L'avertissement apparaît et disparaît selon le seuil de 80 %, sans clignoter : on utilise une hystérésis (apparition à 80 %, disparition sous 70 %).

## US4 — Ordre du jour (P1)

Un bandeau sous le HUD du guichet affiche **une seule consigne à la fois**. Elle est calculée à partir de l'état par une fonction pure `ordreDuJour(s, m)` dans `data/ordreDuJour.ts`, qui renvoie `{ texte, progression? } | null`. Le bandeau disparaît quand la fonction renvoie `null`.

Consignes, dans l'ordre (la première non remplie s'affiche) :

| # | Consigne | Remplie quand |
|---|---|---|
| 1 | « Tamponnez les dossiers en attente. » (progression x / 8) | `tampons ≥ 8` |
| 2 | « Une note de service vous attend. » | note `renfort` achetée |
| 3 | « Recrutez un collègue (onglet Recrutement). » | au moins 1 collègue |
| 4 | « Rachetez des formulaires avant la rupture. » | `stats.formulairesAchetes > 0` |
| 5 | « Poursuivez : de nouvelles instructions suivront. » (progression x / 250) | note `rejet` achetée |
| 6 | « Réglez le taux de rejet. » | `tauxRejet > 0` |
| 7 | « Étendez le périmètre (note de service). » | note `tilleuls` achetée |

- La consigne 4 ne s'affiche qu'une fois la consigne 3 remplie. Si les formulaires passent sous 20 avant, elle passe devant les autres.
- Après la consigne 7, le bandeau disparaît pour de bon. Le joueur est laissé à sa bureaucratie.
- Composant `components/OrdreDuJour.tsx` : panneau fin de la charte, préfixe « ORDRE DU JOUR », tap → onglet concerné quand il y en a un.

### Acceptance
1. Une nouvelle partie affiche la consigne 1 avec sa progression.
2. Aucune consigne ne demande une action impossible : chaque consigne n'apparaît qu'une fois son bouton ou son onglet visible.

## US5 — Circulaires (P2)

Une fenêtre courte (titre + 2-3 lignes, ton administratif, bouton « Pris connaissance ») s'affiche **une seule fois** quand une mécanique apparaît. On réutilise la structure de `FichePoste` (Panneau, BoutonPoussoir).

| Id | Déclencheur | Message (brouillon) |
|---|---|---|
| `collegues` | `recrutementVisible` devient vrai | « Des collègues peuvent être recrutés. Ils tamponnent à votre place, sans enthousiasme mais sans interruption. Plus vous en avez, plus la file baisse. » |
| `rejet` | `rejetVisible` devient vrai | « Vous pouvez désormais rejeter des dossiers. Un dossier rejeté rapporte une prime et revient plus tard, moins patient. Un usager sans patience abandonne. » |
| `perimetre` | la première note d'extension devient visible | « La file ne se remplit pas toute seule. Quand vos collègues vont plus vite que les demandes, étendez le périmètre : de nouveaux usagers, de nouveaux dossiers. » |
| `conformite` | note `audit` effective | « Votre Conformité est désormais mesurée. Elle monte avec les rejets et les pièces exigées. À 100 %, votre dossier sera réexaminé. » |

- Nouveau champ `circulairesVues: string[]` dans `GameState`.
- Définitions dans `data/circulaires.ts` (fonction pure `circulaireAAfficher(s, maintenant)`). Affichage dans `components/Circulaire.tsx`, monté comme `FichePoste`.
- Une circulaire ne s'affiche jamais par-dessus la fiche de poste ou l'écran de fin d'acte.

### Acceptance
1. Chaque circulaire s'affiche une fois par partie, même après un redémarrage.
2. Une partie sauvegardée avant cette version ne réaffiche pas les circulaires des mécaniques déjà débloquées. Au chargement, on les marque comme vues quand leur déclencheur est déjà vrai.

## Sauvegarde
- Nouveau champ `circulairesVues`, rempli au chargement s'il manque (voir US5, acceptance 2).
- La version de schéma reste `1`. Le champ est optionnel à la validation et normalisé au chargement dans `GameStateContext`.
- Le rééquilibrage s'applique aux parties en cours sans migration. Une partie peut être plus ou moins avancée qu'elle ne le serait avec les nouvelles valeurs : c'est acceptable pour un prototype.

## Simulateur (`scripts/simulate-acte1.ts`)
- Le bot choisit le collègue le plus rentable en **tenant compte des paliers**, et il n'exige plus une file ≥ 5 pour recruter.
- Nouvelles mesures affichées : temps cumulé avec une file < 1, plus longue période continue avec une file < 1, et vitesse effective des taps (dossiers réellement traités par tap).
- Cibles : l'acte se termine en **60-75 min** pour le bot à 2 taps/s. Les acceptances US1 et US2 sont respectées.

## Hors périmètre
- Nouveaux types de collègues, nouvelles notes (à part les ajustements de chiffres et la prime de rejet de la note n° 2).
- Tutoriel guidé avec surbrillance d'éléments.
- Refonte visuelle du guichet.

## Accessibilité et localisation
- Textes en français, apostrophes typographiques (’).
- Le bandeau d'ordre du jour et les circulaires ont un `accessibilityLabel` complet. La circulaire se ferme aussi avec le bouton retour Android (`onRequestClose`).
- Couleurs d'alerte : `Colors.encreTexte` / `Colors.rougeTexte` (contraste AA).
