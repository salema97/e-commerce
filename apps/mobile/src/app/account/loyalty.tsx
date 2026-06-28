import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { formatDate } from '@repo/shared-utils';

export default function LoyaltyScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const { data: account, isLoading: accountLoading } = hooks.useLoyaltyAccount();
  const { data: transactions, isLoading: txLoading } = hooks.useLoyaltyTransactions();

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.content}>
        <NeoPageHeader title="Programa de lealtad" style={layout.pageHeaderInList} compact />

        {accountLoading ? (
          <Text style={text.bodyMuted}>Cargando cuenta...</Text>
        ) : account ? (
          <Card>
            <Text style={text.label}>Puntos: {account.points}</Text>
            <Text style={[text.label, styles.rowGap]}>Nivel: {account.tier}</Text>
            <Text style={text.label}>Valor: ${account.pointsValue.toFixed(2)}</Text>
          </Card>
        ) : null}

        <View style={layout.stackSection}>
          <Text style={text.sectionTitle}>Historial</Text>
        </View>
        {txLoading ? (
          <Text style={text.bodyMuted}>Cargando movimientos...</Text>
        ) : (transactions ?? []).length === 0 ? (
          <Text style={text.bodyMuted}>Sin movimientos aún.</Text>
        ) : (
          (transactions ?? []).map((tx) => (
            <Card key={tx.id} style={layout.section}>
              <Text style={text.label}>
                {tx.type} · {tx.points > 0 ? '+' : ''}
                {tx.points} pts
              </Text>
              <Text style={[text.bodyMuted, styles.rowGap]}>{tx.reason}</Text>
              <Text style={text.bodyMuted}>{formatDate(tx.createdAt)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  rowGap: {
    marginTop: 6,
  },
});
