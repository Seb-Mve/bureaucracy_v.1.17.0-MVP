import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useGameState,
  type ActionAtelier,
  type ProcId,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import Hud from '@/components/Hud';
import Panneau from '@/components/charte/Panneau';
import SelecteurProcedure from '@/components/atelier/SelecteurProcedure';
import FicheEtape from '@/components/atelier/FicheEtape';
import BilanProcedure from '@/components/atelier/BilanProcedure';
import ReleveProduction from '@/components/direction/ReleveProduction';
import FeuilleEtape, {
  type ModeFeuille,
} from '@/components/atelier/FeuilleEtape';
import { Trombone, TromboneFerme } from '@/components/atelier/Elements';

/**
 * Atelier des procédures (acte II) : une procédure par écran, ses demandes et documents délivrés, son bilan, ses
 * étapes en fiches reliées par des trombones, et au pied le relevé « Production du service ».
 * Une modification s'applique aussitôt. Quand des procédures s'exigent mutuellement, une carte neutre les relie
 * par un trombone fermé ; rien ne la nomme « boucle ».
 */
export default function EcranAtelier() {
  const { atelier, production, modifierProcedure, encre } = useGameState();
  const [choisie, setChoisie] = useState<ProcId>('identite');
  const [feuille, setFeuille] = useState<ModeFeuille | null>(null);
  const fermer = useCallback(() => setFeuille(null), []);
  const valider = useCallback(
    (action: ActionAtelier) => {
      modifierProcedure(action);
      setFeuille(null);
    },
    [modifierProcedure],
  );

  if (!atelier) return null;
  const proc =
    atelier.procedures.find((p) => p.id === choisie) ?? atelier.procedures[0];
  const n = proc.etapes.length;

  return (
    <View style={styles.ecran}>
      <Hud />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Atelier des procédures</Text>
        <SelecteurProcedure
          procedures={atelier.procedures}
          choisie={proc.id}
          onChoisir={setChoisie}
        />
        <BilanProcedure
          proc={proc}
          ligne={production?.find((l) => l.id === proc.id)}
        />
        <View>
          {proc.etapes.map((e, k) => (
            <View key={`${proc.id}-${k}-${e.type}-${e.exige ?? ''}`}>
              {k > 0 && <Trombone />}
              <FicheEtape
                etape={e}
                rang={k}
                total={n}
                onMonter={() =>
                  modifierProcedure({
                    type: 'deplacer',
                    p: proc.id,
                    k,
                    sens: -1,
                  })
                }
                onDescendre={() =>
                  modifierProcedure({
                    type: 'deplacer',
                    p: proc.id,
                    k,
                    sens: 1,
                  })
                }
                onRetirer={() =>
                  modifierProcedure({ type: 'retirer', p: proc.id, k })
                }
                onExiger={() =>
                  setFeuille({
                    type: 'exiger',
                    p: proc.id,
                    k,
                    actuelle: e.exige,
                  })
                }
              />
            </View>
          ))}
        </View>
        {proc.boucle.length > 0 && (
          <Panneau
            contenuStyle={[styles.boucle, { backgroundColor: encre.fond }]}
            rayon={Charte.rayon}
          >
            <TromboneFerme />
            <View style={styles.boucleTexte}>
              <Text style={styles.boucleNoms}>
                {proc.boucleNoms.join(' ⇄ ')}
              </Text>
              <Text style={styles.boucleDetail}>
                Ces procédures s’exigent mutuellement.
              </Text>
            </View>
          </Panneau>
        )}
        <Pressable
          onPress={() => setFeuille({ type: 'ajouter', p: proc.id })}
          disabled={proc.pleine}
          accessibilityRole="button"
          accessibilityLabel={`Ajouter une étape à la procédure ${proc.nom}, ${n} sur ${atelier.etapesMax}`}
          accessibilityState={{ disabled: proc.pleine }}
          style={({ pressed }) => [
            styles.ajouter,
            proc.pleine && styles.ajouterInactif,
            pressed && styles.presse,
          ]}
        >
          <Text
            style={[
              styles.ajouterTexte,
              { color: proc.pleine ? Colors.crayon : encre.texte },
            ]}
          >
            + Ajouter une étape · {n} / {atelier.etapesMax}
          </Text>
        </Pressable>
        <ReleveProduction atelier />
      </ScrollView>
      <FeuilleEtape
        mode={feuille}
        atelier={atelier}
        onFermer={fermer}
        onValider={valider}
      />
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
  boucle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    padding: Espace.m,
  },
  boucleTexte: {
    flex: 1,
    gap: 2,
  },
  boucleNoms: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  boucleDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  ajouter: {
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderStyle: 'dashed',
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espace.m,
  },
  ajouterInactif: {
    borderColor: Colors.crayonClair,
  },
  ajouterTexte: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
