# Feature Specification: Acte II — La Direction

**Feature Branch**: `main` (développement direct, choix du porteur de projet)
**Created**: 2026-10-03
**Status**: Draft
**Input**: Document de design « Bureaucracy++ — Document de design » (6 actes), section Acte II, recalée en séance de conception du 2026-10-03. L'acte s'appelait « Le Service » ; il est renommé **La Direction** pour éviter la confusion avec l'onglet principal.

## Intention

En 2 heures environ, une Réforme comprise, le joueur découvre qu'une administration peut produire des dossiers **sans aucun usager**, et le jeu l'en félicite. Échelle : une ville. Le joueur est chef de service à La Direction.

La découverte n'est jamais annoncée : le joueur construit lui-même la boucle qui rend les usagers inutiles. C'est le pendant du Taux de rejet de l'acte I.

## Glossaire

Aucune ressource nouvelle (pilier du design). Les ressources de l'acte I sont reprises ; deux indicateurs cachés existent, qu'on ne dépense jamais.

| Élément | Rôle à l'acte II | Visible |
|---|---|---|
| Tampons apposés | Score, +1 par étape tamponnée ou traitée. Ne baisse jamais, survit à la Réforme | Toujours |
| Budget (€) | Dotation, versée à chaque étape franchie | Toujours |
| Formulaires | Consommés à chaque étape (× Exemplaires exigés). Achetés avec le budget | Toujours |
| Dossiers | File de la Direction : demandes d'usagers et dossiers en boucle | Toujours |
| Usagers | Population de la ville, avec une patience. Affichés comme tickets | Tickets dans la file seulement |
| Conformité | Note du S.I.C., monte avec les étapes et les rejets | Visible dès le début de l'acte (le joueur la connaît depuis l'acte I) |
| Taux de dématérialisation | Part de l'acte accomplie grâce aux dossiers sans usager. Fin d'acte à 100 % | Caché jusqu'à la note « Plan de dématérialisation » |
| Trombones | Prestige, gagnés à la Réforme | Après la première Réforme |

## Entrée dans l'acte

Quand le joueur achète la note « Demande de réaffectation » de l'acte I, l'acte II commence :

1. Toutes les ressources repartent à zéro, **sauf le compteur Tampons apposés** (et donc le grade, qui en dépend).
2. Lettre du S.I.C. « Prise de fonctions » : « Le budget non consommé de l'exercice précédent a été restitué au Trésor. »
3. Le joueur possède un seul Guichet, nommé **Guichet 3** : son ancien guichet, compressé en unité. Les guichets achetés ensuite sont anonymes (Guichet 4, 5, …).
4. Une procédure imposée par le S.I.C., **Carte d'identité**, est déjà en place avec deux étapes : une Pièce justificative (franchie par les Guichets) et un Visa (qui attend un tampon).

## Boucle de jeu

1. Les usagers inactifs déposent des demandes. Chaque demande vise une **procédure** (répartition fixe entre les procédures ouvertes).
2. Un dossier franchit les étapes de sa procédure dans l'ordre. Chaque étape franchie rapporte la dotation de l'étape, de la Conformité, `+1 tampon`, et consomme `formulaires × Exemplaires exigés`.
3. Les **Guichets** franchissent automatiquement toutes les étapes sauf les Visas. Capacité : `n × vitesse` étapes par seconde.
4. Les étapes **Visa** attendent un tampon. Un tap sur TAMPONNER accorde 1 visa (plus avec les améliorations). Les **agents spécialisés** accordent des visas automatiquement.
5. Chaque étape ajoute un délai. Un usager qui attend perd de la patience ; à 0, il abandonne (comme à l'acte I).
6. Sans formulaires, aucune étape n'est franchie (« Rupture d'imprimés »), tap compris.

### Le Taux de rejet

