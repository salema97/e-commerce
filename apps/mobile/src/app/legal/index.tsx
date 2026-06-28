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
        style={layout.pageHeaderInset}
        compact
      />
      <FlatList
        data={LEGAL_PATH_SLUGS}
        keyExtractor={(slug) => slug}
        contentContainerStyle={layout.listContent}
        renderItem={({ item: slug }) => (
          <Pressable onPress={() => router.push(`/legal/${slug}`)}>
            <Card style={layout.section} padding="md">
              <Text style={text.label}>{LEGAL_PATH_TITLES[slug]}</Text>
            </Card>
          </Pressable>
        )}
      />
    </NeoScreen>
  );
}
