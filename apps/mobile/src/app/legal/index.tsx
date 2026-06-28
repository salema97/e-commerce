import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, NeoPageHeader, getNeoLayoutStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { LEGAL_PATH_SLUGS, LEGAL_PATH_TITLES } from '@repo/shared-utils';

export default function LegalIndexScreen(): React.ReactElement {
  const router = useRouter();
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
          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push(`/legal/${slug}`)}
            style={layout.section}
            textStyle={styles.linkLabel}
          >
            {LEGAL_PATH_TITLES[slug]}
          </Button>
        )}
      />
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  linkLabel: {
    textTransform: 'none',
    letterSpacing: 0,
  },
});
