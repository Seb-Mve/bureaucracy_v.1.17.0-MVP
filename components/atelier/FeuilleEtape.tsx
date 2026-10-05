import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, CircleCheck, X } from 'lucide-react-native';
import {
  useFermetureEchap,
  useGameState,
  type ActionAtelier,
  type EtapeType,
  type ProcId,
  type VueAtelier,
} from '@/context/GameStateContext';
import Colors, {
  Charte,
  Espace,
  Fonts,
  Interligne,
  Typo,
} from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { Effets, IconeEtape } from '@/components/atelier/Elements';
import ChoixVerrouille from '@/components/atelier/ChoixVerrouille';

/** Ce que demande la feuille : une étape à ajouter, ou la procédure qu'exige une pièce de service. */
export type ModeFeuille =
  | { type: 'ajouter'; p: ProcId }
  | { type: 'exiger'; p: ProcId; k: number; actuelle: ProcId | null };

interface FeuilleEtapeProps {
  mode: ModeFeuille | null;
  atelier: VueAtelier;
  onFermer: () => void;
  onValider: (action: ActionAtelier) => void;
}

interface ChoixProps {
  libelle: string;
  detail?: string;
  choisi: boolean;
  onPress: () => void;
  icone?: React.ReactNode;
  pied?: React.ReactNode;
}

/** Une ligne à choisir (bouton radio) : coche et bord épais en plus de la couleur. */
function Choix({ libelle, detail, choisi, onPress, icone, pied }: ChoixProps) {
  const { encre } = useGameState();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: choisi }}
      accessibilityLabel={detail ? `${libelle}. ${detail}` : libelle}
      style={({ pressed }) => [
        styles.choix,
        choisi && styles.choixRetenu,
        choisi && { backgroundColor: encre.fond, borderLeftColor: encre.face },
        pressed && styles.presse,
      ]}
    >
      {icone}
      <View style={styles.choixTexte}>
        <Text style={styles.choixNom}>{libelle}</Text>
        {detail ? <Text style={styles.choixDetail}>{detail}</Text> : null}
        {pied}
      </View>
      {choisi ? (
        <CircleCheck size={22} color={Colors.anthracite} />
      ) : (
        <Circle size={22} color={Colors.crayonClair} />
      )}
    </Pressable>
  );
}

/**
 * Feuille qui monte du bas (comme le courrier) : catalogue de toutes les étapes (celles qu'aucune note n'a
 * encore réglementées sont grisées), puis le document exigé.
 */
