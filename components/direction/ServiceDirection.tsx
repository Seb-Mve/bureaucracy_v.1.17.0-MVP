import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Landmark, UserRound } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';
import { formatDebit } from '@/utils/formatters';
import Hud from '@/components/Hud';
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteUnite from '@/components/service/CarteUnite';

/** Onglet Service de l'acte II : fournitures, guichets (franchissent les étapes) et agents (accordent les visas). */
export default function ServiceDirection() {
  const { service2, acheterGuichet, acheterAgent2, encre } = useGameState();
  if (!service2) return null;
  const { guichet, agents, etapesParSeconde, visasParSeconde } = service2;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <CarteRamettes />

        <Text style={styles.titre}>
          Guichets{' '}
          <Text style={styles.sousTitre}>
            · {formatDebit(etapesParSeconde)} étapes/s au total
          </Text>
        </Text>
        <CarteUnite
          {...guichet}
          Icone={Landmark}
          fondIcone={encre.fond}
          verbe="Acheter"
          onAcheter={acheterGuichet}
        />

        {agents.length > 0 && (
          <Text style={styles.titre}>
            Agents{' '}
            <Text style={styles.sousTitre}>
              · {formatDebit(visasParSeconde)} visas/s au total
            </Text>
          </Text>
        )}
        {agents.map((a) => (
          <CarteUnite
            key={a.id}
            {...a}
            Icone={UserRound}
            fondIcone={Colors.pastelJaune}
            verbe="Recruter"
            onAcheter={(nb) => acheterAgent2(a.id, nb)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  contenu: {
    padding: Espace.m,
    gap: Espace.m,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.titre,
    color: Colors.anthracite,
    marginTop: Espace.xs,
  },
  sousTitre: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
