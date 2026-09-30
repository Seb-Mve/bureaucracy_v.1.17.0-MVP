import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMoteurScene } from '@/components/scene/pixel/useMoteurScene';
import type { Toile } from '@/components/scene/pixel/toile';

interface Props {
  onImpact?: () => void;
}

/** Style du canvas : agrandi sans lissage pour garder les pixels nets. */
const STYLE_CANVAS = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  imageRendering: 'pixelated',
  display: 'block',
} as const;

/** Scène du guichet en pixel art (web : canvas 2D, sans Skia ni WebAssembly). */
export default function ScenePixel({ onImpact }: Props) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const tampon = useRef<ImageData | null>(null);

  const dessiner = useCallback((t: Toile) => {
    const cv = canvas.current;
    if (!cv) return;
    if (cv.width !== t.w || cv.height !== t.h) {
      cv.width = t.w;
      cv.height = t.h;
      tampon.current = null;
    }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    if (!tampon.current) tampon.current = ctx.createImageData(t.w, t.h);
    tampon.current.data.set(t.octets);
    ctx.putImageData(tampon.current, 0, 0);
  }, []);

  const { surLayout } = useMoteurScene(dessiner, onImpact);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={surLayout} accessible accessibilityLabel="Le guichet 3 : l’agent tamponne, la file d’usagers avance">
      {React.createElement('canvas', { ref: canvas, style: STYLE_CANVAS, 'aria-hidden': true })}
    </View>
  );
}
