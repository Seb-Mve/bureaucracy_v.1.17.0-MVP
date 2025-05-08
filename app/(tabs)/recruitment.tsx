import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResourceBar from '@/components/ResourceBar';
import AgentItem from '@/components/AgentItem';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Lock } from 'lucide-react-native';

export default function RecruitmentScreen() {
  const { gameState, setActiveAdministration, canUnlockAdministration, unlockAdministration, formatNumber } = useGameState();
  const { administrations, activeAdministrationId } = gameState;
  
  const activeAdministration = administrations.find(
    admin => admin.id === activeAdministrationId
  );

  const handleAdministrationPress = (administrationId: string) => {
    setActiveAdministration(administrationId);
  };

  const renderUnlockCost = (administration: any) => {
    return Object.entries(administration.unlockCost).map(([resource, amount]) => (
      <Text key={resource} style={[
        styles.costText,
        { color: canUnlockAdministration(administration.id) ? Colors.success : Colors.error }
      ]}>
        {formatNumber(amount || 0)} {resource}
      </Text>
    ));
  };

  const handleUnlock = (administrationId: string) => {
    if (canUnlockAdministration(administrationId)) {
      unlockAdministration(administrationId);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ResourceBar />
      
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {administrations.map((administration) => (
            <TouchableOpacity
              key={administration.id}
              style={[
                styles.tab,
                administration.id === activeAdministrationId && styles.activeTab,
                !administration.isUnlocked && styles.lockedTab
              ]}
              onPress={() => administration.isUnlocked ? 
                handleAdministrationPress(administration.id) : 
                handleUnlock(administration.id)
              }
            >
              {!administration.isUnlocked && (
                <View style={styles.lockContainer}>
                  <Lock size={16} color={Colors.textLight} />
                  <View style={styles.unlockInfo}>
                    {renderUnlockCost(administration)}
                  </View>
                </View>
              )}
              <Text style={[
                styles.tabText,
                administration.id === activeAdministrationId && styles.activeTabText,
                !administration.isUnlocked && styles.lockedTabText
              ]}>
                {administration.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {(!activeAdministration || !activeAdministration.isUnlocked) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Sélectionnez une administration débloquée pour recruter des agents
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeAdministration.agents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AgentItem 
              agent={item} 
              administrationId={activeAdministration.id} 
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTab: {
    backgroundColor: Colors.buttonPrimary,
  },
  lockedTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  lockedTabText: {
    color: Colors.textLight,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  unlockInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  costText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
});