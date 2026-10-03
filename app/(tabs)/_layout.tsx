import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, ScrollText, Settings, UserPlus } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Espace, Fonts, Typo } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import EnTete from '@/components/EnTete';
import CerfaEcran from '@/components/CerfaEcran';
import FinActeModal from '@/components/FinActeModal';
import FichePoste from '@/components/FichePoste';

/** Hauteur de la barre d'onglets hors marge du bas (icône + libellé). */
const HAUTEUR_ONGLETS = 58;

export default function TabLayout() {
  const { pret, etat, mods, notes, notesNonVues, agents, demandeLimitante } = useGameState();
  // La barre d'onglets s'arrête au-dessus de la barre d'accueil de l'iPhone (marge du bas réelle, web compris).
  const { bottom } = useSafeAreaInsets();

  if (!pret) return null;
  if (!etat.cerfa.signe) return <CerfaEcran />;

  // Quand la demande limite, la pastille n'invite plus à recruter : ce serait de l'argent perdu.
  const recrutablesDispo = demandeLimitante ? 0 : agents.filter((a) => a.achetable).length;
  // Rupture de formulaires : un « ! » sur l'onglet où s'en procurer (Service, ou Notes avant la note n° 1).
  const rupture = etat.formulaires < mods.pieces;
  const ruptureService = rupture && mods.recrutementVisible;
  const ruptureNotes = rupture && !mods.recrutementVisible;

  return (
    <>
      <FinActeModal />
      <FichePoste />
      <Tabs
        screenOptions={{
          header: () => <EnTete />,
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
            title: 'Service',
            tabBarAccessibilityLabel: ruptureService
              ? 'Service, plus de formulaires'
              : recrutablesDispo > 0
                ? `Service, ${recrutablesDispo} recrutement possible`
                : 'Service',
            href: mods.recrutementVisible ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <View>
                <UserPlus size={size} color={color} />
                <NotificationBadge count={recrutablesDispo} alerte={ruptureService} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarAccessibilityLabel: ruptureNotes
              ? 'Notes, plus de formulaires'
              : notesNonVues > 0
                ? `Notes, ${notesNonVues} nouvelle${notesNonVues > 1 ? 's' : ''}`
                : 'Notes',
            href: notes.length > 0 ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <View>
                <ScrollText size={size} color={color} />
                <NotificationBadge count={notesNonVues} alerte={ruptureNotes} />
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