Repris de l'acte I, disponible dès le début de l'acte (le joueur l'a déjà découvert), plafond 50 % puis 80 % (note « Rejet élargi »). Répartition déterministe, comme à l'acte I.

- Sur un **dossier d'usager** : effet de l'acte I. L'usager perd 1 point de patience et revient plus tard ; le rejet rapporte la prime de rejet et de la Conformité.
- Sur un **dossier en boucle** : aucun coût. Le dossier est redéposé immédiatement en tête de sa procédure, donc retraité et payé une seconde fois. Le rejet devient l'accélérateur de la dématérialisation.

Le joueur n'a pas d'explication explicite : la fiche du curseur dit seulement « Le rejet n'use que la patience des usagers. »

### Exemplaires exigés

Second curseur, débloqué par une note. Valeurs : ×1, ×2, ×3. S'applique à toutes les procédures.

| Exemplaires | Dotation par étape | Conformité par étape | Formulaires par étape | Patience perdue par étape |
|---|---|---|---|---|
| ×1 | ×1 | ×1 | ×1 | ×1 |
| ×2 | ×1,6 | ×1,8 | ×2 | ×1,5 |
| ×3 | ×2,1 | ×2,5 | ×3 | ×2 |

Valeurs indicatives, calées au simulateur.

## L'Atelier des Procédures

### Procédures

Une procédure est une liste ordonnée d'étapes (une à huit). Une étape « Pièce délivrée par nos services » ne peut exiger que l'une des **autres** procédures ouvertes. Le joueur en gère **deux au départ, quatre au maximum** :

| Procédure | Ouverte par |
|---|---|
| Carte d'identité | Début de l'acte (imposée par le S.I.C.) |
| Justificatif de domicile | Note « Atelier des procédures » |
| Attestation d'hébergement | Note « Troisième guichet thématique » |
| Certificat de vie | Note « Quatrième guichet thématique » |

### Étapes

| Étape | Conformité | Dotation | Délai | Patience | Débloquée par |
|---|---|---|---|---|---|
| Visa | ++ | + | ++ | − | Début (attend un tampon) |
| Pièce justificative | + | + | + | − | Note « Atelier des procédures » |
| Signature | + | + | + | − | Note « Signature manuscrite » |
| Pièce délivrée par nos services | + | + | + | − | Note « Pièce délivrée par nos services » |
| Délai de réflexion | + | 0 | +++ | −− | Note « Délai de réflexion » |
| Commission | +++ | ++ | +++ | −− | Note « Commission ad hoc » |

Valeurs dans `constants/balance.ts`, calées au simulateur.

### La boucle

L'étape **Pièce délivrée par nos services** se règle sur une autre procédure : « exige un *Justificatif de domicile* ». Quand un dossier franchit cette étape, il dépose un **dossier lié** dans la procédure exigée, puis poursuit sa propre procédure.

- Si la procédure exigée n'exige rien en retour, c'est une simple dépendance : le dossier lié est un dossier d'usager comme les autres, l'usager suit les deux démarches.
- Si un dossier lié vise une procédure **déjà présente dans sa chaîne** (A exige B, B exige A, ou plus long), la chaîne ne peut jamais se terminer. Le dossier devient un **dossier en boucle** :
  - l'usager est détaché (« Votre demande suit son cours. Vous serez recontacté. »), quitte la file et retourne parmi les inactifs ; il compte dans les « Abandons de démarche » du tableau de bord ;
  - le dossier en boucle circule désormais sans fin entre les procédures de la boucle, chaque étape franchie payant comme d'habitude ;
  - chaque nouvel usager qui entre dans une procédure bouclée ajoute un dossier en boucle.

Les dossiers en boucle consomment la capacité des Guichets, des visas et des formulaires comme les autres. Ils prennent donc la place des vrais usagers, qui attendent plus et abandonnent : la file des tickets raccourcit, les statistiques montent. C'est le twist de l'acte, produit par la mécanique seule.

L'Atelier ne signale jamais la boucle comme une fonctionnalité. Une fois formée, les fiches concernées sont reliées par un trombone fermé sur lui-même.

## Le Taux de dématérialisation

- Reste à **0 exactement** tant qu'aucun dossier en boucle n'existe. Il faut, réunis : deux procédures ouvertes, l'étape « Pièce délivrée par nos services », deux procédures qui s'exigent mutuellement, un usager qui entre dans le circuit.
- Chaque étape franchie par un dossier en boucle ajoute des points. Les dossiers d'usagers, le tap seul et les Guichets ne rapportent rien par eux-mêmes.
- Ne redescend jamais en cours de partie (une boucle cassée arrête la montée, sans perte).
- Monte lentement : la cible (`demaCible` points) est calée pour que la fin de l'acte demande une Réforme au rythme cible.
- Caché jusqu'à la note « Plan de dématérialisation », qui l'affiche dans l'en-tête comme la Conformité à l'acte I.
- À 100 %, la note finale « Promotion » apparaît.

## Recrutement

| Unité | Rôle | Coût |
|---|---|---|
| Guichet | Franchit les étapes hors Visa | Exponentiel (×1,15) |
| Instructeur | Accorde des visas | Exponentiel |
| Chef de bureau | Accorde des visas, plus vite | Exponentiel, débloqué par note |
| Sous-directeur | Accorde des visas, beaucoup plus vite | Exponentiel, débloqué par note |

L'ancienneté de l'acte I s'applique aux agents : vitesse doublée à 10, 25 et 50 exemplaires. Achat de formulaires par ramette, comme à l'acte I.

## La Réforme (premier prestige)

- **Déblocage** : note « Réforme de l'action publique », visible après la création du premier dossier en boucle (vers 40 – 55 min).
- **Déclenchement** : libre, depuis l'onglet Options, quand le joueur veut. Confirmation par un formulaire.
- **Gain** : `trombones = floor(√(Conformité cumulée / k))`, Conformité cumulée depuis le tout début de la partie (acte I compris), moins celle déjà convertie lors des Réformes précédentes.
- **Effet** : retour au **début de l'acte I**. Tout repart à zéro : ressources, collègues, guichets, agents, notes, procédures, Conformité, Taux de dématérialisation. Survivent uniquement : les trombones, la Jurisprudence achetée, le compteur Tampons apposés (et le grade), le prénom et le premier Cerfa.
- **Cerfa** : le Cerfa d'embauche est redemandé sous un nouveau numéro (« Cerfa n° 00001*02 », puis *03…). Le premier Cerfa tamponné reste stocké : c'est l'original exigé à l'acte VI.
- **Satire** : à chaque Réforme, la Direction et les procédures changent de nom au hasard (Pôle, Agence, Direction, Mission, Délégation… ; « Carte d'identité » devient « Démarche d'identification citoyenne »…). Rien d'autre ne change.
- **Le mur** : en fin d'acte, la montée de la dématérialisation ralentit. Deux mécaniques invisibles le portent (plan 3) : la **sclérose des services** (chaque étape franchie en boucle rapporte `1 / (1 + durée des services / scleroseS)` point ; la durée court depuis l'entrée dans l'acte et la Réforme la remet à zéro) et la **jurisprudence constante** (+10 % de rendement par trombone obtenu, dépensé ou non). La Conformité de l'acte II compte ×120 : elle ne sert qu'aux trombones. Continuer sans Réforme reste possible mais long ; réformer et revenir avec la Jurisprudence est plus rapide. Le simulateur vérifie que la Réforme est rentable jusqu'à 70 % de dématérialisation au moins (`node scripts/simulate-acte2.ts 2 300 balayage`).

### Jurisprudence

Bonus permanents achetés avec les trombones, depuis l'onglet Options (« Dossier administratif »).

| Bonus | Effet | Coût |
|---|---|---|
| Droit acquis | +1 étape sans perte de patience, par procédure | À caler |
| Précédent | Démarre l'acte I avec 3 collègues stagiaires | À caler |
| Vide juridique | Achat de formulaires −25 % | À caler |
| Antériorité | Démarre l'acte II avec 10 Guichets | À caler |
| Mémoire des services | Les procédures sont restaurées telles qu'avant la Réforme, sous leur nouveau nom, dès l'ouverture de l'Atelier | À caler |
| Ancienneté reconnue | Dotation +20 % sur tout l'arc | À caler |

Les coûts sont calés au simulateur : un joueur doit pouvoir acheter 2 bonus à sa première Réforme.

### Déjà-vu administratif

Au replay, sans rien acheter : une note de service déjà achetée lors d'une partie précédente a un délai d'instruction divisé par 4 et un coût divisé par 6 (« Dossier déjà instruit, procédure simplifiée »). La fiche de poste de l'acte I n'est pas reproposée.

Cible : l'acte I rejoué en 20 à 30 minutes sans Jurisprudence.

## Parcours joueur

### US1 — Prise de fonctions (P1)
L'acte commence par la lettre « Prise de fonctions » et l'écran Direction : scène du service à l'encre bleue, panneau « Appel n° 047 », Guichet 3 en place, procédure Carte d'identité affichée dans le panneau.

**Acceptance**
1. Seul le compteur Tampons apposés conserve sa valeur de l'acte I ; budget, formulaires et collègues sont à zéro ou à leur valeur initiale d'acte II.
2. La file affiche des tickets, jamais de visages ni de prénoms.
3. Le joueur peut tamponner dès la première seconde : chaque tap accorde un visa en attente.

### US2 — L'écran Direction (P1)
Même structure verticale qu'à l'acte I : compteurs, scène, panneau, bouton TAMPONNER, navigation. Le panneau montre la procédure de la demande en cours sous forme de fiches reliées par des trombones ; les Visas en attente s'allument.

**Acceptance**
1. Le nombre de visas en attente est visible ; un tap le décrémente avec le même retour qu'à l'acte I (bouton, haptique, « +1 »).
2. Sans visa en attente, le bouton affiche « Aucun visa ». Sans formulaires, « Rupture d'imprimés ».
3. L'écran ne défile pas (règle de l'acte I).

