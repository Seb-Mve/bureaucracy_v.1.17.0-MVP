import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResourceBar from '@/components/ResourceBar';
import StampButton from '@/components/StampButton';
import AdministrationCard from '@/components/AdministrationCard';
import ConformiteDisplay from '@/components/ConformiteDisplay';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { Administration } from '@/types/game';
import { File, Stamp, ClipboardList, Battery } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function BureauScreen() {
  const { gameState, setActiveAdministration } = useGameState();
  const { administrations, activeAdministrationId } = gameState;
  const scrollViewRef = useRef<ScrollView>(null);

  const handleAdministrationPress = (administrationId: string) => {
    setActiveAdministration(administrationId);
    
    const index = administrations.findIndex(admin => admin.id === administrationId);
    
    if (scrollViewRef.current && index !== -1) {
      scrollViewRef.current.scrollTo({ x: index * (300 + 20), animated: true });
    }
  };

  const getResourceIcon = (resourceType: string | undefined, bonus?: boolean) => {
    const size = 16;
    const color = bonus ? Colors.buttonPrimary : getResourceColor(resourceType);
    
    if (bonus) return <Battery size={size} color={color} />;
    
    switch (resourceType) {
      case 'dossiers':
        return <File size={size} color={color} />;
      case 'tampons':
        return <Stamp size={size} color={color} />;
      case 'formulaires':
        return <ClipboardList size={size} color={color} />;
      default:
        return null;
    }
  };

  const getResourceColor = (resourceType: string | undefined): string => {
    switch (resourceType) {
      case 'dossiers':
        return Colors.resourceDossiers;
      case 'tampons':
        return Colors.resourceTampons;
      case 'formulaires':
        return Colors.resourceFormulaires;
      default:
        return Colors.textLight;
    }
  };

  const renderAgentInfo = (administration: Administration) => {
    if (!administration.isUnlocked) return null;

    return administration.agents.map((agent) => (
      <View key={agent.id} style={styles.agentRow}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentCount}>x{agent.owned}</Text>
        </View>
        <View style={styles.productionInfo}>
          {agent.baseProduction && Object.entries(agent.baseProduction).map(([resource, value], index) => (
            <View key={`${agent.id}-${resource}-${index}`}>
              {getResourceIcon(resource)}
            </View>
          ))}
          {agent.productionBonus && (
            <View key={`${agent.id}-bonus`}>
              {getResourceIcon(agent.productionBonus.target, true)}
            </View>
          )}
        </View>
      </View>
    ));
  };

  const activeAdministration = administrations.find(admin => admin.id === activeAdministrationId);

  return (
    <SafeAreaView style={styles.container}>
      <ResourceBar />
      
      {/* Conformité display (appears when unlocked) */}
      <ConformiteDisplay />
      
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.activeAdministrationTitle}>
            {activeAdministration?.name || ''}
          </Text>
          <View style={styles.separator} />
        </View>

        <View style={styles.scrollContainer}>
          <ScrollView>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={300 + 20}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollViewContent}
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
              {activeAdministration && (
                <View style={styles.administrationSection}>
                  {renderAgentInfo(activeAdministration)}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        
        <View style={styles.buttonContainer}>
          <StampButton />
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
  header: {
    backgroundColor: Colors.background,
    paddingTop: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  activeAdministrationTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.title,
    textAlign: 'center',
    marginBottom: 10,
  },
  separator: {
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 40,
    marginBottom: 20,
  },
  scrollViewContent: {
    paddingHorizontal: (width - 300) / 2,
    paddingBottom: 20,
  },
  additionalContent: {
    padding: 20,
    marginBottom: 20,
  },
  administrationSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.buttonPrimary,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  agentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  agentName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  agentCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.title,
    marginLeft: 10,
  },
  productionInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    backgroundColor: 'rgba(249, 237, 205, 0.9)',
    paddingTop: 11,
    borderTopWidth: 0,
    borderTopColor: Colors.border,
  },
});