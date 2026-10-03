import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FileStack } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { BALANCE } from '@/constants/balance';
import { formatEntier, formatEuros, formatMontant } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonAchat from '@/components/service/BoutonAchat';

/** Fournitures du Service : ramettes ×1, ×10, Max (acte I et acte II, même prix de base). */
export default function CarteRamettes() {
  const {
    etat,
    rupture,
    prixRamette,
    maxRamettes,
    acheterRamettes,
    demanderRequisition,
  } = useGameState();
  // Rupture sans de quoi payer une ramette : le ×1 devient une réquisition gratuite (rien n'est jamais bloqué).
  const requisition = rupture && etat.budget < prixRamette;

  return (
    <Panneau contenuStyle={styles.carte} rayon={Charte.rayon}>
      <View style={styles.ligne}>
        <View style={styles.avatar}>
          <FileStack size={18} color={Colors.anthracite} />
        </View>
        <View style={styles.infos}>
          <Text style={styles.nom}>
            Ramette de {BALANCE.ramette} formulaires
          </Text>
          <Text style={styles.description}>
            Formulaires réglementaires, format A4, couleur administrative.
          </Text>
        </View>
      </View>
      <View style={styles.achats}>
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
            detail={formatMontant(prixRamette)}
            actif={etat.budget >= prixRamette}
            onPress={() => acheterRamettes(1)}
            accessibilityLabel={`Acheter une ramette, ${formatEuros(prixRamette)} euros`}
            large
          />
        )}
        <BoutonAchat
          libelle="×10"
          detail={formatMontant(prixRamette * 10)}
          actif={etat.budget >= prixRamette * 10}
          onPress={() => acheterRamettes(10)}
          accessibilityLabel={`Acheter dix ramettes, ${formatEuros(prixRamette * 10)} euros`}
          large
        />
        <BoutonAchat
          libelle="Max"
          detail={
            maxRamettes > 0
              ? `×${formatEntier(maxRamettes)}\n${formatMontant(maxRamettes * prixRamette)}`
              : `×0\n${formatMontant(prixRamette)}`
          }
          actif={maxRamettes > 0}
          onPress={() => acheterRamettes(maxRamettes)}
          accessibilityLabel={`Acheter ${maxRamettes} ramettes (ce que permet le budget), ${formatEuros(maxRamettes * prixRamette)} euros`}
          large
        />
      </View>
    </Panneau>
  );
}

const styles = StyleSheet.create({
  carte: {
    padding: Espace.m,
    gap: Espace.m,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
  },
  achats: {
    flexDirection: 'row',
    gap: Espace.s,
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
  infos: {
    flex: 1,
    gap: 1,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  description: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
});
