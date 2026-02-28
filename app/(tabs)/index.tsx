import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResourceBar from '@/components/ResourceBar';
import StampButton from '@/components/StampButton';
import AdministrationCard from '@/components/AdministrationCard';
import ConformiteDisplay from '@/components/ConformiteDisplay';
import AdminContentSection from '@/components/AdminContentSection';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function BureauScreen() {
  const { gameState, setActiveAdministration } = useGameState();
  const { administrations, activeAdministrationId } = gameState;
  const scrollViewRef = useRef<ScrollView>(null);
  const [dossierTapSignal, setDossierTapSignal] = useState(0);
  const handleStampTap = useCallback(() => setDossierTapSignal(s => s + 1), []);

  const handleAdministrationPress = (administrationId: string) => {
    setActiveAdministration(administrationId);

    const index = administrations.findIndex(admin => admin.id === administrationId);

    if (scrollViewRef.current && index !== -1) {
      scrollViewRef.current.scrollTo({ x: index * (300 + 20), animated: true });
    }
  };

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (300 + 20));
    const admin = administrations[index];
    if (admin) setActiveAdministration(admin.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ResourceBar dossierTapSignal={dossierTapSignal} />

      {/* Conformité display (appears when unlocked) */}
      <ConformiteDisplay />

      <View style={styles.mainContent}>
        <View style={styles.scrollContainer}>
          <ScrollView>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={300 + 20}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollViewContent}
              onMomentumScrollEnd={handleMomentumScrollEnd}
            >
              {administrations.map((administration) => (
                <AdministrationCard
                  key={administration.id}
                  administration={administration}
                  isActive={administration.id === activeAdministrationId}
                  onPress={() => handleAdministrationPress(administration.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.additionalContent}>
              <AdminContentSection />
            </View>
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <StampButton onTap={handleStampTap} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: (width - 300) / 2,
    paddingBottom: 20,
  },
  additionalContent: {
    padding: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    backgroundColor: 'rgba(249, 237, 205, 0.9)',
    paddingTop: 11,
    borderTopWidth: 0,
    borderTopColor: Colors.border,
  },
});
