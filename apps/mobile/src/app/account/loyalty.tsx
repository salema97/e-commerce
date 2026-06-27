import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';
import { formatDate } from '@repo/shared-utils';

export default function LoyaltyScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { data: account, isLoading: accountLoading } = hooks.useLoyaltyAccount();
  const { data: transactions, isLoading: txLoading } = hooks.useLoyaltyTransactions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Programa de lealtad</Text>

        {accountLoading ? (
          <Text>Cargando cuenta...</Text>
        ) : account ? (
          <Card>
            <Text style={styles.label}>Puntos: {account.points}</Text>
            <Text style={styles.label}>Nivel: {account.tier}</Text>
            <Text style={styles.label}>Valor: ${account.pointsValue.toFixed(2)}</Text>
          </Card>
        ) : null}

        <Text style={styles.section}>Historial</Text>
        {txLoading ? (
          <Text>Cargando movimientos...</Text>
        ) : (transactions ?? []).length === 0 ? (
          <Text style={styles.muted}>Sin movimientos aún.</Text>
        ) : (
          (transactions ?? []).map((tx) => (
            <Card key={tx.id} style={styles.txCard}>
              <Text style={styles.txTitle}>
                {tx.type} · {tx.points > 0 ? '+' : ''}
                {tx.points} pts
              </Text>
              <Text style={styles.muted}>{tx.reason}</Text>
              <Text style={styles.muted}>{formatDate(tx.createdAt)}</Text>
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
  label: { fontSize: 15, marginBottom: 6 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  muted: { color: '#737373', fontSize: 13 },
  txCard: { marginBottom: 8 },
  txTitle: { fontWeight: '600', marginBottom: 4 },
});
