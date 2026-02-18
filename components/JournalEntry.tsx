/**
 * Journal Entry Component
 * 
 * Displays a single journal entry with type indicator, timestamp, and text.
 * Styled differently for S.I.C. messages, non-conformity alerts, and narrative hints.
 * 
 * Fixed 80pt height for FlatList optimization (getItemLayout).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JournalEntry as JournalEntryType } from '@/types/game';
import { formatTimestampFrench } from '@/utils/dateFormatters';
import { AlertTriangle, Info, Eye } from 'lucide-react-native';

interface JournalEntryProps {
  entry: JournalEntryType;
}

function JournalEntry({ entry }: JournalEntryProps) {
  // Get styling based on entry type
  const getEntryStyle = () => {
    switch (entry.type) {
      case 'sic':
        return styles.entrySIC;
      case 'non-conformity':
        return styles.entryNonConformity;
      case 'narrative-hint':
        return entry.isRevealed ? styles.entryNarrativeRevealed : styles.entryNarrativeUnrevealed;
      default:
        return styles.entrySIC;
    }
  };

  // Get icon based on entry type
  const getIcon = () => {
    const size = 20;
    switch (entry.type) {
      case 'sic':
        return <Info size={size} color="#3498DB" />;
      case 'non-conformity':
        return <AlertTriangle size={size} color="#E74C3C" />;
      case 'narrative-hint':
        return <Eye size={size} color={entry.isRevealed ? "#27AE60" : "#9B59B6"} />;
      default:
        return <Info size={size} color="#3498DB" />;
    }
  };

  // Get type label in French
  const getTypeLabel = () => {
    switch (entry.type) {
      case 'sic':
        return 'S.I.C.';
      case 'non-conformity':
        return 'NON-CONFORMITÉ';
      case 'narrative-hint':
        return entry.isRevealed ? 'RÉVÉLÉ' : 'CLASSIFIÉ';
      default:
        return 'SYSTÈME';
    }
  };

  const formattedTimestamp = formatTimestampFrench(entry.timestamp);
  const accessibilityLabel = `${getTypeLabel()}, ${formattedTimestamp}, ${entry.text}`;

  return (
    <View 
      style={[styles.container, getEntryStyle()]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <Text style={styles.typeLabel}>{getTypeLabel()}</Text>
        <Text style={styles.timestamp}>{formattedTimestamp}</Text>
      </View>
      
      <Text 
        style={styles.text}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {entry.text}
      </Text>
    </View>
  );
}

// Wrap in React.memo for performance optimization
export default React.memo(JournalEntry);

const styles = StyleSheet.create({
  container: {
    height: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    backgroundColor: '#2C2C2C',
    marginBottom: 8,
  },
  entrySIC: {
    borderLeftColor: '#3498DB',
  },
  entryNonConformity: {
    borderLeftColor: '#E74C3C',
  },
  entryNarrativeUnrevealed: {
    borderLeftColor: '#9B59B6',
  },
  entryNarrativeRevealed: {
    borderLeftColor: '#27AE60',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    marginRight: 8,
  },
  typeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  timestamp: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '400',
  },
  text: {
    color: '#DDDDDD',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
