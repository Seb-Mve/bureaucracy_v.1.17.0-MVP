import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import { MoteurDirection, type EtatDirection } from './direction';
import type { Toile } from './toile';
import type { TailleScene } from './useMoteurScene';

/** Images dessinées par seconde (le moteur avance, lui, à chaque frame). */
const IMAGES_PAR_SECONDE = 30;

/**
 * Branche la scène de l'acte II (bureau du chef de service) sur l'état du jeu et fait tourner
 * sa boucle tant que l'écran Direction est affiché. `dessiner` reçoit chaque image.
 */
export function useMoteurDirection(
  dessiner: (t: Toile) => void,
  onImpact?: () => void,
) {
  const { direction, verdict } = useGameState();
  const impactRef = useRef(onImpact);
  impactRef.current = onImpact;
  const dessinerRef = useRef(dessiner);
  dessinerRef.current = dessiner;
  const moteurRef = useRef<MoteurDirection | null>(null);
  if (!moteurRef.current)
    moteurRef.current = new MoteurDirection(() => impactRef.current?.());
  const moteur = moteurRef.current;
  const [taille, setTaille] = useState<TailleScene>({ largeur: 0, hauteur: 0 });

  const usagers = direction?.usagers ?? 0;
  const visas = direction?.visas ?? 0;
  const guichets = direction?.guichets ?? 1;
  const appel = direction?.appel ?? null;
  const etatRef = useRef<EtatDirection>({ usagers, visas, guichets, appel });
  etatRef.current = { usagers, visas, guichets, appel };
  useEffect(() => {
    moteur.etat({ usagers, visas, guichets, appel });
  }, [moteur, usagers, visas, guichets, appel]);

  // Chaque coup de tampon qui accorde un visa fait viser un parapheur au chef, une seule fois.
  const dernierVerdict = useRef(verdict?.id ?? null);
  useEffect(() => {
    if (!verdict || verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    moteur.tamponner();
  }, [moteur, verdict]);

  useFocusEffect(
    useCallback(() => {
      let raf = 0;
      let precedent = performance.now();
      let dernierDessin = 0;
      const boucle = (maintenant: number) => {
        moteur.avancer(Math.min(64, Math.max(0, maintenant - precedent)));
        precedent = maintenant;
        if (maintenant - dernierDessin >= 1000 / IMAGES_PAR_SECONDE - 2) {
          dernierDessin = maintenant;
          const toile = moteur.peindre();
          if (toile) dessinerRef.current(toile);
        }
        raf = requestAnimationFrame(boucle);
      };
      raf = requestAnimationFrame(boucle);
      return () => cancelAnimationFrame(raf);
    }, [moteur]),
  );

  const surLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      moteur.redim(width, height);
      moteur.etat(etatRef.current);
      setTaille({ largeur: width, hauteur: height });
    },
    [moteur],
  );

  return { surLayout, taille };
}
