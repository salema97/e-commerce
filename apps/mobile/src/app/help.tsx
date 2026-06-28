import React from 'react';
import { Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoStaggeredItem } from '../components/neo-animated';
import { useApiQueryHooks } from '../lib/api';
import type { Faq } from '@repo/shared-types';

export default function HelpScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const { data: faqs = [], isLoading } = hooks.usePublishedFaqs();

  const renderFaq = ({ item, index }: { item: Faq; index: number }) => (
    <NeoStaggeredItem index={index}>
      <Card style={styles.faqCard} padding="md">
        <Text style={text.label}>{item.question}</Text>
        <Text style={[text.bodyMuted, styles.answer]}>{item.answer}</Text>
      </Card>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={layout.screen}>
      <NeoPageHeader
        eyebrow="Soporte"
        title="Preguntas frecuentes"
        subtitle="¿No encuentras respuesta? Abre el chat desde la tienda."
        style={styles.header}
        compact
      >
        <Button variant="outline" size="sm" onPress={() => router.push('/(tabs)/store')} style={styles.headerButton}>
          Ir a la tienda
        </Button>
      </NeoPageHeader>

      {isLoading ? (
        <Text style={[text.bodyMuted, styles.loading]}>Cargando preguntas…</Text>
      ) : (
        <FlatList
          data={faqs}
          keyExtractor={(item) => item.id}
          renderItem={renderFaq}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[text.bodyMuted, styles.empty]}>Aún no hay preguntas publicadas.</Text>
          }
        />
      )}
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 0,
  },
  headerButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  faqCard: {
    marginBottom: 12,
  },
  answer: {
    marginTop: 8,
    lineHeight: 20,
  },
  loading: {
    textAlign: 'center',
    marginTop: 24,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});
