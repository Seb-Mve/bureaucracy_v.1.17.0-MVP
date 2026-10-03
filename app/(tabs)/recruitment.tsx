import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileStack, UserRound } from 'lucide-react-native';
import { useGameState, type AgentAffiche } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { formatDebit, formatEntier, formatEuros, formatMontant } from '@/utils/formatters';
import Hud from '@/components/Hud';
import Panneau from '@/components/charte/Panneau';

interface BoutonAchatProps {
  libelle: string;
  actif: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Se partage la largeur avec ses voisins (achats en lot). */
  large?: boolean;
  /** Seconde ligne (prix du lot). */
  detail?: string;
}

const BoutonAchat = memo(function BoutonAchat({ libelle, actif, onPress, accessibilityLabel, large, detail }: BoutonAchatProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!actif}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !actif }}
      style={({ pressed }) => [styles.achat, large && styles.achatLarge, actif ? styles.achatActif : styles.achatInactif, pressed && styles.achatPresse]}
    >
      <Text style={[styles.achatTexte, !actif && styles.achatTexteInactif]} numberOfLines={1} adjustsFontSizeToFit>
        {libelle}
      </Text>
      {detail !== undefined && (
        <Text style={[styles.achatDetail, !actif && styles.achatTexteInactif]} numberOfLines={2}>
          {detail}
        </Text>
      )}
    </Pressable>
  );
});

const CarteAgent = memo(function CarteAgent({
  agent,
  onAcheter,
}: {
  agent: AgentAffiche;
  onAcheter: (id: AgentAffiche['id'], nb: number) => void;
}) {
  const max = agent.maxAchetables;
  return (
    <Panneau contenuStyle={styles.carteAgent} rayon={Charte.rayon}>
      <View style={styles.ligneAgent}>
        <View style={styles.avatar}>
          <UserRound size={18} color={Colors.anthracite} />
        </View>
        <View style={styles.infos}>
          <Text style={styles.nom}>
            {agent.nom} <Text style={styles.possedes}>×{agent.possedes}</Text>
          </Text>
          <Text style={styles.description}>{agent.description}</Text>
        </View>
      </View>
      <View style={styles.achatsAgent}>
        <BoutonAchat
          libelle="×1"
          detail={`${formatMontant(agent.cout)}`}
          actif={agent.achetable}
          onPress={() => onAcheter(agent.id, 1)}
          accessibilityLabel={`Recruter : ${agent.nom} ×1, ${formatEuros(agent.cout)} euros`}
          large
        />
        <BoutonAchat
          libelle="×10"
          detail={`${formatMontant(agent.cout10)}`}
          actif={max >= 10}
          onPress={() => onAcheter(agent.id, 10)}
          accessibilityLabel={`Recruter : ${agent.nom} ×10, ${formatEuros(agent.cout10)} euros`}
          large
        />
        <BoutonAchat
          libelle="Max"
          detail={max > 0 ? `×${formatEntier(max)}\n${formatMontant(agent.coutMax)}` : `×0\n${formatMontant(agent.cout)}`}
          actif={max > 0}
          onPress={() => onAcheter(agent.id, max)}
          accessibilityLabel={`Recruter : ${agent.nom}, autant que le budget le permet (${max}), ${formatEuros(agent.coutMax)} euros`}
          large
        />
      </View>
    </Panneau>
  );
});

/** Onglet Service : fournitures (ramettes) et recrutement des collègues. */
export default function ServiceScreen() {
  const { agents, acheterAgent, acheterRamettes, prixRamette, maxRamettes, etat, mods, vitesse, demandeLimitante, demanderRequisition } =
    useGameState();
  // Rupture sans de quoi payer une ramette : le ×1 devient une réquisition gratuite (le guichet n'est jamais bloqué).
  const requisition = etat.formulaires < mods.pieces && etat.budget < prixRamette;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Fournitures</Text>
        <Panneau contenuStyle={styles.carteAgent} rayon={Charte.rayon}>
          <View style={styles.ligneAgent}>
            <View style={[styles.avatar, styles.avatarRamette]}>
              <FileStack size={18} color={Colors.anthracite} />
            </View>
            <View style={styles.infos}>
              <Text style={styles.nom}>Ramette de {BALANCE.ramette} formulaires</Text>
              <Text style={styles.description}>Formulaires réglementaires, format A4, couleur administrative.</Text>
            </View>
          </View>
          <View style={styles.achatsAgent}>
            {requisition ? (
              <BoutonAchat
                libelle="Réquisition"
                detail="Gratuit"
                actif
                onPress={demanderRequisition}
                accessibilityLabel="Demander une ramette de réquisition, gratuite"
                large
              />
            ) : (
              <BoutonAchat
                libelle="×1"
                detail={`${formatMontant(prixRamette)}`}
                actif={etat.budget >= prixRamette}
                onPress={() => acheterRamettes(1)}
                accessibilityLabel={`Acheter une ramette, ${formatEuros(prixRamette)} euros`}
                large
              />
            )}
            <BoutonAchat
              libelle="×10"
              detail={`${formatMontant(prixRamette * 10)}`}
              actif={etat.budget >= prixRamette * 10}
              onPress={() => acheterRamettes(10)}
              accessibilityLabel={`Acheter dix ramettes, ${formatEuros(prixRamette * 10)} euros`}
              large
            />
            <BoutonAchat
              libelle="Max"
              detail={maxRamettes > 0 ? `×${formatEntier(maxRamettes)}\n${formatMontant(maxRamettes * prixRamette)}` : `×0\n${formatMontant(prixRamette)}`}
              actif={maxRamettes > 0}
              onPress={() => acheterRamettes(maxRamettes)}
              accessibilityLabel={`Acheter ${maxRamettes} ramettes (ce que permet le budget), ${formatEuros(maxRamettes * prixRamette)} euros`}
              large
            />
          </View>
        </Panneau>

        <Text style={styles.titre}>
          Collègues <Text style={styles.sousTitre}>· {formatDebit(vitesse)} dossiers/s au total</Text>
        </Text>
        {demandeLimitante && (
          <Text style={styles.alerte}>
            Ce sont les usagers qui manquent, pas les bras : un collègue de plus n’accélérerait rien. Étendez le
            périmètre ou les horaires (notes de service).
          </Text>
        )}
        {agents.map((a) => (
          <CarteAgent key={a.id} agent={a} onAcheter={acheterAgent} />
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
  carteAgent: {
    padding: Espace.m,
    gap: Espace.m,
  },
  ligneAgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  achatsAgent: {
    flexDirection: 'row',
    gap: Espace.s,
  },
  achatLarge: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Charte.rayon,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.encreFond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRamette: {
    backgroundColor: Colors.pastelBleu,
  },
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  possedes: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  alerte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  achat: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espace.s,
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
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  achatDetail: {
    fontFamily: Fonts.chiffresRegular,
    fontSize: Typo.petit,
    textAlign: 'center',
    color: Colors.anthracite,
  },
  achatTexteInactif: {
    color: Colors.crayon,
  },
});
