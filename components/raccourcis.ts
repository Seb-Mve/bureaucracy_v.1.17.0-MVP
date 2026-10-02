/** Onglet et son nom, dans l'ordre de la barre (la logique des touches est dans app/(tabs)/_layout.tsx). */
export interface OngletVisible {
  route: '/' | '/recruitment' | '/notes' | '/options';
  nom: string;
}

/** Onglets réellement présents : les touches 1, 2, 3… suivent cet ordre, sans trou. */
export function ongletsVisibles(recrutement: boolean, notes: boolean): OngletVisible[] {
  return [
    { route: '/', nom: 'Guichet' },
    ...(recrutement ? [{ route: '/recruitment', nom: 'Recrutement' } as const] : []),
    ...(notes ? [{ route: '/notes', nom: 'Notes' } as const] : []),
    { route: '/options', nom: 'Options' },
  ];
}

/** Raccourcis clavier du web affichés dans l'aide : seulement ceux qui servent déjà. */
export function raccourcisVisibles(recrutement: boolean, notes: boolean): [string, string][] {
  const onglets = ongletsVisibles(recrutement, notes);
  return [
    ['Espace', 'Tamponner (sur le Guichet)'],
    [onglets.map((_, i) => String(i + 1)).join(' · '), onglets.map((o) => o.nom).join(' · ')],
    ...(recrutement ? ([['R', 'Acheter une ramette']] as [string, string][]) : []),
    ['?', 'Ouvrir cette aide'],
  ];
}
