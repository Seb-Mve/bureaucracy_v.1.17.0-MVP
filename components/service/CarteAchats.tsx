import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, CircleCheck, Truck } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import Panneau from '@/components/charte/Panneau';

/**
 * Service des achats (acte II, note « Marché public de fournitures ») : un interrupteur. En service, il commande
 * les ramettes sur le budget quand le stock baisse ; l'état se lit au mot et à la coche, pas à la couleur.
 */
export default function CarteAchats() {
  const { service2, reglerAchats, encre } = useGameState();
  const achats = service2?.achats;
  if (!achats) return null;
  const { actifs } = achats;

  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.avatar}>
        <Truck size={18} color={Colors.anthracite} />
      </View>
      <Text style={styles.nom}>Service des achats</Text>
      <Pressable
        onPress={() => reglerAchats(!actifs)}
        accessibilityRole="switch"
        accessibilityState={{ checked: actifs }}
        // react-native-web ne traduit plus accessibilityState : l'état passe aussi par aria-checked.
        aria-checked={actifs}
        accessibilityLabel="Service des achats"
        style={({ pressed }) => [
          styles.interrupteur,
          actifs && styles.interrupteurActif,
          actifs && { backgroundColor: encre.fond },
          pressed && styles.presse,
        ]}
      >
        {actifs ? (
          <CircleCheck size={18} color={Colors.anthracite} />
        ) : (
          <Circle size={18} color={Colors.crayon} />
        )}
        <Text style={[styles.etat, !actifs && styles.etatSuspendu]}>
          {actifs ? 'EN SERVICE' : 'SUSPENDU'}
        </Text>
      </Pressable>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    padding: Espace.m,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.pastelBleu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nom: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  interrupteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.xs,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Espace.m,
    borderWidth: Charte.trait,
    borderStyle: 'dashed',
    borderColor: Colors.crayon,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papier,
  },
  /** En service : trait plein et épais, comme un tampon apposé. */
  interrupteurActif: {
    borderStyle: 'solid',
    borderColor: Colors.anthracite,
  },
  etat: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  etatSuspendu: {
    color: Colors.crayon,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
