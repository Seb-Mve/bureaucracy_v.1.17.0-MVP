# Acte II — Ce que le service délivre

Remplace la version précédente de cette spec (mise en scène dans la scène pixel), écartée par le porteur de projet le 2026-10-04 : la scène est un décor ; la découverte se joue dans l'interface.

**Référence visuelle (fait foi) :** `specs/011-acte2-decouverte/storyboard.html` — publiée sur https://claude.ai/artifact/5dGgH1bT6AqPteJx59fm8R. Base de code : branche `feat/acte2-lisibilite`.

## Le problème

Le joueur ne sait jamais ce qu'il manipule : « Parapheur n° 048 · Carte d’identité », c'est quoi ? D'où ça vient, à quoi ça sert, que produit le service ? Tant que ce socle manque, aucune découverte n'est possible.

## Le principe

Montrer **ce que le service délivre** : un usager demande un document, sa demande suit les étapes d'une procédure, le chef vise, le document est délivré. Sur ce socle, deux intrigues (choisies par le porteur de projet) : **des éléments sans mode d’emploi** et **un chiffre qui devient absurde**. La boucle naît de l'appât du gain (compliquer rapporte), pas d'une illumination ; le joueur comprend après coup ce qu'il a construit. Universal Paperclips n'est qu'une inspiration de principes.

## Les sept moments (voir la planche)

0. **Une demande.** « Mme Lefèvre demande une Carte d’identité ». Pièce faite, Visa « ← ici ». On vise : la carte est délivrée, le relevé passe à 1 délivrée.
1. **Le service tourne.** « Carte d’identité · 24 demandes · 312 délivrées · +4 € la carte · 0 abandon · → usagers ».
2. **Compliquer rapporte.** L'Atelier permet d'ajouter des étapes ; la carte rapporte davantage (+4 € → +9 €) et des usagers abandonnent (0 → 12).
3. **Un guichet que personne ne demande.** « Justificatif de domicile · 0 demande · 0 délivré », pendant que la Carte d’identité déborde.
4. **Une pièce de nos services.** Une étape de plus qui rapporte, « exige : Justificatif de domicile » : le guichet vide se remplit, le service se délivre ses propres justificatifs.
5. **Délivrées à qui ?** Le Justificatif, compliqué à son tour, exige une Carte d’identité : « 9 800 Cartes d’identité délivrées · 3 usagers », +11 € la carte, 0 abandon. Les parapheurs n'ont plus de nom (« Demande n° 9 907 »), le chef vise toujours.
6. **Plan de dématérialisation.** Plus aucun usager ; la note révèle le taux de dématérialisation, déjà avancé.

## Ce qui change dans le jeu

### Interface

1. **Relevé « Production du service »** sur l'écran Direction (sous la bulle) et dans l'Atelier (en tête de procédure, à la place de « dossiers en cours · abandon ») : une ligne par procédure ouverte — `N demandes · M délivrées`, puis `+X € la carte` (valeur d'un document délivré, accord du nom du document) et `K abandons`.
   - Destination « → usagers » **seulement** pour les documents remis à des usagers. Les documents délivrés pour les dossiers du service n'ont **aucune** destination affichée (le vide doit intriguer).
   - Les chiffres portent l'information (mots + chiffres), jamais la couleur seule.
2. **Bulle de la Direction** : une demande d'usager s'affiche comme la demande d'une personne (« Mme Lefèvre demande une Carte d’identité », noms tirés d'une liste) ; la chaîne d'étapes se termine par une fiche « Délivrée ». Une demande sans usager s'affiche anonyme : « Demande n° 9 907 · Carte d’identité ». Pas d'autre mention.
3. **En-tête (HUD)** : Budget · Formulaires · **Usagers** (nombre d'usagers ayant une démarche en cours) ; Démat. s'ajoute à la note « Plan de dématérialisation » (inchangé). La colonne Visas disparaît (le nombre de visas en attente reste visible sur la fiche Visa de la bulle).
4. **Tableau de circulation, débits, étapes « en attente de réglementation », service des achats** (spec 010) : conservés. La fiche de poste du chef de service est réduite à trois lignes d'orientation (les dossiers circulent d'étape en étape ; vous visez les parapheurs ; chaque étape consomme des formulaires) plus les lignes Agents et Service des achats ; les lignes qui expliquent un arbitrage (Atelier, Exemplaires, pièce délivrée par nos services, « évaluation sur le volume ») sont supprimées.

### Mécanique

5. **Seule la Carte d’identité est demandée par les usagers.** Les autres procédures (Justificatif de domicile, Attestation d’hébergement, Certificat de vie) ne reçoivent aucune demande spontanée : elles ne se remplissent que lorsqu'une autre procédure exige leur document. (Personne ne demande un justificatif de domicile pour le plaisir.)
6. **Compteurs de production** dans l'état de l'acte II : documents délivrés par procédure, en distinguant ceux remis à des usagers et ceux délivrés pour les dossiers du service. Migration des sauvegardes existantes (compteurs à zéro).
7. **Valeur d'un document** = dotation totale d'un dossier qui parcourt toute la procédure (somme des étapes × Exemplaires × modificateurs), calculée par la couche `data/`.
8. **Le Visa reste alimenté après la boucle.** Un dossier qui franchit une étape « Pièce délivrée par nos services » dépose la demande liée dans la procédure exigée **et** poursuit sa propre procédure jusqu'au bout (où son document est délivré). La règle « un usager ajoute un seul dossier en boucle » (spec 009) et la conservation du stock de dossiers en boucle (test existant) sont maintenues ; le moteur est adapté en conséquence, avec tests.
9. **Les usagers disparaissent vraiment.** Une fois la boucle formée, le nombre d'usagers ayant une démarche en cours doit chuter et tendre vers zéro (moment 5) : les dossiers du service occupent les guichets, les usagers attendent, s'impatientent et abandonnent ; la ville se dépeuple. À vérifier au simulateur et à obtenir par calage (patience, demande, part de capacité) si ce n'est pas le cas, en gardant les jalons de la spec 009.

### Vérification

10. **Simulateur** (`scripts/simulate-acte2.ts`) : nouvelles mesures — usagers en cours et documents délivrés (aux usagers / au service) aux jalons ; critère : 10 minutes après la première boucle, usagers en cours < 25 % de leur maximum, et documents délivrés au service > documents délivrés aux usagers. Avant la boucle, compliquer une procédure augmente la valeur par document et le nombre d'abandons (mesure prudent / agressif).
11. **Raccourcis de test** (`?test`) : « Acte II — compliquer rapporte » (Atelier ouvert, Carte d’identité seule demandée), « Acte II — pièce de nos services » (il ne reste qu'à exiger un justificatif), « Acte II — boucle sur le point de se former » (le justificatif peut exiger une carte). Les préréglages existants restent valides.
12. Tests `npm test` pour la logique ; navigateur à 375 × 812 et 375 × 667 via `?test`, aucune erreur console.

## Contraintes permanentes

Rien n'explique au joueur (pas de ligne sous un contrôle, pas de « ? », pas de définition de compteur, pas de bandeau sur la scène pixel) ; aucun texte ne nomme la boucle ni la dématérialisation avant la note ; textes en français, apostrophes typographiques, nombres au format français ; accessibilité (cibles ≥ 44 pt, libellés, aucune information portée par la seule couleur) ; couches strictes (`components/` n'importe jamais `data/`).

## Mesure

Pas de promesse de déclic : après livraison d'une tranche jouable (moments 2 à 5 via les raccourcis), le porteur de projet joue et dit si le déclic vient ; on ajuste.
