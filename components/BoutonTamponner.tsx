import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { formatEuros } from '@/utils/formatters';

/** Un champ de saisie ou une fenêtre ouverte garde la barre d'espace pour lui. */
function espaceLibre(e: KeyboardEvent): boolean {
  const cible = e.target as HTMLElement | null;
  if (cible && (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(cible.tagName))) return false;
  return document.querySelector('[aria-modal="true"]') === null;
}

/**
 * Le bouton TAMPONNER et ce qu'il faut savoir juste au-dessus : stock bas ou rupture,
 * avec l'achat d'une ramette à portée de pouce. Le gain d'un coup se lit dans les compteurs.
 */
export default function BoutonTamponner() {
  const { tamponner, enAttente, etat, mods, stockBas, prixRamette, acheterRamettes } = useGameState();
  const focalise = useIsFocused();
  const action = useRef(tamponner);
  action.current = tamponner;

  const rupture = etat.formulaires < mods.pieces;
  const vide = enAttente < 1;
  const libelle = rupture ? 'RUPTURE D’IMPRIMÉS' : vide ? 'AUCUN DOSSIER' : 'TAMPONNER';
  const achatPossible = etat.budget >= prixRamette;
  const prix = `${formatEuros(prixRamette)} €`;

  // Web : la barre d'espace tamponne (un appui = un coup).
  useEffect(() => {
    if (Platform.OS !== 'web' || !focalise) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || !espaceLibre(e)) return;
      e.preventDefault();
      action.current();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [focalise]);

  let alerte: string | null = null;
  if (rupture) alerte = 'Plus de formulaires.';
  else if (stockBas) alerte = 'Formulaires bientôt épuisés.';
  const proposerAchat = (rupture || stockBas) && mods.recrutementVisible;

  return (
    <View style={styles.zone}>
      {alerte !== null && (
        <View style={[styles.alerte, rupture ? styles.alerteRupture : styles.alerteBas]} accessibilityLiveRegion="polite">
          <Text style={[styles.alerteTexte, rupture && styles.alerteTexteRupture]}>
            {alerte}
            {proposerAchat && !achatPossible ? ` Une ramette coûte ${prix}.` : ''}
          </Text>
          {proposerAchat && achatPossible && (
            <Pressable
              onPress={() => acheterRamettes(1)}
              style={({ pressed }) => [styles.achat, pressed && styles.presse]}
              accessibilityRole="button"
              accessibilityLabel={`Acheter une ramette, ${prix}`}
            >
              <Text style={styles.achatTexte}>1 ramette · {prix}</Text>
            </Pressable>
          )}
        </View>
      )}
      <BoutonPoussoir
        libelle={libelle}
        onPress={tamponner}
        repetition
        taille={libelle === 'TAMPONNER' ? Typo.grand : Typo.titre}
        couleur={rupture || vide ? Colors.carton : Colors.encre}
        couleurOmbre={rupture || vide ? Colors.crayonClair : Colors.encreFlanc}
        couleurTexte={rupture || vide ? Colors.crayon : Colors.anthracite}
        accessibilityLabel="Tamponner un dossier"
        accessibilityHint={
          rupture ? 'Plus de formulaires : achetez des ramettes' : vide ? 'Aucun dossier en attente' : 'Maintenir pour tamponner en continu'
        }
      />
      {vide && !rupture && (
        <Text style={styles.aide}>
          {mods.conformiteVisible
            ? 'Pénurie d’usagers : vos collègues vont plus vite que la population. Les rejetés reviennent toujours.'
            : 'Aucun usager au guichet. Ils arrivent… à leur rythme.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.m,
    paddingTop: Espace.s,
    paddingBottom: Espace.m,
    gap: Espace.s,
  },
  alerte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingLeft: Espace.m,
    paddingRight: Espace.xs,
    paddingVertical: Espace.xs,
    minHeight: 52,
  },
  alerteBas: {
    backgroundColor: Colors.encreFond,
  },
  alerteRupture: {
    backgroundColor: Colors.rougeFond,
  },
  alerteTexte: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  alerteTexteRupture: {
    color: Colors.rougeTexte,
  },
  achat: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Espace.m,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.vert,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  achatTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  aide: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
    textAlign: 'center',
  },
});
