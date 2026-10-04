# Acte II — Effet de découverte

Retour du porteur de projet (2026-10-04), après la passe de lisibilité (`specs/010-acte2-lisibilite`) : il faut que le joueur comprenne ce qu'il doit faire sans qu'on le lui dise. Comme dans Universal Paperclips : des éléments apparaissent, on se demande à quoi ils servent, puis vient le « AAAAH, c'est pour ça ! ». Dans l'Acte II, ce moment n'arrive jamais. Il ne s'agit pas de faire monter un chiffre : il s'agit de reproduire un effet de découverte de mécanique.

Base : branche `feat/acte2-lisibilite`. Spec de l'acte : `specs/009-acte2-direction/spec.md`.

## Principe

**Tout ce qui pénalise les usagers devient gratuit, puis rentable, quand il n'y a plus d'usagers.**

Fil de découverte :

1. **Avant la boucle — des leviers qui ressemblent à de mauvaises idées.** Le rejet, les Exemplaires et les étapes ajoutées dans l'Atelier rapportent un peu tout de suite mais font partir des usagers ; la ville se dépeuple et le service s'appauvrit. Le joueur revient à des réglages prudents et se demande pourquoi on lui donne des outils qui font fuir les gens.
2. **Premier déclic — la boucle.** La deuxième procédure, l'étape « Pièce délivrée par nos services » et les parapheurs « sans usager » s'emboîtent : « mes procédures se nourrissent entre elles, je n'ai plus besoin des usagers ».
3. **Second déclic — l'inversion.** Sur les dossiers sans usager, plus de patience, plus d'abandon : rejet, Exemplaires et procédures longues ne coûtent plus rien et rapportent à chaque tour. « Le rejet à 80 %, les commissions, les exemplaires… tout ça servait à ça. »
4. **Troisième déclic — la note « Plan de dématérialisation ».** Le taux de dématérialisation apparaît, déjà avancé : « c'était l'objectif depuis le début ». (Inchangé : le taux reste caché jusqu'à cette note.)

Contraintes permanentes inchangées : rien n'explique au joueur (pas de ligne sous un contrôle, pas de « ? », pas de définition de compteur, pas de bandeau sur la scène pixel) ; textes en français, apostrophes typographiques, ton administratif ; aucun texte ne nomme la boucle ni la dématérialisation avant la note ; accessibilité (cibles ≥ 44 pt, libellés, aucune information portée par la seule couleur) ; scène = moteur pixel (`components/scene/pixel/direction.ts`).

## Partie 1 — La perte d'usagers se voit

1. **Départs dans la scène.** Quand un usager abandonne (patience épuisée), une silhouette de la salle d'attente se lève et sort par la porte (petite bouffée de soupir en pixels). Quand un dossier d'usager est rejeté, l'usager sort avec une feuille marquée d'un tampon rouge. Animations plafonnées à quelques départs par seconde (impression, pas comptage). Le jeu transmet à la scène les départs du tick (abandons et rejets d'usagers), pas seulement le nombre d'usagers en cours.
2. **La ville se dépeuple.** Comportement moteur existant conservé : un usager rejeté ou ayant abandonné quitte la population ; la demande baisse en conséquence ; la salle d'attente se remplit moins.
3. **Panneau « Population desservie »** peint dans le décor de la salle, à côté du panneau d'appel, en chiffres pixel (format français). Il descend sous les yeux du joueur et peut tendre vers zéro pendant que le service tourne. Il fait partie du décor (comme le panneau d'appel), ce n'est pas un bandeau.
4. **Chiffres** : l'en-tête des procédures de l'Atelier affiche déjà leurs abandons (spec 010). Rien d'autre.

## Partie 2 — La boucle se remarque

1. **Le moment.** Au premier dossier sans usager de la partie, une seule fois : un parapheur traverse la salle sans usager devant le guichet, le guichetier tamponne quand même, le dossier rejoint la corbeille du chef ; le panneau d'appel affiche « — » pendant ce passage. Ni son ni effet de récompense : une anomalie visible.
2. **Le sigle.** Dans la bulle (tableau de circulation), les parapheurs sans usager portent un sigle « dossier sans silhouette », en plus de la mention « Dossier sans usager ».
3. **Le joueur reste dans le jeu (moteur).** Un dossier en boucle qui franchit l'étape « Pièce délivrée par nos services » continue aussi les étapes suivantes de sa procédure (Visa compris), au lieu de seulement partir dans la procédure exigée. La règle « un usager ajoute **un** dossier en boucle » (spec 009) est conservée : le dossier lié déposé dans la procédure exigée est le dossier en boucle de cet usager ; le dossier d'origine poursuit sa procédure jusqu'au bout et sort normalement (accepté ou rejeté). Le stock de dossiers en boucle ne doit pas croître sans limite (conservation vérifiée par un test). Le joueur continue de tamponner après la boucle.
4. **La lettre** « Félicitations pour l'optimisation de vos circuits » arrive avec un léger décalage après le premier dossier sans usager.
5. **Filet de sécurité** inchangé (deux lettres « Constat de non-sollicitation »). Pas de procédure grisée dans la feuille « Pièce exigée » (décision du plan 2 maintenue).

## Partie 3 — L'inversion se voit

1. **Atelier, procédure bouclée** : le bilan par dossier se dédouble — « avec usager : +X € · −Y patience » et « sans usager : +X € · aucune patience » (sigle « sans silhouette »). Ajouter une étape fait monter les deux lignes en euros, la première seule en patience. Sur une procédure non bouclée, une seule ligne (comme aujourd'hui).
2. **Scène, rejet** : un parapheur sans usager rejeté ne fait sortir personne ; il glisse à rebours vers l'entrée de la procédure puis repart. Monter le Rejet fait tourner davantage de parapheurs sans départ — contraste avec la partie 1.
3. **Exemplaires** : même règle, rien à ajouter à l'interface (les départs de la partie 1 ne concernent que les dossiers d'usagers).
4. **Rythme** : rien ne pousse le joueur vers l'inversion ; les notes Rejet élargi, Commission, Délai de réflexion arrivent après la boucle et leurs textes existants suffisent.

## Partie 4 — Fiche, arbitrage, tests

1. **Fiche de poste du chef de service réduite à l'orientation** : trois lignes toujours présentes — les dossiers circulent d'étape en étape ; vous visez les parapheurs (les guichets traitent les pièces) ; chaque étape consomme des formulaires. Lignes ajoutées au déblocage : les agents visent à votre place (note Agents) ; les fournitures sont commandées par le service des achats (note Marché public). **Supprimées** : « Votre évaluation portera sur le volume traité », l'arbitrage de l'Atelier, des Exemplaires et de la pièce délivrée par nos services. Pastille d'Options seulement pour une ligne nouvelle.
2. **Arbitrage vérifié au simulateur avant la mise en scène.** Nouvelle mesure « leviers » dans `scripts/simulate-acte2.ts` : depuis un même état, un robot prudent (rejet 0, ×1, procédures courtes) et un robot agressif (rejet haut, ×3, procédures longues) jouent 10 minutes, **avant la boucle** puis **après la boucle**. Critère : avant la boucle, l'agressif finit **en dessous** du prudent en étapes franchies sur 10 min (et en population restante) ; après la boucle, l'agressif finit **nettement au-dessus**. Si ce n'est pas le cas, recalage (patience, demande, effets des Exemplaires, prime de rejet) jusqu'à ce que ce soit vrai, en gardant les jalons de la spec 009.
3. **Conservé de la passe 010** : tableau de circulation, débits, en-tête des procédures, étapes « en attente de réglementation », formulaires comme contrainte et service des achats.
4. **Raccourcis de test** (`?test`) : « Avant la boucle : leviers en main » (Atelier, Exemplaires et rejet disponibles, ville pleine) ; « Boucle sur le point de se former » (il ne reste qu'à exiger la pièce) ; « Boucle formée, leviers prudents » (pour essayer l'inversion).

## Mesure

Pas de promesse de déclic : seule une partie réelle le dira. Après livraison, partie guidée par les raccourcis ; le porteur de projet dit à quel moment le déclic est venu, ou pas, et on ajuste.
