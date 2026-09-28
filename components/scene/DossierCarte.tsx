import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { UsagerAffiche } from '@/context/GameStateContext';
import Colors, { Fonts } from '@/constants/Colors';

interface DossierCarteProps {
  usager: UsagerAffiche | null;
  numerote: boolean;
  /** Empreinte du tampon, si le dossier vient d'être tamponné. */
  empreinte?: 'accepte' | 'rejete';
}

/** Le dossier posé sur le bureau : c'est lui que l'on tamponne. */
function DossierCarte({ usager, numerote, empreinte }: DossierCarteProps) {
  if (!usager) {
    return (
      <View style={[styles.carte, styles.vide]}>
        <Text style={styles.videTexte}>Aucun dossier sur le bureau</Text>
      </View>
    );
  }
  const nom = numerote ? `Usager n° ${usager.numero.toLocaleString('fr-FR')}` : `${usager.prenom} ${usager.nom}`;
  return (
    <View style={styles.carte}>
      <Text style={styles.numero}>DOSSIER N° {usager.numero.toLocaleString('fr-FR')}</Text>
      <Text style={styles.nom} numberOfLines={1}>
        {nom}
      </Text>
      <Text style={styles.demande} numberOfLines={1}>
        {usager.demande}
      </Text>
      {empreinte && (
        <View style={[styles.empreinte, empreinte === 'rejete' ? styles.rejet : styles.accepte]}>
          <Text style={[styles.empreinteTexte, { color: empreinte === 'rejete' ? Colors.rouge : Colors.vertEncre }]}>
            {empreinte === 'rejete' ? 'REJETÉ' : 'ACCEPTÉ'}
          </Text>
        </View>
      )}
    </View>
  );
}

export default memo(DossierCarte);

const styles = StyleSheet.create({
  carte: {
    width: 158,
    height: 64,
    backgroundColor: '#FFFEF9',
    borderWidth: 2,
    borderColor: Colors.anthracite,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  vide: {
    backgroundColor: 'rgba(255,254,249,0.7)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  videTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: 10,
    color: Colors.crayon,
  },
  numero: {
    fontFamily: Fonts.chiffres,
    fontSize: 8,
    color: Colors.crayon,
  },
  nom: {
    fontFamily: Fonts.texteGras,
    fontSize: 12,
    color: Colors.anthracite,
  },
  demande: {
    fontFamily: Fonts.texte,
    fontSize: 10,
    color: Colors.crayon,
  },
  empreinte: {
    position: 'absolute',
    right: 6,
    top: 14,
    borderWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 5,
    transform: [{ rotate: '-14deg' }],
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  rejet: {
    borderColor: Colors.rouge,
  },
  accepte: {
    borderColor: Colors.vertEncre,
  },
  empreinteTexte: {
    fontFamily: Fonts.titreGras,
    fontSize: 15,
    letterSpacing: 1.5,
  },
});
