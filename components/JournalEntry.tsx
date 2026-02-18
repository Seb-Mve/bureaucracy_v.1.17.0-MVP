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
import Colors from '@/constants/Colors';

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
        return <Info size={size} color={Colors.resourceTampons} />;
      case 'non-conformity':
        return <AlertTriangle size={size} color={Colors.error} />;
      case 'narrative-hint':
        return <Eye size={size} color={entry.isRevealed ? Colors.phase2Border : Colors.resourceFormulaires} />;
      default:
        return <Info size={size} color={Colors.resourceTampons} />;
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
  
  // Accessibility label: "Information classifiée" for unrevealed hints, full text for revealed/other types
  const accessibilityLabel = entry.type === 'narrative-hint' && !entry.isRevealed
    ? `Information classifiée, ${formattedTimestamp}`
    : `${getTypeLabel()}, ${formattedTimestamp}, ${entry.text}`;

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
        numberOfLines={2}
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
    paddingVertical: 10,  // 80 - 20 = 60pt content: header(24) + gap(4) + 2 lines text(32) ✓
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    backgroundColor: Colors.journalBackground,
    marginBottom: 8,
  },
  entrySIC: {
    borderLeftColor: Colors.resourceTampons,
  },
  entryNonConformity: {
    borderLeftColor: Colors.error,
  },
  entryNarrativeUnrevealed: {
    borderLeftColor: Colors.resourceFormulaires,
  },
  entryNarrativeRevealed: {
    borderLeftColor: Colors.phase2Border,
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
    color: Colors.toastText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  timestamp: {
    color: Colors.journalTimestamp,
    fontSize: 11,
    fontWeight: '400',
  },
  text: {
    color: Colors.journalText,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
});
