import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, ScrollText, Settings, UserPlus } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import EnTete from '@/components/EnTete';
import CerfaEcran from '@/components/CerfaEcran';
import FinActeModal from '@/components/FinActeModal';
import FichePoste from '@/components/FichePoste';
import AideModal from '@/components/AideModal';
import { ongletsVisibles } from '@/components/raccourcis';

/** Hauteur de la barre d'onglets hors marge du bas (icône + libellé). */
const HAUTEUR_ONGLETS = 58;

export default function TabLayout() {
  const { pret, etat, mods, notes, notesNonVues, agents, acheterRamettes, demandeLimitante } = useGameState();
  const [aide, setAide] = useState(false);
  const router = useRouter();
  // La barre d'onglets s'arrête au-dessus de la barre d'accueil de l'iPhone (marge du bas réelle, web compris).
  const { bottom } = useSafeAreaInsets();

  // Raccourcis clavier (web) : 1 à 4 pour les onglets, R pour une ramette, ? pour l'aide.
  // La liste affichée dans l'aide est dans components/raccourcis.ts ; Espace est géré par TAMPONNER.
  const contexte = useRef({ mods, notes: notes.length, acheterRamettes, router });
  contexte.current = { mods, notes: notes.length, acheterRamettes, router };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))) return;
      if (document.querySelector('[aria-modal="true"]') && e.key !== 'Escape') return;
      const c = contexte.current;
      // Les touches suivent les onglets visibles : « 2 » est le 2e onglet affiché, quel qu'il soit.
      const onglets = ongletsVisibles(c.mods.recrutementVisible, c.notes > 0);
      const n = Number(e.key);
      if (n >= 1 && n <= onglets.length) c.router.navigate(onglets[n - 1].route);
      else if ((e.key === 'r' || e.key === 'R') && c.mods.recrutementVisible) c.acheterRamettes(1);
      else if (e.key === '?') setAide(true);
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, []);

  if (!pret) return null;
  if (!etat.cerfa.signe) return <CerfaEcran />;

  // Quand la demande limite, la pastille n'invite plus à recruter : ce serait de l'argent perdu.
  const recrutablesDispo = demandeLimitante ? 0 : agents.filter((a) => a.achetable).length;

  return (
    <>
      <FinActeModal />
      <FichePoste />
      <AideModal visible={aide} onFermer={() => setAide(false)} />
      <Tabs
        screenOptions={{
          header: () => <EnTete onAide={() => setAide(true)} />,
          // Libellé toujours sous l'icône : sur grand écran, la barre le mettrait à côté et le couperait (colonne de 480).
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: Colors.encreTexte,
          tabBarInactiveTintColor: Colors.crayon,
          tabBarStyle: {
            backgroundColor: Colors.papierChaud,
            borderTopWidth: Charte.trait,
            borderTopColor: Colors.anthracite,
            height: HAUTEUR_ONGLETS + Math.max(bottom, Espace.xs),
            paddingTop: Espace.xs,
            paddingBottom: Math.max(bottom, Espace.xs),
          },
          tabBarLabelStyle: {
            fontFamily: Fonts.texteGras,
            fontSize: Typo.micro,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Guichet',
            tabBarAccessibilityLabel: 'Guichet',
            tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="recruitment"
          options={{
            title: 'Recrutement',
            tabBarAccessibilityLabel:
              recrutablesDispo > 0 ? `Recrutement, ${recrutablesDispo} recrutement possible` : 'Recrutement',
            href: mods.recrutementVisible ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <View>
                <UserPlus size={size} color={color} />
                <NotificationBadge count={recrutablesDispo} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarAccessibilityLabel: notesNonVues > 0 ? `Notes, ${notesNonVues} nouvelle${notesNonVues > 1 ? 's' : ''}` : 'Notes',
            href: notes.length > 0 ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <View>
                <ScrollText size={size} color={color} />
                <NotificationBadge count={notesNonVues} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="options"
          options={{
            title: 'Options',
            tabBarAccessibilityLabel: 'Options',
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