### US3 — L'Atelier (P1)
Onglet débloqué par la note « Atelier des procédures ». Une procédure par écran (sélecteur en haut), étapes en liste verticale de fiches. Ajouter une étape (catalogue des étapes débloquées), la retirer, la déplacer.

**Acceptance**
1. Chaque fiche affiche ses effets (Conformité, dotation, délai, patience) avec un symbole et un mot, jamais par la couleur seule.
2. L'étape « Pièce délivrée par nos services » propose la liste des autres procédures ouvertes.
3. Une boucle formée relie les fiches concernées par un trombone fermé. Aucun texte ne la nomme « boucle ».
4. Une modification s'applique immédiatement. Les dossiers déjà engagés restent à leur rang dans la liste ; si leur étape est retirée, ils passent à celle qui prend sa place (ou à la dernière).
5. Toutes les cibles tactiles font au moins 44×44 pt ; le déplacement d'une fiche se fait aussi par boutons monter/descendre (pas seulement au glisser).

### US4 — Les curseurs (P1)
Taux de rejet dès le début, Exemplaires exigés après sa note. Les deux sont dans le panneau de l'écran Direction, comme le Taux de rejet à l'acte I.

**Acceptance**
1. Un dossier en boucle rejeté est retraité sans qu'aucun usager ne perde de patience.
2. À ×3 exemplaires, chaque étape consomme 3 fois plus de formulaires.

