import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import { MoteurScene } from './moteur';
import type { Toile } from './toile';

/** Images dessinées par seconde (le moteur avance, lui, à chaque frame). */
const IMAGES_PAR_SECONDE = 30;

export interface TailleScene {
  /** Zone d'affichage (pt). */
  largeur: number;
  hauteur: number;
}

/**
 * Branche le moteur de la scène sur l'état du jeu et fait tourner sa boucle
 * tant que l'écran du guichet est affiché. `dessiner` reçoit chaque image.
 */
export function useMoteurScene(dessiner: (t: Toile) => void, onImpact?: () => void) {
  const { enAttente, mods, tete, verdict } = useGameState();
  const impactRef = useRef(onImpact);
  impactRef.current = onImpact;
  const dessinerRef = useRef(dessiner);
  dessinerRef.current = dessiner;
  const moteurRef = useRef<MoteurScene | null>(null);
  if (!moteurRef.current) moteurRef.current = new MoteurScene(() => impactRef.current?.());
  const moteur = moteurRef.current;
  const [taille, setTaille] = useState<TailleScene>({ largeur: 0, hauteur: 0 });

  const premierNumero = tete[0]?.numero ?? null;
  useEffect(() => {
    moteur.etat({ enAttente, numerotation: mods.numerotation, premierNumero });
  }, [moteur, enAttente, mods.numerotation, premierNumero]);

  // Chaque verdict (coup de tampon du joueur) déclenche l'animation, une seule fois.
  const dernierVerdict = useRef(verdict?.id ?? null);
  useEffect(() => {
    if (!verdict || verdict.id === dernierVerdict.current) return;
    dernierVerdict.current = verdict.id;
    moteur.tamponner(verdict.rejete);
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
      moteur.etat({ enAttente, numerotation: mods.numerotation, premierNumero });
      setTaille({ largeur: width, hauteur: height });
    },
    [moteur, enAttente, mods.numerotation, premierNumero],
  );

  return { surLayout, taille, moteur };
}
