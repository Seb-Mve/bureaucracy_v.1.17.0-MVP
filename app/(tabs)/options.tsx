import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import { formatEntier, formatPourcent } from '@/utils/formatters';
import Panneau from '@/components/charte/Panneau';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import ReglementInterieur from '@/components/ReglementInterieur';
import ReglagesConfort from '@/components/ReglagesConfort';
import Confirmation from '@/components/charte/Confirmation';
import Hud from '@/components/Hud';

function dureeJeu(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
}

/** Options : dossier administratif, règlement intérieur, confort, démission, remise à zéro. */
export default function OptionsScreen() {
  const { etat, grade, deposerDemission, nouvellePartie, marquerFichePoste, mods, conformite } = useGameState();
  const [demande, setDemande] = useState<'demission' | 'effacer' | null>(null);
  const deposee = etat.demission.deposeeLe !== null;
  const agent = etat.cerfa.prenom || 'Agent sans prénom';

  const lignes: [string, string][] = [
    ['Agent', agent],
    ['Grade', grade.nom],
    ['Prime d’avancement', grade.rang > 0 ? `+${Math.round(grade.bonus * 100)} % de dotation` : 'Néant'],
    ['Affectation', 'Guichet 3'],
    // Même mot, même grandeur que l'en-tête : un tampon apposé = un dossier traité.
    ['Tampons apposés', formatEntier(etat.tampons)],
    ['Dossiers rejetés', formatEntier(Math.floor(etat.stats.rejetes))],
    ['Usagers perdus (abandons)', formatEntier(Math.floor(etat.abandons))],
    // Même grandeur que le tableau des ressources : la Conformité, inconnue avant l'audit.
    [
      'Avancement de l’acte',
      mods.conformiteVisible ? `Conformité ${formatPourcent(conformite)} % (à 100 %, la note n° 22 clôt l’acte)` : 'Non encore audité',
    ],
    ['Temps de service', dureeJeu(etat.stats.tempsDeJeu)],
  ];

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView style={styles.defilement} contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Dossier administratif</Text>
        <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
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
        <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
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
                taille={Typo.titre}
                hauteur={54}
                couleur={Colors.carton}
                couleurOmbre={Colors.crayonClair}
                couleurTexte={Colors.anthracite}
                onPress={() => setDemande('demission')}
              />
            </>
          )}
        </Panneau>

        <Text style={styles.titre}>Remise à zéro</Text>
        <Panneau contenuStyle={styles.fiche} rayon={Charte.rayon}>
          <Text style={styles.texte}>Efface la partie en cours et recommence au Cerfa d’embauche.</Text>
          <Pressable
            style={({ pressed }) => [styles.danger, pressed && styles.presse]}
            accessibilityRole="button"
            accessibilityLabel="Effacer la partie"
            onPress={() => setDemande('effacer')}
          >
            <Text style={styles.dangerTexte}>Effacer la partie</Text>
          </Pressable>
        </Panneau>

        <Confirmation
          visible={demande === 'demission'}
          titre="Déposer votre démission ?"
          message="Votre demande sera transmise au Service Inconnu de Coordination."
          libelleConfirmer="Déposer"
          onAnnuler={() => setDemande(null)}
          onConfirmer={() => {
            setDemande(null);
            deposerDemission();
          }}
        />
        <Confirmation
          visible={demande === 'effacer'}
          titre="Effacer la partie ?"
          message="Toute votre progression sera perdue. Cette action est définitive."
          libelleConfirmer="Effacer"
          destructive
          onAnnuler={() => setDemande(null)}
          onConfirmer={() => {
            setDemande(null);
            nouvellePartie();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  defilement: {
    flex: 1,
  },
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
    marginTop: Espace.s,
  },
  fiche: {
    padding: Espace.m,
    gap: Espace.s,
    backgroundColor: Colors.papierChaud,
  },
  ligne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: Espace.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.carton,
    paddingBottom: Espace.xs,
  },
  cle: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.crayon,
  },
  valeur: {
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
  cerfa: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.micro,
    color: Colors.crayon,
  },
  texte: {
    fontFamily: Fonts.texte,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  aide: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
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
    marginTop: Espace.xs,
  },
  relireTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
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
    fontSize: Typo.corps,
    color: Colors.rougeTexte,
  },
});