### US5 — Onglet Service (recrutement) (P1)
Guichets et agents spécialisés, formulaires par ramette. Achats en lot comme à l'acte I.

### US6 — Notes de service (P1)
Catalogue ci-dessous. Même onglet et mêmes délais d'instruction qu'à l'acte I (sur main, le tap ne relance plus les notes).

### US7 — Le filet de sécurité (P1)
Si aucun dossier en boucle n'existe 15 minutes après l'entrée en vigueur de la note « Pièce délivrée par nos services », lettre du S.I.C. « Constat de non-sollicitation » : « Nos services constatent que vos procédures ne se sollicitent pas mutuellement. Cette situation est regrettable. » Une seconde lettre, 15 minutes plus tard, cite deux procédures du joueur par leur nom.

### US8 — La Réforme (P1)
Voir la section dédiée.

**Acceptance**
1. Après une Réforme, le jeu reprend au Cerfa (nouveau numéro), puis au guichet de l'acte I.
2. Le compteur Tampons apposés et les trombones sont conservés ; tout le reste est à zéro.
3. Le premier Cerfa est conservé dans la sauvegarde, inchangé.
4. Les noms de la Direction et des procédures changent à chaque Réforme.

### US9 — Fin de l'acte II (P1)
À 100 % de dématérialisation : lettre du S.I.C. « Rapport annuel de performance », avec le tableau « Taux de satisfaction : 100 % (sur les usagers restants) » et le nombre d'abandons de démarche. La note « Promotion » s'ouvre ; son achat affiche l'écran de fin d'acte (« La Direction devient une unité du ministère. Vous êtes nommé ministre. — Fin de l'acte II »). Le joueur peut continuer à jouer ensuite.

### US10 — Démission (P2)
Réponse du S.I.C. à la démission pendant l'acte II : « Votre demande est incomplète. Pièce manquante : [nom de la première procédure modifiée par le joueur dans l'Atelier]. »

