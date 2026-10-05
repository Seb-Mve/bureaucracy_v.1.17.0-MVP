import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Landmark, UserRound } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';
import { formatDebit } from '@/utils/formatters';
import Hud from '@/components/Hud';
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteAchats from '@/components/service/CarteAchats';
import CarteUnite from '@/components/service/CarteUnite';

/** Débit au total : « 0 » quand il est négligeable, comme les débits signés (jamais « 0,00 »). */
const debitTotal = (v: number): string => (v < 0.01 ? '0' : formatDebit(v));

/**
 * Onglet Service de l'acte II : fournitures (ramettes, puis Service des achats), guichets (franchissent les
 * étapes) et agents (accordent les visas).
 */
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
        <CarteAchats />

        <Text style={styles.titre}>
          Guichets{' '}
          <Text style={styles.sousTitre}>
            · {debitTotal(etapesParSeconde)}{' '}
            {etapesParSeconde < 2 ? 'étape/s' : 'étapes/s'} au total
          </Text>
        </Text>
        <CarteUnite
          {...guichet}
          Icone={Landmark}
          fondIcone={encre.fond}
          verbe="Acheter"
          nouveau={guichet.possedes === 0}
          onAcheter={acheterGuichet}
        />

        {agents.length > 0 && (
          <Text style={styles.titre}>
            Agents{' '}
            <Text style={styles.sousTitre}>
              · {debitTotal(visasParSeconde)} visas/s au total
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
            nouveau={a.possedes === 0}
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
