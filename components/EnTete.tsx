import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Interligne, Typo } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import CourrierModal from '@/components/CourrierModal';
import ValeurAnimee from '@/components/charte/ValeurAnimee';
import { formatEntier } from '@/utils/formatters';

/**
 * En-tête commun à tous les onglets : le compteur « Tampons apposés »
 * (repère qui ne quitte jamais le haut de l'écran) et l'enveloppe du S.I.C.
 */
export default function EnTete() {
  const { etat, lettresNonLues, verdict } = useGameState();
  const [courrier, setCourrier] = useState(false);
  const insets = useSafeAreaInsets();
  const tampons = Math.floor(etat.tampons);
  // Petit écran : le compteur passe d'une marche plus bas pour laisser la place à la scène.
  const compact = useWindowDimensions().height < 720;

  return (
    <View style={[styles.entete, { paddingTop: insets.top + (compact ? 2 : 6) }]}>
      <View style={styles.compteur} accessible accessibilityRole="header" accessibilityLabel={`Tampons apposés : ${tampons}`}>
        {!compact && <Text style={styles.label}>TAMPONS APPOSÉS</Text>}
        <View style={styles.ligneCompteur}>
          <ValeurAnimee
            texte={formatEntier(tampons)}
            declencheur={verdict?.id}
            style={[styles.valeur, compact && styles.valeurCompacte]}
            effet="saut"
            numberOfLines={1}
          />
          {/* Petit écran : le libellé passe à côté du chiffre, avec le même nom. Rien ne dit que le jeu a des actes. */}
          {compact && (
            <Text style={styles.acte} numberOfLines={2}>
              tampons apposés
            </Text>
          )}
        </View>
      </View>
      <Pressable
        onPress={() => setCourrier(true)}
        style={({ pressed }) => [styles.enveloppe, pressed && styles.presse]}
        accessibilityRole="button"
        accessibilityLabel={`Courrier du S.I.C.${lettresNonLues > 0 ? `, ${lettresNonLues} non ${lettresNonLues > 1 ? 'lus' : 'lu'}` : ''}`}
      >
        <Mail size={20} color={Colors.anthracite} />
        <NotificationBadge count={lettresNonLues} />
      </Pressable>
      <CourrierModal visible={courrier} onFermer={() => setCourrier(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    paddingHorizontal: Espace.l,
    paddingBottom: Espace.xs,
    backgroundColor: Colors.creme,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
  },
  compteur: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.micro,
    letterSpacing: 0.8,
    color: Colors.crayon,
  },
  valeur: {
    // Le compteur ne se tronque jamais : c'est l'avancement, à côté, qui cède la place.
    flexShrink: 0,
    fontFamily: Fonts.chiffres,
    fontSize: Typo.heros,
    lineHeight: Interligne.heros,
    color: Colors.anthracite,
    alignSelf: 'flex-start',
    transformOrigin: 'left center',
  },
  ligneCompteur: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
  },
  acte: {
    flexShrink: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  valeurCompacte: {
    fontSize: Typo.grand,
    lineHeight: Interligne.grand,
  },
  enveloppe: {
    width: 44,
    height: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.papier,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.anthracite,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
