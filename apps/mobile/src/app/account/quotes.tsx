import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice } from '@repo/shared-utils';

export default function QuotesScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { data: quotes } = hooks.useQuotes('me');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis cotizaciones</Text>

        {!quotes?.length ? (
          <Text style={styles.empty}>No tienes cotizaciones activas.</Text>
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id} style={styles.card}>
              <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
              <Text>Estado: {quote.status}</Text>
              <Text>Total: {formatPrice(quote.total)}</Text>
              <Text>Vence: {new Date(quote.expiresAt).toLocaleDateString('es-EC')}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  empty: { color: '#737373' },
  card: { marginBottom: 12, gap: 4 },
  quoteNumber: { fontWeight: '700', marginBottom: 4 },
});
