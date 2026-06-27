import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';

export default function SubscriptionsScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const subscriptionsQuery = hooks.useMySubscriptions();
  const plansQuery = hooks.useSubscriptionPlans();
  const subscribeMutation = hooks.useSubscribe();
  const portalMutation = hooks.useSubscriptionPortal();

  const subscriptions = subscriptionsQuery.data ?? [];
  const plans = plansQuery.data ?? [];

  async function openPortal(): Promise<void> {
    const { url } = await portalMutation.mutateAsync();
    if (url) await Linking.openURL(url);
  }

  async function subscribe(planId: string): Promise<void> {
    const { url } = await subscribeMutation.mutateAsync(planId);
    if (url) await Linking.openURL(url);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Suscripciones</Text>

        <Button
          variant="outline"
          onPress={() => void openPortal()}
          disabled={portalMutation.isPending}
          style={styles.button}
        >
          Portal de facturación
        </Button>

        <Text style={styles.section}>Activas</Text>
        {subscriptionsQuery.isLoading ? (
          <Text>Cargando...</Text>
        ) : subscriptions.length === 0 ? (
          <Text style={styles.muted}>No tienes suscripciones activas.</Text>
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} style={styles.card}>
              <Text style={styles.label}>Plan: {sub.planId}</Text>
              <Text style={styles.muted}>Estado: {sub.status}</Text>
            </Card>
          ))
        )}

        <Text style={styles.section}>Planes disponibles</Text>
        {plansQuery.isLoading ? (
          <Text>Cargando planes...</Text>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} style={styles.card}>
              <Text style={styles.label}>{plan.productId}</Text>
              <Button
                onPress={() => void subscribe(plan.id)}
                disabled={subscribeMutation.isPending}
                style={styles.button}
              >
                Suscribirme
              </Button>
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
  section: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  muted: { color: '#737373', fontSize: 13 },
  card: { marginBottom: 8 },
  button: { marginTop: 8 },
});
