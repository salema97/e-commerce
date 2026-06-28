import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice } from '@repo/shared-utils';

export default function QuotesScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const { data: quotes } = hooks.useQuotes('me');

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.content}>
        <NeoPageHeader title="Mis cotizaciones" style={layout.pageHeaderInList} compact />

        {!quotes?.length ? (
          <Text style={text.bodyMuted}>No tienes cotizaciones activas.</Text>
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id} style={styles.card}>
              <Text style={text.label}>{quote.quoteNumber}</Text>
              <Text style={[text.body, styles.rowGap]}>Estado: {quote.status}</Text>
              <Text style={text.body}>Total: {formatPrice(quote.total)}</Text>
              <Text style={[text.bodyMuted, styles.rowGap]}>
                Vence: {new Date(quote.expiresAt).toLocaleDateString('es-EC')}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    gap: 4,
  },
  rowGap: {
    marginTop: 4,
  },
});
