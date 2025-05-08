import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResourceBar from '@/components/ResourceBar';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { File, Stamp, ClipboardList } from 'lucide-react-native';

export default function ProgressionScreen() {
  const { gameState, formatNumber } = useGameState();
  const { resources, production, administrations } = gameState;
  
  // Calculate total agents owned
  const totalAgents = administrations.reduce((sum, admin) => {
    return sum + admin.agents.reduce((agentSum, agent) => agentSum + agent.owned, 0);
  }, 0);
  
  // Calculate unlocked administrations
  const unlockedAdmins = administrations.filter(admin => admin.isUnlocked).length;
  
  // Prepare stats data
  const stats = [
    { 
      id: 'dossiers-total', 
      label: 'Dossiers totaux', 
      value: formatNumber(resources.dossiers),
      icon: <File color={Colors.resourceDossiers} size={18} />
    },
    { 
      id: 'tampons-total', 
      label: 'Tampons totaux', 
      value: formatNumber(resources.tampons),
      icon: <Stamp color={Colors.resourceTampons} size={18} />
    },
    { 
      id: 'formulaires-total', 
      label: 'Formulaires totaux', 
      value: formatNumber(resources.formulaires),
      icon: <ClipboardList color={Colors.resourceFormulaires} size={18} />
    },
    { 
      id: 'dossiers-production', 
      label: 'Production dossiers', 
      value: formatNumber(production.dossiers) + '/s',
      icon: <File color={Colors.resourceDossiers} size={18} />
    },
    { 
      id: 'tampons-production', 
      label: 'Production tampons', 
      value: formatNumber(production.tampons) + '/s',
      icon: <Stamp color={Colors.resourceTampons} size={18} />
    },
    { 
      id: 'formulaires-production', 
      label: 'Production formulaires', 
      value: formatNumber(production.formulaires) + '/s',
      icon: <ClipboardList color={Colors.resourceFormulaires} size={18} />
    },
    { 
      id: 'agents-owned', 
      label: 'Agents recrutés', 
      value: totalAgents.toString()
    },
    { 
      id: 'admins-unlocked', 
      label: 'Administrations débloquées', 
      value: `${unlockedAdmins}/${administrations.length}`
    }
  ];
  
  return (
    <SafeAreaView style={styles.container}>
      <ResourceBar />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progression</Text>
        <Text style={styles.headerSubtitle}>Statistiques</Text>
      </View>
      
      <FlatList
        data={stats}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              {item.icon}
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 6,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text,
  },
});