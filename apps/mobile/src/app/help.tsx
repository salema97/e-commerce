import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, neo } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoStaggeredItem } from '../components/neo-animated';
import { useApiQueryHooks } from '../lib/api';
import type { Faq } from '@repo/shared-types';

export default function HelpScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const { data: faqs = [], isLoading } = hooks.usePublishedFaqs();

  const renderFaq = ({ item, index }: { item: Faq; index: number }) => (
    <NeoStaggeredItem index={index}>
      <Card style={styles.faqCard} padding="md">
        <Text style={styles.question}>{item.question}</Text>
        <Text style={styles.answer}>{item.answer}</Text>
      </Card>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Soporte</Text>
        <Text style={styles.title}>Preguntas frecuentes</Text>
        <Text style={styles.subtitle}>
          ¿No encuentras respuesta? Abre el chat desde la tienda.
        </Text>
        <Button variant="outline" size="sm" onPress={() => router.push('/(tabs)/store')}>
          Ir a la tienda
        </Button>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>Cargando preguntas…</Text>
      ) : (
        <FlatList
          data={faqs}
          keyExtractor={(item) => item.id}
          renderItem={renderFaq}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Aún no hay preguntas publicadas.</Text>
          }
        />
      )}
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neo.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
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
  subtitle: {
    fontSize: 14,
    color: neo.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  faqCard: {
    marginBottom: 12,
  },
  question: {
    fontSize: 15,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: neo.muted,
    fontWeight: '600',
    lineHeight: 20,
  },
  loading: {
    textAlign: 'center',
    color: neo.muted,
    marginTop: 24,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: neo.muted,
    marginTop: 24,
    fontWeight: '600',
  },
});
