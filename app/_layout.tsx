import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import GameStateProvider from '@/context/GameStateContext';
import { ImageBackground, StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ImageBackground 
      source={{ uri: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <GameStateProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </GameStateProvider>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f9edcd', // Fallback color while image loads
  },
});