import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { LEGAL_PATH_SLUGS, LEGAL_PATH_TITLES } from '@repo/shared-utils';

export default function LegalIndexScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Legal</Text>
        <Text style={styles.title}>Información legal</Text>
      </View>
      <FlatList
        data={LEGAL_PATH_SLUGS}
        keyExtractor={(slug) => slug}
        contentContainerStyle={styles.list}
        renderItem={({ item: slug }) => (
          <Pressable onPress={() => router.push(`/legal/${slug}`)}>
            <Card style={styles.card} padding="md">
              <Text style={styles.link}>{LEGAL_PATH_TITLES[slug]}</Text>
            </Card>
          </Pressable>
        )}
      />
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neo.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  seasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: neo.muted,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  list: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { marginBottom: 12 },
  link: {
    fontSize: 16,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
});
