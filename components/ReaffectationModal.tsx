import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

interface ReaffectationModalProps {
  visible: boolean;
  onAccept: () => void;
  onRefuse: () => void;
}

export default function ReaffectationModal({ visible, onAccept, onRefuse }: ReaffectationModalProps) {
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!visible) setShowComingSoon(false);
  }, [visible]);

  const handleAccept = () => {
    setShowComingSoon(true);
  };

  const handleClose = () => {
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {!showComingSoon ? (
            <>
              <Text style={styles.title} accessibilityRole="header">
                Alerte
              </Text>
              <Text style={styles.body}>
                {`Le volume de dossiers locaux a atteint le seuil de compression critique. L'espace de stockage physique est saturé. Pour continuer à exister administrativement, votre dossier personnel doit être délocalisé vers l'échelon Départemental.`}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.buttonAccept, pressed && styles.buttonPressed]}
                onPress={handleAccept}
                accessibilityLabel="Accepter la migration — Transférer mon matricule et mes dossiers"
                accessibilityRole="button"
              >
                <Text style={styles.buttonAcceptText}>ACCEPTER LA MIGRATION</Text>
                <Text style={styles.buttonSubtitle}>Transférer mon matricule et mes dossiers.</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.buttonRefuse, pressed && styles.buttonPressed]}
                onPress={onRefuse}
                accessibilityLabel="Refuser la migration — Rester ici, l'excès de dossiers sera pilonné"
                accessibilityRole="button"
              >
                <Text style={styles.buttonRefuseText}>REFUSER</Text>
                <Text style={styles.buttonSubtitleDanger}>
                  {`Rester ici (Attention : l'excès de dossiers sera pilonné pour libérer de l'espace).`}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>À venir</Text>
              <Text style={styles.body}>Fonctionnalité à venir.</Text>
              <Pressable
                style={({ pressed }) => [styles.buttonAccept, pressed && styles.buttonPressed]}
                onPress={handleClose}
                accessibilityLabel="Fermer"
                accessibilityRole="button"
              >
                <Text style={styles.buttonAcceptText}>Fermer</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#E74C3C',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonAccept: {
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 12,
  },
  buttonRefuse: {
    backgroundColor: '#3A3A3A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E74C3C',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonAcceptText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonRefuseText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#E74C3C',
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonSubtitleDanger: {
    fontSize: 12,
    color: 'rgba(231,76,60,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
});
