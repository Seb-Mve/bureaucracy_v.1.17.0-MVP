# Acte II — Lisibilité

Retours du porteur de projet après une première partie de l'Acte II (2026-10-04) : l'ambiance et le changement de cap fonctionnent, mais on ne comprend ni ce qu'il faut faire, ni l'objectif, ni à quoi servent la chaîne d'étapes, l'Atelier, les procédures et les Exemplaires ; les formulaires se vident à une vitesse folle.

Base : branche `feat/raccourcis-test` (Acte II plans 1 à 3 + raccourcis de test). Spec de l'acte : `specs/009-acte2-direction/spec.md`.

## Décisions du porteur de projet

1. **La découverte reste totale.** Le Taux de dématérialisation reste caché jusqu'à la note n° 11 ; rien ne dit au joueur de se passer d'usager. On donne un **objectif apparent**, comme à l'Acte I.
2. **Contexte : fiche de poste de chef de service**, même format que la fiche de poste de l'Acte I.
3. **La chaîne d'étapes devient un tableau de circulation.**
4. **Les procédures restent identiques** (la satire), mais leur effet devient lisible.
5. **Les formulaires deviennent une vraie contrainte**, puis un approvisionnement automatique se débloque.

Contraintes permanentes inchangées : pas d'annulation d'achat, pas de ligne d'explication sous un contrôle, pas de bouton « ? », pas de définition de compteur, pas de bandeau sur la scène pixel, pas de raccourci clavier autre qu'Espace. Textes en français, apostrophes typographiques, ton administratif (« dire sans dire »). Accessibilité : cibles ≥ 44 pt, libellés d'accessibilité, aucune information portée par la seule couleur.

## 1. Fiche de poste de chef de service

- S'ouvre à l'entrée dans l'Acte II (après « PRENDRE MES FONCTIONS »), au format de `components/FichePoste.tsx` (lignes icône + titre + phrase, bouton « PRENDRE MON POSTE » / « FERMER »). Relisible depuis Options (« Relire ma fiche de poste ») à l'Acte II.
- Les lignes s'ajoutent au fil des déblocages ; quand une ligne s'ajoute, une pastille apparaît sur l'onglet Options jusqu'à relecture.
- Lignes (texte définitif à caler dans le ton, sans jamais nommer la boucle ni la dématérialisation) :
  - Toujours : « Les dossiers circulent d’étape en étape. » — « Les guichets traitent les pièces ; vous visez les parapheurs. » — « Chaque étape franchie rapporte une dotation et consomme des formulaires. » — « Votre évaluation portera sur le volume traité. »
  - Note Agents : les agents visent à votre place.
  - Note Atelier : « Vous complétez les procédures. Chaque étape ajoutée rapporte, mais use la patience des usagers. »
  - Note Exemplaires : « Chaque exemplaire exigé multiplie la dotation… et les formulaires. »
  - Note Pièce délivrée par nos services : « Une procédure peut exiger une pièce délivrée par une autre. »
  - Note Marché public de fournitures : « Les fournitures sont commandées par le service des achats. »

## 2. Tableau de circulation (bulle de l'écran Direction)

- Chaque fiche d'étape de la procédure affichée porte le **nombre de dossiers qui y attendent** et **qui la traite** (pictogramme guichet pour les étapes des guichets ; tampon pour le Visa, traité par le joueur et les agents).
- La fiche la plus encombrée est marquée (bord épais + chiffre), sans dépendre de la couleur.
- Le comportement actuel est conservé : parapheur à viser, « Dossier sans usager », masquage en écran compact selon la règle existante.

## 3. Débits dans l'en-tête

- Sous Budget et Formulaires (Acte II), un débit signé par seconde (« +15 €/s », « −13 /s »), lissé sur quelques secondes, au format français.
- Rend visible la consommation des formulaires et l'effet des Exemplaires.

## 4. Atelier lisible

- En tête de chaque procédure : dossiers en cours, abandons de la procédure, et bilan par dossier sur la procédure entière (« +4 € · −4 patience · 13 s », symboles + mots).
- Les effets par étape (symbole + mot) restent.
- La feuille « Ajouter une étape » montre aussi les types d'étape pas encore débloqués, non sélectionnables, marqués « En attente de réglementation » — sans indiquer la note qui les débloque.

## 5. Formulaires : contrainte, puis service des achats

- À l'Acte II, le coût des fournitures pèse environ **30 à 40 % des recettes en ×1** (prix de la ramette d'Acte II relevé ; l'Acte I inchangé). Les Exemplaires deviennent un vrai arbitrage : plus de dotation et de Conformité contre beaucoup plus de formulaires.
- Une note **« Marché public de fournitures »**, vers le milieu de l'acte (avant la boucle), débloque le **Service des achats** : il commande automatiquement des ramettes sur le budget quand le stock passe sous un seuil. Interrupteur dans l'onglet Service (activé par défaut à l'achat de la note).
- Aucune ressource nouvelle. Hors-ligne : le service des achats fonctionne aussi.
- Le rythme de l'acte est recalé au simulateur (`scripts/simulate-acte2.ts`, robot qui achète les fournitures) ; cibles de `specs/009-acte2-direction/spec.md` inchangées.

## 6. Raccourcis de test

- Les préréglages existants restent valides ; ajout d'un préréglage « Acte II — service des achats » (note Marché public en vigueur). La fiche de poste de chef de service est réputée lue dans les préréglages, sauf « prise de fonctions ».

## Vérification

- Tests `npm test` pour la logique (débits, bilan par procédure, service des achats, prix, lignes de fiche débloquées).
- Navigateur à 375 × 812 et 375 × 667 via `?test`, aucune erreur console.
- Simulateur : jalons de la spec 009 tenus.
