import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Fonts } from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { formatEuros } from '@/utils/formatters';

interface Flottant {
  cle: number;
  texte: string;
}

function NombreFlottant({ texte, fin }: { texte: string; fin: () => void }) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  const dx = useRef(Math.random() * 40 - 20).current;
  const finRef = useRef(fin);
  finRef.current = fin;

  useEffect(() => {
    y.value = withTiming(-56, { duration: 700 });
    o.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 580 }));
    const t = setTimeout(() => finRef.current(), 720);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { translateX: dx }] }));
  return (
    <Animated.Text pointerEvents="none" style={[styles.flottant, style]}>
      {texte}
    </Animated.Text>
  );
}

/** Le bouton TAMPONNER, avec son libellé d'état et les « +N € » qui s'envolent. */
export default function BoutonTamponner() {
  const { tamponner, enAttente, etat, mods } = useGameState();
  const [flottants, setFlottants] = useState<Flottant[]>([]);
  const cle = useRef(0);

  const rupture = etat.formulaires < mods.pieces;
  const vide = enAttente < 1;
  const libelle = rupture ? 'RUPTURE D’IMPRIMÉS' : vide ? 'AUCUN DOSSIER' : 'TAMPONNER';

  const surAppui = useCallback(() => {
    const ev = tamponner();
    if (ev.traites > 0) {
      setFlottants((f) =>
        f.length >= 5
          ? f
          : [
              ...f,
              {
                cle: cle.current++,
                texte: `+${formatEuros(ev.budget)} € · −${Math.round(ev.traites * mods.pieces)} formulaire${ev.traites * mods.pieces >= 2 ? 's' : ''}`,
              },
            ],
      );
    }
  }, [tamponner, mods.pieces]);

  const retirer = useCallback((c: number) => setFlottants((f) => f.filter((x) => x.cle !== c)), []);

  return (
    <View style={styles.zone}>
      {flottants.map((f) => (
        <NombreFlottant key={f.cle} texte={f.texte} fin={() => retirer(f.cle)} />
      ))}
      <BoutonPoussoir
        libelle={libelle}
        onPress={surAppui}
        taille={libelle === 'TAMPONNER' ? 24 : 18}
        couleur={rupture || vide ? Colors.carton : Colors.encre}
        couleurOmbre={rupture || vide ? Colors.crayonClair : Colors.encreOmbre}
        couleurTexte={rupture || vide ? Colors.crayon : Colors.texteSurEncre}
        accessibilityLabel="Tamponner un dossier"
        accessibilityHint={
          rupture ? 'Plus de formulaires : achetez des ramettes' : vide ? 'Aucun dossier en attente' : undefined
        }
      />
      {(rupture || vide) && (
        <Text style={styles.aide}>
          {rupture
            ? mods.recrutementVisible
              ? 'Plus de formulaires : achetez des ramettes dans l’onglet Recrutement.'
              : 'Plus de formulaires.'
            : 'Aucun usager au guichet. Ils arrivent… à leur rythme.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  aide: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.crayon,
    textAlign: 'center',
    marginTop: 6,
  },
  flottant: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.encreTexte,
    zIndex: 2,
  },
});
