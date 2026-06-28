import React from 'react';
import { Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { LEGAL_PATH_SLUGS, LEGAL_PATH_TITLES } from '@repo/shared-utils';

export default function LegalIndexScreen(): React.ReactElement {
  const router = useRouter();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  return (
    <NeoScreen style={layout.screen}>
      <NeoPageHeader
        eyebrow="Legal"
        title="Información legal"
        style={styles.header}
        compact
      />
      <FlatList
        data={LEGAL_PATH_SLUGS}
        keyExtractor={(slug) => slug}
        contentContainerStyle={styles.list}
        renderItem={({ item: slug }) => (
          <Pressable onPress={() => router.push(`/legal/${slug}`)}>
            <Card style={styles.card} padding="md">
              <Text style={text.label}>{LEGAL_PATH_TITLES[slug]}</Text>
            </Card>
          </Pressable>
        )}
      />
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 0,
  },
  list: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { marginBottom: 12 },
});