export default function FeuilleEtape({
  mode,
  atelier,
  onFermer,
  onValider,
}: FeuilleEtapeProps) {
  const { encre } = useGameState();
  const [etape, setEtape] = useState<EtapeType | null>(null);
  const [exige, setExige] = useState<ProcId | null>(null);
  useEffect(() => {
    setEtape(mode?.type === 'exiger' ? 'pieceService' : null);
    setExige(mode?.type === 'exiger' ? mode.actuelle : null);
  }, [mode]);
  const visible = mode !== null;
  useFermetureEchap(visible, onFermer);

  const proc = mode
    ? atelier.procedures.find((p) => p.id === mode.p)
    : undefined;
  const avecExige = etape === 'pieceService';
  // Exiger la procédure déjà exigée ne changerait rien : le bouton reste éteint.
  const inchange = mode?.type === 'exiger' && exige === mode.actuelle;
  const valide = etape !== null && (!avecExige || exige !== null) && !inchange;

  const documentExige = proc ? (
    <View
      style={[styles.groupe, mode?.type === 'ajouter' && styles.retrait]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Document exigé"
    >
      <Text style={styles.sousTitre}>Document exigé</Text>
      {proc.exigeables.map((q) => (
        <Choix
          key={q.id}
          libelle={q.nom}
          choisi={exige === q.id}
          onPress={() => setExige(q.id)}
        />
      ))}
    </View>
  ) : null;

  const valider = () => {
    if (!mode || !etape) return;
    if (mode.type === 'exiger') {
      if (exige) onValider({ type: 'exiger', p: mode.p, k: mode.k, exige });
      return;
    }
    if (etape === 'pieceService') {
      if (exige) onValider({ type: 'ajouter', p: mode.p, etape, exige });
      return;
    }
    onValider({ type: 'ajouter', p: mode.p, etape });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onFermer}
    >
      <View style={styles.voile}>
        {/* Toucher le voile, au-dessus de la feuille, ferme comme la croix. */}
        <Pressable
          style={styles.zoneVoile}
          onPress={onFermer}
          accessible={false}
        />
        <SafeAreaView edges={['bottom']} style={styles.feuille}>
          <View style={styles.entete}>
            <Text style={styles.titre}>
              {mode?.type === 'exiger' ? 'Justificatif exigé' : 'Ajouter une étape'}
            </Text>
            <Pressable
              onPress={onFermer}
              style={styles.fermer}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={22} color={Colors.anthracite} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.corps}>
            {mode?.type === 'ajouter' && (
              <View
                style={styles.groupe}
                accessibilityRole="radiogroup"
                accessibilityLabel="Étape"
              >
                {atelier.catalogue.map((c) =>
                  c.disponible ? (
                    <React.Fragment key={c.type}>
                      <Choix
                        libelle={c.nom}
                        detail={c.description}
                        choisi={etape === c.type}
                        onPress={() => setEtape(c.type)}
                        icone={<IconeEtape type={c.type} />}
                        pied={<Effets effets={c.effets} />}
                      />
                      {/* Le document exigé se choisit juste sous la pièce de service, sans défiler. */}
                      {c.type === 'pieceService' && avecExige && documentExige}
                    </React.Fragment>
                  ) : (
                    <ChoixVerrouille key={c.type} choix={c} />
                  ),
                )}
              </View>
            )}
            {mode?.type === 'exiger' && documentExige}
          </ScrollView>
          {/* Le bouton reste sous la liste, hors du défilement : toujours atteignable sur petit écran. */}
          <View style={styles.pied}>
            <BoutonPoussoir
              libelle={
                mode?.type === 'exiger'
                  ? 'EXIGER CE JUSTIFICATIF'
                  : 'AJOUTER L’ÉTAPE'
              }
              taille={Typo.titre}
              hauteur={56}
              couleur={encre.face}
              couleurOmbre={encre.flanc}
              desactive={!valide}
              onPress={valider}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    backgroundColor: Colors.voile,
    justifyContent: 'flex-end',
  },
  zoneVoile: {
    flex: 1,
    minHeight: Espace.xxl * 3,
  },
  feuille: {
    maxHeight: '92%',
    width: '100%',
    maxWidth: Charte.largeurColonne,
    alignSelf: 'center',
    borderTopLeftRadius: Charte.rayon,
    borderTopRightRadius: Charte.rayon,
    borderTopWidth: Charte.trait,
    borderColor: Colors.anthracite,
    overflow: 'hidden',
    backgroundColor: Colors.carton,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espace.l,
    paddingVertical: Espace.m,
    borderBottomWidth: Charte.trait,
    borderBottomColor: Colors.anthracite,
    backgroundColor: Colors.creme,
  },
  titre: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  fermer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corps: {
    padding: Espace.l,
    gap: Espace.m,
  },
  pied: {
    paddingHorizontal: Espace.l,
    paddingTop: Espace.m,
    paddingBottom: Espace.l,
    borderTopWidth: Charte.traitFin,
    borderTopColor: Colors.anthracite,
    backgroundColor: Colors.carton,
  },
  groupe: {
    gap: Espace.s,
  },
  /** Le document exigé, en retrait sous la pièce de service. */
  retrait: {
    marginLeft: Espace.xl,
  },
  sousTitre: {
    fontFamily: Fonts.titre,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  choix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    minHeight: 44,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    backgroundColor: Colors.papier,
    paddingHorizontal: Espace.m,
    paddingVertical: Espace.s,
  },
  choixRetenu: {
    borderLeftWidth: Espace.xs + 2,
  },
  choixTexte: {
    flex: 1,
    gap: 2,
  },
  choixNom: {
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.anthracite,
  },
  choixDetail: {
    fontFamily: Fonts.texte,
    fontSize: Typo.petit,
    lineHeight: Interligne.petit,
    color: Colors.crayon,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
});
