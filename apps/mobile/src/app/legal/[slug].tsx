import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { LEGAL_PATH_TITLES, resolveLegalCmsSlug } from '@repo/shared-utils';

export default function LegalPageScreen(): React.ReactElement {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const pathSlug = slug ?? '';
  const fallbackTitle = LEGAL_PATH_TITLES[pathSlug];
  const cmsSlug = fallbackTitle ? resolveLegalCmsSlug(pathSlug) : '';
  const hooks = useApiQueryHooks();

  const { data: page, error } = hooks.useCmsPageBySlug(cmsSlug, {
    enabled: Boolean(cmsSlug),
  });

  if (!fallbackTitle) {
    return (
      <NeoScreen style={styles.center}>
        <Text style={styles.error}>Página no encontrada.</Text>
        <Button variant="outline" onPress={() => router.back()}>
          Volver
        </Button>
      </NeoScreen>
    );
  }

  if (error || !page) {
    return (
      <NeoScreen style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el contenido legal.</Text>
        <Button variant="outline" onPress={() => router.push('/legal')}>
          Ver todas
        </Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.seasonLabel}>Legal</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Card style={styles.card} padding="md">
          <Text style={styles.body}>{page.bodyMarkdown}</Text>
        </Card>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neo.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  seasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: neo.muted,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  card: { marginTop: 4 },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: neo.muted,
    fontWeight: '600',
  },
  error: { fontSize: 16, color: neo.muted, fontWeight: '600', textAlign: 'center' },
});
