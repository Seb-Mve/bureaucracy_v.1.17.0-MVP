import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import CourrierModal from '@/components/CourrierModal';

/**
 * En-tête commun à tous les onglets : le compteur « Tampons apposés »
 * (repère qui ne quitte jamais le haut de l'écran) et l'enveloppe du S.I.C.
 */
export default function EnTete() {
  const { etat, lettresNonLues } = useGameState();
  const [courrier, setCourrier] = useState(false);
  const insets = useSafeAreaInsets();
  const tampons = Math.floor(etat.tampons);

  return (
    <View style={[styles.entete, { paddingTop: insets.top + 6 }]}>
      <View style={styles.compteur} accessible accessibilityRole="header" accessibilityLabel={`Tampons apposés : ${tampons}`}>
        <Text style={styles.label}>TAMPONS APPOSÉS</Text>
        <Text style={styles.valeur} numberOfLines={1} adjustsFontSizeToFit>
          {tampons.toLocaleString('fr-FR')}
        </Text>
      </View>
      <Pressable
        onPress={() => setCourrier(true)}
        style={({ pressed }) => [styles.enveloppe, pressed && styles.presse]}
        accessibilityRole="button"
        accessibilityLabel={`Courrier du S.I.C.${lettresNonLues > 0 ? `, ${lettresNonLues} non lu` : ''}`}
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
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: Colors.creme,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
  },
  compteur: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.texteGras,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.crayon,
  },
  valeur: {
    fontFamily: Fonts.chiffres,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.anthracite,
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
