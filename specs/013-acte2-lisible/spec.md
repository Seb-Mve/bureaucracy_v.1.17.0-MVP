# Acte II — Le circuit d'une demande

Retours du porteur de projet (2026-10-06) : au début de l'Acte II, trop de chiffres bougent et rien ne dit ce que produit un guichet. **Référence visuelle (fait foi) :** `specs/013-acte2-lisible/storyboard.html`, publiée sur https://claude.ai/artifact/TXbtGdnAaeNeeBn5G4aAeR.

## Le principe

Un guichet ne produit pas de cartes : il vérifie les pièces des usagers et remplit la pile « À viser » du chef de service. Au début, aucun guichet n'est ouvert : le joueur vide sa pile, elle ne se remplit plus, et le circuit montre pourquoi.

## Ce qui change

1. **Circuit** (`components/direction/CircuitDirection.tsx`, `VueDirection.circuit`) à la place de la bulle : Usagers (N attendent) → Guichets (« aucun ouvert » en rouge, flèche coupée ; puis « ×N ») → Bureau (vous ; pointillé quand vide) → Carte (délivrée). Dessous : « M. Benali attend votre visa », « repart avec sa Carte d’identité », « attend qu’un guichet ouvre ». Sans guichet et sans rien à viser, la case Guichets clignote (pas avec Animations réduites).
2. **En-tête** : Budget · À viser. Formulaires apparaît au premier guichet (ou en rupture), comme les Fournitures de l'onglet Service.
3. **Relevé « Production du service »** : seulement une fois l'Atelier ouvert.
4. **Taux de rejet** : dès le premier guichet (avant, une demande rejetée resterait bloquée).
5. **Fiche de poste** : « Les usagers déposent leur demande au guichet. / Le guichet vérifie leurs pièces et vous transmet la demande. / Vous tamponnez le visa : la carte est délivrée. Chaque visa rapporte X € au service. » (X : ce qu'un tap ajoute au budget, grade compris).
6. **Note n° 1** : « Les usagers attendent. Le guichet 3 rouvre, sous votre autorité. »

Chaque chiffre n'apparaît qu'une fois à l'écran.
