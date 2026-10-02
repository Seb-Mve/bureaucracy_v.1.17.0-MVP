import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import { formatEntier } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import ReglementInterieur from '@/components/ReglementInterieur';
import ReglagesConfort from '@/components/ReglagesConfort';

function confirmer(titre: string, message: string, ok: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titre}\n\n${message}`)) ok();
    return;
  }
  Alert.alert(titre, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Confirmer', style: 'destructive', onPress: ok },
  ]);
}

function dureeJeu(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
}

/** Options : dossier administratif, règlement intérieur, confort, démission, remise à zéro. */
export default function OptionsScreen() {
  const { etat, grade, deposerDemission, nouvellePartie, marquerFichePoste } = useGameState();
  const deposee = etat.demission.deposeeLe !== null;
  const agent = etat.cerfa.prenom || 'Agent sans prénom';

  const lignes: [string, string][] = [
    ['Agent', agent],
    ['Grade', grade.nom],
    ['Prime d’avancement', grade.rang > 0 ? `+${Math.round(grade.bonus * 100)} % de dotation` : 'Néant'],
    ['Affectation', 'Guichet 3'],
    ['Dossiers traités', formatEntier(Math.floor(etat.stats.traites))],
    ['Dossiers rejetés', formatEntier(Math.floor(etat.stats.rejetes))],
    ['Coups de tampon', formatEntier(etat.stats.taps)],
    ['Temps de service', dureeJeu(etat.stats.tempsDeJeu)],
  ];

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>Dossier administratif</Text>
      <Panneau contenuStyle={styles.fiche} rayon={14}>
        {lignes.map(([k, v]) => (
          <View key={k} style={styles.ligne}>
            <Text style={styles.cle}>{k}</Text>
            <Text style={styles.valeur}>{v}</Text>
          </View>
        ))}
        <Pressable
          style={({ pressed }) => [styles.relire, pressed && styles.presse]}
          accessibilityRole="button"
          accessibilityLabel="Relire ma fiche de poste"
          onPress={() => marquerFichePoste(false)}
        >
          <Text style={styles.relireTexte}>Relire ma fiche de poste</Text>
        </Pressable>
      </Panneau>

      <Text style={styles.titre}>Règlement intérieur</Text>
      <ReglementInterieur />

      <Text style={styles.titre}>Confort</Text>
      <ReglagesConfort />

      <Text style={styles.titre}>Démission</Text>
      <Panneau contenuStyle={styles.fiche} rayon={14}>
        <Text style={styles.cerfa}>Cerfa n° 00001*02 — Demande de cessation volontaire de fonctions</Text>
        {deposee ? (
          <>
            <Text style={styles.texte}>Demande n° 000001 enregistrée.</Text>
            <Text style={styles.texte}>Délai d’instruction : indéterminé.</Text>
            <Text style={styles.aide}>Toute correspondance vous parviendra par le courrier du S.I.C.</Text>
          </>
        ) : (
          <>
            <Text style={styles.texte}>
              Je soussigné·e, {agent}, sollicite la cessation de mes fonctions au guichet 3.
            </Text>
            <BoutonPoussoir
              libelle="DÉPOSER MA DÉMISSION"
              taille={16}
              hauteur={50}
              couleur={Colors.carton}
              couleurOmbre={Colors.crayonClair}
              couleurTexte={Colors.anthracite}
              onPress={() =>
                confirmer(
                  'Déposer votre démission ?',
                  'Votre demande sera transmise au Service Inconnu de Coordination.',
                  deposerDemission,
                )
              }
            />
          </>
        )}
      </Panneau>

      <Text style={styles.titre}>Remise à zéro</Text>
      <Panneau contenuStyle={styles.fiche} rayon={14}>
        <Text style={styles.texte}>Efface la partie en cours et recommence au Cerfa d’embauche.</Text>
        <Pressable
          style={({ pressed }) => [styles.danger, pressed && styles.presse]}
          accessibilityRole="button"
          accessibilityLabel="Effacer la partie"
          onPress={() =>
            confirmer('Effacer la partie ?', 'Toute votre progression sera perdue. Cette action est définitive.', nouvellePartie)
          }
        >
          <Text style={styles.dangerTexte}>Effacer la partie</Text>
        </Pressable>
      </Panneau>
    </ScrollView>
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
    marginTop: 6,
  },
  fiche: {
    padding: 12,
    gap: 8,
    backgroundColor: Colors.papierChaud,
  },
  ligne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: 4,
  },
  cle: {
    fontFamily: Fonts.texteGras,
    fontSize: 13,
    color: Colors.crayon,
  },
  valeur: {
    fontFamily: Fonts.chiffres,
    fontSize: 13,
    color: Colors.anthracite,
  },
  cerfa: {
    fontFamily: Fonts.chiffres,
    fontSize: 11,
    color: Colors.crayon,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: 14,
    color: Colors.anthracite,
  },
  aide: {
    fontFamily: Fonts.texte,
    fontSize: 12,
    color: Colors.crayon,
  },
  relire: {
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.papier,
    marginTop: 4,
  },
  relireTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: 14,
    color: Colors.anthracite,
  },
  danger: {
    minHeight: 44,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.rouge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.rougeFond,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  dangerTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: 14,
    color: Colors.rougeTexte,
  },
});
