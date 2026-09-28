import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Building2, ScrollText, Settings, UserPlus } from 'lucide-react-native';
import { useGameState } from '@/context/GameStateContext';
import Colors, { Charte, Fonts } from '@/constants/Colors';
import NotificationBadge from '@/components/NotificationBadge';
import EnTete from '@/components/EnTete';
import CerfaEcran from '@/components/CerfaEcran';
import FinActeModal from '@/components/FinActeModal';
import FichePoste from '@/components/FichePoste';

export default function TabLayout() {
  const { pret, etat, mods, notes, notesNonVues, agents } = useGameState();

  if (!pret) return null;
  if (!etat.cerfa.signe) return <CerfaEcran />;

  const recrutablesDispo = agents.filter((a) => a.achetable).length;

  return (
    <>
      <FinActeModal />
      <FichePoste />
      <Tabs
        screenOptions={{
          header: () => <EnTete />,
          tabBarActiveTintColor: Colors.encreTexte,
          tabBarInactiveTintColor: Colors.crayon,
          tabBarStyle: {
            backgroundColor: Colors.papierChaud,
            borderTopWidth: Charte.trait,
            borderTopColor: Colors.anthracite,
            height: Platform.OS === 'ios' ? 88 : 62,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontFamily: Fonts.texteGras,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Guichet',
            tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="recruitment"
          options={{
            title: 'Recrutement',
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
            tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
