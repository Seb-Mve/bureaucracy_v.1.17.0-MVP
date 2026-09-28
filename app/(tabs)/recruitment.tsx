import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileStack, UserRound } from 'lucide-react-native';
import { useGameState, type AgentAffiche } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { formatEuros, formatNumberFrench } from '@/utils/formatters';
import Hud from '@/components/Hud';
import Panneau from '@/components/charte/Panneau';

interface BoutonAchatProps {
  libelle: string;
  actif: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

const BoutonAchat = memo(function BoutonAchat({ libelle, actif, onPress, accessibilityLabel }: BoutonAchatProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!actif}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !actif }}
      style={({ pressed }) => [styles.achat, actif ? styles.achatActif : styles.achatInactif, pressed && styles.achatPresse]}
    >
      <Text style={[styles.achatTexte, !actif && styles.achatTexteInactif]}>{libelle}</Text>
    </Pressable>
  );
});

const CarteAgent = memo(function CarteAgent({ agent, onAcheter }: { agent: AgentAffiche; onAcheter: () => void }) {
  return (
    <Panneau contenuStyle={styles.carte} rayon={14}>
      <View style={styles.avatar}>
        <UserRound size={18} color={Colors.anthracite} />
      </View>
      <View style={styles.infos}>
        <Text style={styles.nom}>
          {agent.nom} <Text style={styles.possedes}>×{agent.possedes}</Text>
        </Text>
        <Text style={styles.description}>{agent.description}</Text>
        <Text style={styles.detail}>{formatNumberFrench(agent.vitesse)} dossier/s chacun</Text>
      </View>
      <BoutonAchat
        libelle={`${formatEuros(agent.cout)} €`}
        actif={agent.achetable}
        onPress={onAcheter}
        accessibilityLabel={`Recruter : ${agent.nom}, ${formatEuros(agent.cout)} euros`}
      />
    </Panneau>
  );
});

/** Recrutement des collègues et achat de formulaires. */
export default function RecrutementScreen() {
  const { agents, acheterAgent, acheterRamettes, prixRamette, etat, vitesse } = useGameState();

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <Panneau contenuStyle={styles.carte} rayon={14}>
          <View style={[styles.avatar, styles.avatarRamette]}>
            <FileStack size={18} color={Colors.anthracite} />
          </View>
          <View style={styles.infos}>
            <Text style={styles.nom}>Ramette de {BALANCE.ramette} formulaires</Text>
            <Text style={styles.description}>Imprimés réglementaires, format A4, couleur administrative.</Text>
            <Text style={styles.detail}>{formatEuros(prixRamette)} € la ramette</Text>
          </View>
          <View style={styles.achats}>
            <BoutonAchat
              libelle="×1"
              actif={etat.budget >= prixRamette}
              onPress={() => acheterRamettes(1)}
              accessibilityLabel="Acheter une ramette"
            />
            <BoutonAchat
              libelle="×10"
              actif={etat.budget >= prixRamette}
              onPress={() => acheterRamettes(10)}
              accessibilityLabel="Acheter dix ramettes"
            />
          </View>
        </Panneau>

        <Text style={styles.titre}>
          Collègues <Text style={styles.sousTitre}>· {formatNumberFrench(vitesse)} dossiers/s au total</Text>
        </Text>
        {agents.map((a) => (
          <CarteAgent key={a.id} agent={a} onAcheter={() => acheterAgent(a.id)} />
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
    padding: 12,
    gap: 10,
  },
  titre: {
    fontFamily: Fonts.titre,
    fontSize: 17,
    color: Colors.anthracite,
    marginTop: 4,
  },
  sousTitre: {
    fontFamily: Fonts.texte,
    fontSize: 12,
    color: Colors.crayon,
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.encreFond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRamette: {
    backgroundColor: '#A0C4FF',
  },
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: 14,
    color: Colors.anthracite,
  },
  possedes: {
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.encreTexte,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: 12,
    color: Colors.crayon,
  },
  detail: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: 11,
    color: Colors.anthracite,
  },
  achats: {
    gap: 6,
  },
  achat: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  achatActif: {
    backgroundColor: Colors.vert,
  },
  achatInactif: {
    backgroundColor: Colors.carton,
  },
  achatPresse: {
    transform: [{ translateY: 2 }],
  },
  achatTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.anthracite,
  },
  achatTexteInactif: {
    color: Colors.crayon,
  },
});
