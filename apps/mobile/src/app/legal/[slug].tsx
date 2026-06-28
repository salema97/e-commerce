import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { LEGAL_PATH_TITLES, resolveLegalCmsSlug } from '@repo/shared-utils';

export default function LegalPageScreen(): React.ReactElement {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const pathSlug = slug ?? '';
  const fallbackTitle = LEGAL_PATH_TITLES[pathSlug];
  const cmsSlug = fallbackTitle ? resolveLegalCmsSlug(pathSlug) : '';
  const hooks = useApiQueryHooks();

  const { data: page, error } = hooks.useCmsPageBySlug(cmsSlug, {
    enabled: Boolean(cmsSlug),
  });

  if (!fallbackTitle) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={[text.bodyMuted, styles.errorGap]}>Página no encontrada.</Text>
        <Button variant="outline" onPress={() => router.back()}>
          Volver
        </Button>
      </NeoScreen>
    );
  }

  if (error || !page) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={[text.bodyMuted, styles.errorGap]}>No se pudo cargar el contenido legal.</Text>
        <Button variant="outline" onPress={() => router.push('/legal')}>
          Ver todas
        </Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <NeoPageHeader eyebrow="Legal" title={page.title} compact />
        <Card style={styles.card} padding="md">
          <Text style={[text.bodyMuted, styles.body]}>{page.bodyMarkdown}</Text>
        </Card>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  card: { marginTop: 4 },
  body: { lineHeight: 22 },
  errorGap: { marginBottom: 16, textAlign: 'center' },
});