### US11 — Progression hors-ligne (P2)
Comme à l'acte I : simulation plafonnée à `horsLigneMax`, Guichets et agents seuls, résultat au courrier. Les dossiers en boucle continuent hors-ligne.

## Catalogue des notes de service (acte II)

Textes définitifs à écrire à l'implémentation ; chaque note garde le format de l'acte I (blague, mécanique, indice).

| N° | Titre | Effet | Visible quand |
|---|---|---|---|
| 1 | Prise de fonctions | Ouvre le recrutement des Guichets | Début |
| 2 | Agents d'instruction | Ouvre l'Instructeur | 5 Guichets |
| 3 | Atelier des procédures | Ouvre l'onglet Atelier, la procédure Justificatif de domicile et l'étape Pièce justificative | 10 – 20 min |
| 4 | Signature manuscrite | Étape Signature | Après n° 3 |
| 5 | Exemplaires exigés | Curseur Exemplaires exigés | Après n° 3 |
| 6 | Chef de bureau | Ouvre le Chef de bureau | 10 Instructeurs |
| 7 | Pièce délivrée par nos services | Étape Pièce délivrée par nos services. Texte-indice : « Un justificatif délivré par nos services fait foi pour toute démarche, y compris celle qui l'a délivré. » | 25 – 35 min |
| 8 | Délai de réflexion | Étape Délai de réflexion | Après n° 7 |
| 9 | Troisième guichet thématique | Procédure Attestation d'hébergement | Après n° 7 |
| 10 | Réforme de l'action publique | Débloque la Réforme | Premier dossier en boucle |
| 11 | Plan de dématérialisation | Révèle le Taux de dématérialisation | Premier dossier en boucle + délai |
| 12 | Rejet élargi | Taux de rejet max 80 % | Après n° 11 |
| 13 | Commission ad hoc | Étape Commission | Après n° 11 |
| 14 | Sous-directeur | Ouvre le Sous-directeur | 10 Chefs de bureau |
| 15 | Quatrième guichet thématique | Procédure Certificat de vie | Après n° 13 |
| 16 | Tableau de bord | Affiche les Abandons de démarche et le taux de satisfaction | 25 % de dématérialisation |
| 17 | Promotion | Termine l'acte II | 100 % de dématérialisation |

## Courrier du S.I.C. (acte II)

| Lettre | Déclencheur |
|---|---|
| Prise de fonctions | Début de l'acte |
| Félicitations pour l'optimisation de vos circuits | Premier dossier en boucle |
| Constat de non-sollicitation (×2) | Filet de sécurité (US7) |
| Réforme : nouvelle dénomination de vos services | Après chaque Réforme |
| Réponse à votre démission | Première modification dans l'Atelier, si une démission est déposée |
| Rapport annuel de performance | 100 % de dématérialisation |

## Rythme cible

Fourchettes humaines, depuis le début de l'acte II, premier passage, une Réforme comprise. À vérifier par `scripts/simulate-acte2.ts` (robot), puis par une partie réelle : le temps de compréhension de l'Atelier n'est pas mesurable par le robot.

| Jalon | Cible humaine |
|---|---|
| Premier Instructeur | 3 – 6 min |
| Atelier débloqué | 10 – 20 min |
| Étape « Pièce délivrée par nos services » | 25 – 35 min |
| Premier dossier en boucle | 35 – 50 min |
| Filet de sécurité (si pas de boucle) | 15 min après la note n° 7 |
| Réforme débloquée | 40 – 55 min |
| Première Réforme, replay de l'acte I compris | 60 – 90 min |
| Fin de l'acte (100 %) | 105 – 135 min |

