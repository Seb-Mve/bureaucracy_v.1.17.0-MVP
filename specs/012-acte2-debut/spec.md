# Acte II — Le début : du premier visa au premier guichet

Retours du porteur de projet (2026-10-05) sur la prévisualisation de l'Acte II :
- le compteur monte tout seul dès l'arrivée, alors qu'on ne fait rien (un guichet automatique est offert d'emblée) ;
- l'objectif n'est pas clair : il faut dire, comme à l'Acte I, ce que fait le joueur ;
- le guichet doit arriver plus tard, pour que le joueur se demande pourquoi plus rien n'arrive sur son bureau, puis comprenne en voyant la note (« AAAAH, c'est ça ! ») ;
- visas, pièces, formulaires : trop de notions ; les visas ne sont visibles nulle part alors qu'on tamponne des formulaires.

**Référence visuelle (fait foi) :** `specs/012-acte2-debut/storyboard.html` — publiée sur https://claude.ai/artifact/T1LaPFfbNtSYu16iWmymAP. Base : branche `feat/acte2-direction-scene` (specs 009 à 011 livrées).

## Le modèle, une fois pour toutes

Un usager **demande** une Carte d’identité. La demande est **une liasse de formulaires, un par étape** de la procédure. Les guichets traitent les étapes de vérification ; **le joueur tamponne le dernier formulaire : le visa**. La carte est alors **délivrée**. Chaque étape franchie consomme un formulaire et rapporte une dotation. Compliquer une procédure, c'est exiger plus de formulaires par carte.

## Ce qui change

### 1. Démarrage sans guichet
- L'Acte II démarre **sans aucun guichet** (`guichetsInitiaux` à 0 ; la Jurisprudence Antériorité garde son effet) et avec **20 demandes déjà au Visa** (assez pour payer le premier guichet : 20 visas × 1,60 € ≥ 30 €).
- Tant qu'il n'y a pas de guichet, les nouvelles demandes s'entassent à la première étape ; le compteur Tampons apposés, le budget et les formulaires ne bougent **que** quand le joueur tamponne.

### 2. La note n° 1 arrive au bon moment
- Renommée **« Réouverture du guichet 3 »**. Texte : « Les pièces justificatives seront désormais vérifiées au guichet. Le guichet 3 rouvre, sous votre autorité. » Effet : « Débloque le recrutement des guichets. » Gratuite, sans délai (inchangé).
- **Visible seulement** quand il ne reste plus aucune demande à viser **et** qu'au moins une demande attend à la première étape. Une fois visible, elle le reste.

### 3. À viser dans l'en-tête
- En-tête de l'Acte II : **Budget · Formulaires · À viser** (nombre de demandes qui attendent le visa). Démat. s'ajoute à sa note, comme avant. La colonne Usagers quitte l'en-tête.
- Le nombre d'habitants passe dans le relevé : « Production du service · 70 usagers en ville » (population de la ville).
- Un tap fait baisser À viser de 1, Formulaires de 1, et délivre une carte.
- Quand À viser vaut 0, le bouton TAMPONNER s'affiche éteint (grisé), sans texte supplémentaire.

### 4. Vocabulaire
- À l'écran de l'Acte II, **un seul mot : « demande »** — plus de « dossier » ni de « parapheur » (bulle, fiche, règlement, notes, lettres, accessibilité).
- Étapes renommées : « Pièce justificative » → **« Vérification des pièces »** ; « Pièce délivrée par nos services » → **« Justificatif exigé »** (le mot « pièce » ne désigne plus que la vérification). Les autres étapes gardent leur nom.

### 5. Fiche de poste du chef de service
Trois lignes, format de l'Acte I :
1. **Les usagers demandent des Cartes d’identité.** Chaque demande est une liasse de formulaires, un par étape.
2. **Vous tamponnez le dernier : le visa.** La carte est délivrée à l’usager.
3. **Chaque carte délivrée rapporte une dotation.** Plus elle exige de formulaires, plus elle rapporte.

Puis les lignes déjà prévues au déblocage (agents, service des achats), sans les nommer « dossiers ».

### 6. Bulle et relevé
- Bulle : le détail suit la demande — « Attend la vérification des pièces » (pas de pictogramme de guichet tant qu'il n'y en a aucun), « Attend votre visa », « Repart avec sa Carte d’identité » juste après la délivrance.
- Relevé : la ligne d'une procédure demandée par les usagers ajoute **« N formulaires la carte »** (étapes × Exemplaires), à côté de « +X € la carte » et des abandons.

### 7. Rythme et tests
- Simulateur : le robot approuve la note puis achète son premier guichet ; jalons de la spec 009 et critère §10 de la spec 011 tenus (recaler `demaCible` si besoin, rien d'autre sans le dire).
- Raccourci de test **« Acte II — visas épuisés »** (À viser 0, demandes bloquées à la vérification, note visible) ; le raccourci « prise de fonctions » démarre désormais sans guichet.
- Tests `npm test` ; navigateur à 375 × 812 et 375 × 667 ; aucune erreur console.

## Contraintes permanentes
Rien n'explique au joueur au-delà de la fiche de poste (pas de ligne sous un contrôle, pas de « ? », pas de bandeau sur la scène) ; rien ne nomme la boucle ni la dématérialisation avant la note ; français, apostrophes typographiques, espace insécable avant « € » ; accessibilité (44 pt, libellés, jamais la couleur seule) ; `components/` n'importe jamais `data/`.
