import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Platform, type LayoutChangeEvent, type View } from 'react-native';

/**
 * Largeur d'une vue, pour ajuster un texte qui doit tenir sur une ligne.
 * `onLayout` ne remonte pas toujours sur le web (largeur restée à 0) : on y mesure
 * aussi l'élément directement, et on suit ses changements de taille.
 */
export function useLargeur() {
  const ref = useRef<View>(null);
  const [largeur, setLargeur] = useState(0);
  const surLayout = useCallback((e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width), []);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = ref.current as unknown as HTMLElement | null;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;
    const mesurer = () => setLargeur(el.getBoundingClientRect().width);
    mesurer();
    if (typeof ResizeObserver === 'undefined') return;
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return { ref, largeur, surLayout };
}