### Mesures du robot (`scripts/simulate-acte2.ts`)

Sans Réforme, en minutes depuis l'entrée dans l'acte II :

| Jalon | Robot 1 tap/s | Robot 2 taps/s | Robot 3 taps/s |
|---|---|---|---|
| Premier agent | 3.0 | 2.8 | 3.0 |
| Atelier | 9.8 | 9.4 | 9.3 |
| Première boucle | 27.8 | 27.2 | 26.6 |
| Dématérialisation 50 % | 98.5 | 97.3 | 96.1 |
| Dématérialisation 100 % | 193.5 | 191.5 | 189.7 |

Avec une Réforme (2 taps/s, `balayage`) : rentable de 0 à 70 % de dématérialisation (fin de l'acte entre 124.7 et 182.2 min contre 191.5), pas à 80 % (199.5) ; l'acte I est rejoué en 18 à 22 min ; la plus petite Réforme rapporte 6 trombones.

Le robot construit la boucle dès que l'étape est disponible. Avec 15 min de compréhension de la note n° 7 et une Réforme dès son déblocage (`node scripts/simulate-acte2.ts 2 300 0 15`) : Réforme débloquée à 42.2 min, acte I rejoué à 63.9 min, fin de l'acte à 132.7 min.

Cible du robot pour 100 % sans Réforme : 150 – 200 min (mesuré : 189.7 à 193.5). L'ancienne cible du robot pour 50 % (60 – 85 min, plan 1) est remplacée par le mur approuvé au plan 3 (97.3 min à 2 taps/s). « Deux bonus à la première Réforme » se vérifie en trombones : la plus petite Réforme en rapporte 6 au moins, soit 3 + 3 (les deux bonus les moins chers), quoi que le robot choisisse d'acheter.

## Interface

- Encre bleue `#5D9CEC` / bord bas `#4A89DC` pour le bouton TAMPONNER. Fond crème inchangé.
- Navigation : Direction · Service · Notes · Atelier · Options (l'onglet « Service » de main reste le recrutement ; l'onglet principal « Guichet » devient « Direction »). Service, Notes et Atelier apparaissent à leur déblocage (mécanisme `href: null` déjà en place).
- Ressources (colonnes de l'en-tête de main) : Budget, Formulaires, Visas (remplace « En attente ») ; « Démat. » s'ajoute en 4ᵉ colonne après la note « Plan de dématérialisation ».
- La bulle au-dessus de la scène présente le parapheur à viser (« Parapheur n° 048 · Carte d'identité ») au lieu de l'usager.
- Scène : `components/scene/pixel/direction.ts` (`MoteurDirection`), le bureau vitré du chef au-dessus de la salle du service. Maquettes : `DESIGN/maquettes-acte2.html`.
- Les étapes sont des fiches reliées par des trombones, dans le panneau comme dans l'Atelier.

## Technique

- Logique dans des fonctions pures de `data/` (moteur de l'acte II à côté de `data/engine.ts`), testées par `npm test` sans React.
- Constantes dans `constants/balanceActe2.ts` (`BALANCE2`, `REFORME`, `JURISPRUDENCE`), vérifiées par `scripts/simulate-acte2.ts`.
- Sauvegarde : champ `acte` (1 ou 2), état de l'acte II, `reformes` (nombre, trombones, Jurisprudence, Conformité déjà convertie), premier Cerfa. Une sauvegarde de l'acte I terminée passe à l'acte II sans perte du compteur.
- Les dossiers en boucle sont stockés en compteurs par procédure et par étape, jamais un par un.

## Hors périmètre

Actes III à VI, notifications push, Bannette, fin secrète « Guichet unique ».

## Accessibilité et localisation

- Cibles tactiles ≥ 44×44 pt, libellés d'accessibilité sur tous les boutons, fiches et curseurs.
- Aucune information portée par la seule couleur (effets des fiches = symbole + mot ; boucle = trombone fermé + libellé d'accessibilité « Ces procédures s'exigent mutuellement »).
- Nombres au format français (`1 234`, `1,5 k`).
