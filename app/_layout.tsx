import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_600SemiBold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { RobotoMono_500Medium, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import GameStateProvider from '@/context/GameStateContext';
import PreferencesProvider from '@/context/PreferencesContext';
import Colors from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [chargees, erreur] = useFonts({
    'Fredoka-SemiBold': Fredoka_600SemiBold,
    'Fredoka-Bold': Fredoka_700Bold,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'RobotoMono-Medium': RobotoMono_500Medium,
    'RobotoMono-Bold': RobotoMono_700Bold,
  });

  useEffect(() => {
    if (chargees || erreur) SplashScreen.hideAsync();
  }, [chargees, erreur]);

  if (!chargees && !erreur) return null;

  return (
    <View style={styles.fond}>
      <PreferencesProvider>
        <GameStateProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.creme } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </GameStateProvider>
      </PreferencesProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
});
