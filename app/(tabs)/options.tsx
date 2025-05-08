import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Save, Trash2, Volume2, Vibrate } from 'lucide-react-native';

export default function OptionsScreen() {
  const { gameState } = useGameState();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  
  const handleResetGame = async () => {
    const confirmReset = () => {
      // Clear game storage
      AsyncStorage.removeItem('bureaucracy_game_state')
        .then(() => {
          // Reload the app
          if (Platform.OS === 'web') {
            window.location.reload();
          } else {
            // For mobile, we would use a different approach
            // but for this example we'll just show an alert
            Alert.alert('Jeu réinitialisé', 'Veuillez redémarrer l\'application');
          }
        })
        .catch(error => {
          console.error('Erreur lors de la réinitialisation:', error);
        });
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tout votre progrès?')) {
        confirmReset();
      }
    } else {
      Alert.alert(
        'Réinitialiser le jeu',
        'Êtes-vous sûr de vouloir réinitialiser tout votre progrès?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Réinitialiser', onPress: confirmReset, style: 'destructive' }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Options</Text>
      </View>
      
      <View style={styles.settingGroup}>
        <Text style={styles.settingGroupTitle}>Paramètres</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Volume2 size={20} color={Colors.textLight} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Son</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#d1d1d1', true: Colors.buttonPrimary }}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Vibrate size={20} color={Colors.textLight} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Retour haptique</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: '#d1d1d1', true: Colors.buttonPrimary }}
          />
        </View>
      </View>
      
      <View style={styles.settingGroup}>
        <Text style={styles.settingGroupTitle}>Jeu</Text>
        
        <TouchableOpacity style={styles.button}>
          <Save size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Sauvegarder</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]}
          onPress={handleResetGame}
        >
          <Trash2 size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Réinitialiser le jeu</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.credits}>
        <Text style={styles.creditsTitle}>BUREAUCRACY++</Text>
        <Text style={styles.creditsText}>Version 1.0.0</Text>
        <Text style={styles.creditsText}>© 2025 Ministère des Jeux Absurdes</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.title,
    textAlign: 'center',
  },
  settingGroup: {
    margin: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingGroupTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.title,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 10,
  },
  settingLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  resetButton: {
    backgroundColor: Colors.error,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  credits: {
    marginTop: 'auto',
    padding: 20,
    alignItems: 'center',
  },
  creditsTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 18,
    color: Colors.title,
    marginBottom: 5,
  },
  creditsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 3,
  },
});