import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import CourrierModal from '@/components/CourrierModal';

/** En-tête commun : titre du jeu et enveloppe du courrier du S.I.C. */
export default function EnTete() {
  const { lettresNonLues } = useGameState();
  const [courrier, setCourrier] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.entete, { paddingTop: insets.top + 6 }]}>
      <View style={styles.cote} />
      <Text style={styles.titre} accessibilityRole="header">
        BUREAUCRACY++
      </Text>
      <View style={styles.cote}>
        <Pressable
          onPress={() => setCourrier(true)}
          style={({ pressed }) => [styles.enveloppe, pressed && styles.presse]}
          accessibilityRole="button"
          accessibilityLabel={`Courrier du S.I.C.${lettresNonLues > 0 ? `, ${lettresNonLues} non lu` : ''}`}
        >
          <Mail size={20} color={Colors.anthracite} />
          <NotificationBadge count={lettresNonLues} />
        </Pressable>
      </View>
      <CourrierModal visible={courrier} onFermer={() => setCourrier(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: Colors.creme,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
  },
  cote: {
    width: 48,
    alignItems: 'flex-end',
  },
  titre: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.titreGras,
    fontSize: 22,
    color: Colors.anthracite,
    letterSpacing: 1,
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
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
