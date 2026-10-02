import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors, { Espace, Fonts, Typo } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Ce guichet n’existe pas.</Text>
        <Link href="/" style={styles.link}>
          Retourner au guichet 3
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espace.xl,
    backgroundColor: Colors.creme,
  },
  text: {
    fontFamily: Fonts.titreGras,
    fontSize: Typo.titre,
    color: Colors.anthracite,
  },
  link: {
    marginTop: Espace.l,
    paddingVertical: Espace.l,
    fontFamily: Fonts.texteGras,
    fontSize: Typo.corps,
    color: Colors.encreTexte,
  },
});
