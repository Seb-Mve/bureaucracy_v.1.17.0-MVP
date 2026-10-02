import React, { useEffect, useRef } from 'react';
import {
  Platform,
  type StyleProp,
  type ViewStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import BoutonPoussoir from '@/components/charte/BoutonPoussoir';
import { formatMontant } from '@/utils/formatters';

/** Un champ de saisie ou une fenêtre ouverte garde la barre d'espace pour lui. */
function espaceLibre(e: KeyboardEvent): boolean {
  const cible = e.target as HTMLElement | null;
  if (
    cible &&
    (cible.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))
  )
    return false;
  return document.querySelector('[aria-modal="true"]') === null;
}

/**
 * Le bouton TAMPONNER et ce qu'il faut savoir juste au-dessus : stock bas ou rupture,
 * avec l'achat d'une ramette à portée de pouce. Le gain d'un coup se lit dans les compteurs.
 */
export default function BoutonTamponner() {
  const {
    tamponner,
    enAttente,
    etat,
    mods,
    stockBas,
    prixRamette,
    acheterRamettes,
    demanderRequisition,
    notes,
  } = useGameState();
  const router = useRouter();
  const focalise = useIsFocused();
  // Petit écran : bouton et alerte un peu moins hauts, pour laisser la place à la scène.
  const compact = useWindowDimensions().height < 720;
  const action = useRef(tamponner);
  action.current = tamponner;

  const rupture = etat.formulaires < mods.pieces;
  const vide = enAttente < 1;
  // Petit écran : l'alerte ne s'empile pas au-dessus du bouton, son action se range à côté de lui
  // (la cause se lit sur le bouton et dans le compteur Formulaires, en rouge).
  const libelleRupture = compact ? 'RUPTURE' : 'RUPTURE DE FORMULAIRES';
  const libelle = rupture
    ? libelleRupture
    : vide
      ? 'AUCUN DOSSIER'
      : 'TAMPONNER';
  const achatPossible = etat.budget >= prixRamette;
  const prix = `${formatMontant(prixRamette)}`;

  // Web : la barre d'espace tamponne (un appui = un coup).
  useEffect(() => {
    if (Platform.OS !== 'web' || !focalise) return;
    // Sur le Guichet, Espace tamponne toujours, même si un bouton (« + » du rejet…) a gardé le focus :
    // on l'intercepte avant lui et on retire le focus, sinon le navigateur « recliquerait » ce bouton.
    const surTouche = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !espaceLibre(e)) return;
      e.preventDefault();
      e.stopPropagation();
      const focus = document.activeElement as HTMLElement | null;
      if (focus && focus.tagName === 'BUTTON') focus.blur();
      if (!e.repeat) action.current();
    };
    const bloquerRelache = (e: KeyboardEvent) => {
      if (e.code === 'Space' && espaceLibre(e)) e.preventDefault();
    };
    document.addEventListener('keydown', surTouche, true);
    document.addEventListener('keyup', bloquerRelache, true);
    return () => {
      document.removeEventListener('keydown', surTouche, true);
      document.removeEventListener('keyup', bloquerRelache, true);
    };
  }, [focalise]);

  // Chaque alerte de stock dit la cause et offre l'action qui s'en sort, en un geste. Texte court (une ligne
  // sur un petit écran) ; le détail est lu par le lecteur d'écran.
  type Action = { libelle: string; lu: string; faire: () => void };
  let alerte: { texte: string; detail: string; action: Action | null } | null =
    null;
  if (rupture || stockBas) {
    const cause = rupture ? 'Plus de formulaires' : 'Stock bas';
    if (!mods.recrutementVisible) {
      alerte = {
        texte: `${cause} : visez la note n° 1.`,
        detail: 'La note de service n° 1 permet de commander des ramettes.',
        action:
          notes.length > 0
            ? {
                libelle: 'Voir la note n° 1',
                lu: 'Ouvrir les notes de service',
                faire: () => router.push('/notes'),
              }
            : null,
      };
    } else if (achatPossible) {
      alerte = {
        texte: `${cause}.`,
        detail: `Une ramette de formulaires coûte ${prix}.`,
        action: {
          libelle: `1 ramette · ${prix}`,
          lu: `Acheter une ramette, ${prix}`,
          faire: () => acheterRamettes(1),
        },
      };
    } else if (rupture) {
      alerte = {
        texte: 'Plus de formulaires ni de budget.',
        detail: `Une ramette coûte ${prix} : le service peut en fournir une gratuitement.`,
        action: {
          libelle: 'Réquisition',
          lu: 'Demander une ramette de réquisition, gratuite',
          faire: demanderRequisition,
        },
      };
    } else {
      alerte = {
        texte: `${cause} : ramette à ${prix}.`,
        detail: 'La dotation des prochains dossiers suffira à en acheter une.',
        action: null,
      };
    }
  }

  const actionACote = compact && alerte?.action ? alerte.action : null;
  const boutonAction = (a: Action, style?: StyleProp<ViewStyle>) => (
    <Pressable
      onPress={a.faire}
      style={({ pressed }) => [styles.achat, style, pressed && styles.presse]}
      accessibilityRole="button"
      accessibilityLabel={alerte ? `${alerte.texte} ${a.lu}` : a.lu}
    >
      <Text style={styles.achatTexte}>{a.libelle}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.zone, compact && styles.zoneCompacte]}>
      {alerte !== null && actionACote === null && (
        <View
          style={[
            styles.alerte,
            compact && styles.alerteCompacte,
            rupture ? styles.alerteRupture : styles.alerteBas,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text
            style={[styles.alerteTexte, rupture && styles.alerteTexteRupture]}
            accessibilityLabel={`${alerte.texte} ${alerte.detail}`}
          >
            {alerte.texte}
          </Text>
          {alerte.action && boutonAction(alerte.action)}
        </View>
      )}
      <View style={styles.rangee}>
        <BoutonPoussoir
          libelle={libelle}
          onPress={tamponner}
          repetition
          hauteur={compact ? 54 : 66}
          taille={libelle === 'TAMPONNER' ? Typo.grand : Typo.titre}
          couleur={rupture || vide ? Colors.carton : Colors.encre}
          couleurOmbre={
            rupture || vide ? Colors.crayonClair : Colors.encreFlanc
          }
          couleurTexte={rupture || vide ? Colors.crayon : Colors.anthracite}
          accessibilityLabel="Tamponner un dossier"
          accessibilityHint={
            rupture
              ? `Plus de formulaires : voir l’alerte ${actionACote ? 'à côté' : 'juste au-dessus'}`
              : vide
                ? 'Aucun dossier en attente'
                : 'Maintenir pour tamponner en continu'
          }
          style={styles.poussoir}
        />
        {actionACote &&
          boutonAction(
            actionACote,
            rupture ? styles.achatRupture : styles.achatBas,
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: Espace.m,
    paddingTop: Espace.s,
    paddingBottom: Espace.s,
    gap: Espace.s,
  },
  rangee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.s,
  },
  poussoir: {
    flex: 1,
  },
  /** Action d'alerte rangée à côté du bouton : son fond dit l'urgence (rouge en rupture). */
  achatRupture: {
    borderColor: Colors.rougeTexte,
    borderWidth: Charte.trait,
  },
  achatBas: {
    borderColor: Colors.encreTexte,
    borderWidth: Charte.trait,
  },
  alerte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace.m,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    borderRadius: Charte.rayonPetit,
    paddingLeft: Espace.m,
    paddingRight: Espace.xs,
    paddingVertical: Espace.xs,
    minHeight: 52,
  },
  zoneCompacte: {
    paddingTop: Espace.xs,
    gap: Espace.xs,
  },
  alerteCompacte: {
    minHeight: 44,
    paddingVertical: 0,
  },
  alerteBas: {
    backgroundColor: Colors.encreFond,
  },
  alerteRupture: {
    backgroundColor: Colors.rougeFond,
  },
  alerteTexte: {
    flex: 1,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.petit,
    color: Colors.encreTexte,
  },
  alerteTexteRupture: {
    color: Colors.rougeTexte,
  },
  achat: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Espace.m,
    borderRadius: Charte.rayonPetit,
    borderWidth: Charte.traitFin,
    borderColor: Colors.anthracite,
    backgroundColor: Colors.vert,
  },
  presse: {
    transform: [{ translateY: 2 }],
  },
  achatTexte: {
    fontFamily: Fonts.chiffres,
    fontSize: Typo.petit,
    color: Colors.anthracite,
  },
});
