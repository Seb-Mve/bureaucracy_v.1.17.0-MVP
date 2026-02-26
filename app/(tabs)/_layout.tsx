import { Tabs, SplashScreen } from 'expo-router';
import { Platform, View, Pressable } from 'react-native';
import { useFonts, ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Building as BuildingOffice2, ChartBar, Settings, Menu, ScrollText, Paperclip } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import NotificationBadge from '@/components/NotificationBadge';
import ToastContainer from '@/components/ToastContainer';
import JournalDrawer from '@/components/JournalDrawer';
import MenuBottomSheet, { MenuItem } from '@/components/MenuBottomSheet';
import PrestigeShopModal from '@/components/PrestigeShopModal';
import Colors from '@/constants/Colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { gameState, canPurchaseAgent } = useGameState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [prestigeShopOpen, setPrestigeShopOpen] = useState(false);

  // Menu items — add new entries here as features grow
  const menuItems: MenuItem[] = [
    {
      id: 'prestige-shop',
      icon: <Paperclip size={20} color={Colors.success} />,
      label: 'Boutique de Prestige',
      description: 'Améliorations temporaires avec Trombones',
      onPress: () => setPrestigeShopOpen(true),
    },
    {
      id: 'journal',
      icon: <ScrollText size={20} color={Colors.resourceTampons} />,
      label: 'Journal S.I.C.',
      description: 'Messages du Service Inconnu de Coordination',
      onPress: () => setJournalOpen(true),
    },
  ];
  const [fontsLoaded, fontError] = useFonts({
    'ArchivoBlack-Regular': ArchivoBlack_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Calculate notifications
  const unlockedAdmins = gameState.administrations.filter(admin => admin.isUnlocked);
  const purchasableAgentsCount = unlockedAdmins.reduce((count, admin) => {
    return count + admin.agents.filter(agent => canPurchaseAgent(admin.id, agent.id)).length;
  }, 0);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  const tabBarHeight = Platform.OS === 'ios' ? 90 : 65;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 30 : 10;

  return (
    <>
      {/* Toast notifications - visible on all tabs */}
      <ToastContainer />
      
      {/* Menu bottom sheet */}
      <MenuBottomSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
      />

      {/* Journal modal — full-screen, opened from menu */}
      <JournalDrawer
        isOpen={journalOpen}
        onClose={() => setJournalOpen(false)}
        entries={gameState.journal}
      />
      
      {/* Prestige Shop modal — full-screen, opened from menu */}
      <PrestigeShopModal
        visible={prestigeShopOpen}
        onClose={() => setPrestigeShopOpen(false)}
      />
      
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: '#4b6c8c',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#f9edcd',
          borderTopColor: '#e0d5b8',
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          opacity: 0.95,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 12,
          marginTop: -5,
          marginBottom: 5,
        },
        headerStyle: {
          backgroundColor: '#f9edcd',
          borderBottomColor: '#e0d5b8',
          borderBottomWidth: 1,
          opacity: 0.95,
        },
        headerTitleStyle: {
          fontFamily: 'ArchivoBlack-Regular',
          color: '#4b6c8c',
          fontSize: 22,
        },
        headerTitle: 'BUREAUCRACY++',
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={{
              marginLeft: 16,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le menu"
          >
            <Menu size={24} color={Colors.title} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bureau',
          tabBarIcon: ({ color, size }) => (
            <View>
              <BuildingOffice2 size={size} color={color} />
              <NotificationBadge count={purchasableAgentsCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progression"
        options={{
          title: 'Progression',
          tabBarIcon: ({ color, size }) => (
            <ChartBar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: 'Options',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}