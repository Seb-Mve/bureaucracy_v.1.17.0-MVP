import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Agent, ResourceType } from '@/types/game';
import { useGameState } from '@/context/GameStateContext';
import Colors from '@/constants/Colors';
import { File, Stamp, ClipboardList, Battery, Zap } from 'lucide-react-native';
import Animated, { withSpring, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';

interface AgentItemProps {
  agent: Agent;
  administrationId: string;
}

const AnimatedZap = Animated.createAnimatedComponent(Zap);
const AnimatedBattery = Animated.createAnimatedComponent(Battery);

export default function AgentItem({ agent, administrationId }: AgentItemProps) {
  const { canPurchaseAgent, purchaseAgent, formatNumber } = useGameState();
  const canBuy = canPurchaseAgent(administrationId, agent.id);
  const [isAnimating, setIsAnimating] = useState(false);

  const getResourceColor = (resource: string): string => {
    switch (resource) {
      case 'dossiers':
        return Colors.resourceDossiers;
      case 'tampons':
        return Colors.resourceTampons;
      case 'formulaires':
        return Colors.resourceFormulaires;
      default:
        return Colors.text;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'dossiers':
        return <File size={16} color={getResourceColor(resource)} />;
      case 'tampons':
        return <Stamp size={16} color={getResourceColor(resource)} />;
      case 'formulaires':
        return <ClipboardList size={16} color={getResourceColor(resource)} />;
      default:
        return null;
    }
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    if (!isAnimating) return {};
    
    return {
      transform: [
        { 
          scale: withSequence(
            withSpring(1.5),
            withSpring(1)
          )
        },
        {
          rotate: withSequence(
            withTiming('-15deg', { duration: 150 }),
            withTiming('15deg', { duration: 300 }),
            withTiming('0deg', { duration: 150 })
          )
        }
      ]
    };
  });

  const getProductionDescription = () => {
    if (agent.baseProduction && Object.keys(agent.baseProduction).length > 0) {
      const [resource, amount] = Object.entries(agent.baseProduction)[0];
      return (
        <View style={styles.productionRow}>
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <AnimatedZap size={16} color={getResourceColor(resource)} style={styles.productionIcon} />
          </Animated.View>
          <Text style={styles.productionText}>
            +{formatNumber(amount)} {resource}/s
          </Text>
        </View>
      );
    } else if (agent.productionBonus) {
      const { target, value, isPercentage } = agent.productionBonus;
      return (
        <View style={styles.productionRow}>
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <AnimatedBattery size={16} color={getResourceColor(target)} style={styles.productionIcon} />
          </Animated.View>
          <Text style={styles.productionText}>
            +{formatNumber(value)}{isPercentage ? '%' : ''} {target === 'all' ? 'toutes ressources' : target}
          </Text>
        </View>
      );
    }
    return null;
  };

  const handleBuy = () => {
    if (canBuy) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      purchaseAgent(administrationId, agent.id);
    }
  };

  const getCostDisplay = () => {
    const [resource, amount] = Object.entries(agent.cost)[0];
    const resourceLabel = resource === 'dossiers' ? 'dossiers' : resource === 'tampons' ? 'tampons' : 'formulaires';
    return (
      <View style={styles.costDisplay}>
        <Text style={[styles.costText, { color: 'white' }]}>
          {formatNumber(amount || 0)}
        </Text>
        {getResourceIcon(resource)}
      </View>
    );
  };

  const getAccessibilityLabel = () => {
    const [resource, amount] = Object.entries(agent.cost)[0];
    const resourceLabel = resource === 'dossiers' ? 'dossiers' : resource === 'tampons' ? 'tampons' : 'formulaires';
    let production = '';
    
    if (agent.baseProduction && Object.keys(agent.baseProduction).length > 0) {
      const [prodResource, prodAmount] = Object.entries(agent.baseProduction)[0];
      production = `Produit ${formatNumber(prodAmount)} ${prodResource} par seconde`;
    } else if (agent.productionBonus) {
      const { target, value, isPercentage } = agent.productionBonus;
      production = `Augmente ${target} de ${formatNumber(value)}${isPercentage ? ' pourcent' : ''}`;
    }
    
    return `${agent.name}. ${agent.description}. ${production}. Coût: ${formatNumber(amount || 0)} ${resourceLabel}. Possédé: ${agent.owned}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{agent.name}</Text>
        <Text style={styles.ownedText}>x{agent.owned}</Text>
      </View>
      
      <Text style={styles.description}>{agent.description}</Text>
      
      <View style={styles.bottomRow}>
        {getProductionDescription()}
        <TouchableOpacity 
          style={[styles.buyButton, !canBuy && styles.disabledButton]}
          onPress={handleBuy}
          disabled={!canBuy}
          accessible={true}
          accessibilityLabel={getAccessibilityLabel()}
          accessibilityHint={canBuy ? 'Appuyez pour recruter cet agent' : 'Ressources insuffisantes pour recruter cet agent'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canBuy }}
        >
          {getCostDisplay()}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    padding: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  ownedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.title,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productionIcon: {
    marginRight: 6,
  },
  productionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  buyButton: {
    backgroundColor: Colors.buttonPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: Colors.buttonDisabled,
  },
  costDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  costText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});