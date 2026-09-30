import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AlphaType, Canvas, ColorType, FilterMode, Image, MipmapMode, Skia, type SkImage } from '@shopify/react-native-skia';
import { useMoteurScene } from '@/components/scene/pixel/useMoteurScene';
import type { Toile } from '@/components/scene/pixel/toile';

interface Props {
  onImpact?: () => void;
}

/** Échantillonnage « au plus proche » : les pixels restent nets une fois agrandis. */
const NET = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };
/** Images gardées en vie le temps que le fil graphique ait fini de les afficher. */
const RESERVE = 3;

/** Scène du guichet en pixel art (téléphone : rendu Skia). */
export default function ScenePixel({ onImpact }: Props) {
  const image = useSharedValue<SkImage | null>(null);
  const anciennes = useRef<SkImage[]>([]);

  const dessiner = useCallback(
    (t: Toile) => {
      const img = Skia.Image.MakeImage(
        { width: t.w, height: t.h, alphaType: AlphaType.Unpremul, colorType: ColorType.RGBA_8888 },
        Skia.Data.fromBytes(t.octets),
        t.w * 4,
      );
      if (!img) return;
      image.value = img;
      anciennes.current.push(img);
      while (anciennes.current.length > RESERVE) anciennes.current.shift()?.dispose();
    },
    [image],
  );

  const { surLayout, taille } = useMoteurScene(dessiner, onImpact);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={surLayout} accessible accessibilityLabel="Le guichet 3 : l’agent tamponne, la file d’usagers avance">
      <Canvas style={StyleSheet.absoluteFill}>
        <Image image={image} x={0} y={0} width={taille.largeur} height={taille.hauteur} fit="fill" sampling={NET} />
      </Canvas>
    </View>
  );
}
