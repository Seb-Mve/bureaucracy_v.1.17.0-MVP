import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';
import { formatDebit } from '@/utils/formatters';
import Hud from '@/components/Hud';
import CarteRamettes from '@/components/service/CarteRamettes';
import CarteUnite from '@/components/service/CarteUnite';
import ServiceDirection from '@/components/direction/ServiceDirection';

/** Onglet Service : fournitures (ramettes) et recrutement des collègues (acte I), ou de la Direction (acte II). */
export default function ServiceScreen() {
  const { agents, acheterAgent, vitesse, demandeLimitante, direction } =
    useGameState();
  if (direction) return <ServiceDirection />;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <CarteRamettes />

        <Text style={styles.titre}>
          Collègues{' '}
          <Text style={styles.sousTitre}>
            · {formatDebit(vitesse)} dossiers/s au total
          </Text>
        </Text>
        {demandeLimitante && (
          <Text style={styles.alerte}>
            Ce sont les usagers qui manquent, pas les bras : un collègue de plus
            n’accélérerait rien. Étendez le périmètre ou les horaires (notes de
            service).
          </Text>
        )}
        {agents.map((a) => (
          <CarteUnite
            key={a.id}
            id={a.id}
            nom={a.nom}
            description={a.description}
            possedes={a.possedes}
            cout={a.cout}
            cout10={a.cout10}
            maxAchetables={a.maxAchetables}
            coutMax={a.coutMax}
            achetable={a.achetable}
            Icone={UserRound}
            fondIcone={Colors.encreFond}
            verbe="Recruter"
            onAcheter={(nb) => acheterAgent(a.id, nb)}
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
  alerte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
});
