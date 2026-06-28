import React from 'react';
import { Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { Button, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';

export default function SubscriptionsScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
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
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.content}>
        <NeoPageHeader title="Suscripciones" style={styles.header} compact />

        <Button
          variant="outline"
          onPress={() => void openPortal()}
          disabled={portalMutation.isPending}
          style={styles.button}
        >
          Portal de facturación
        </Button>

        <Text style={[text.sectionTitle, styles.section]}>Activas</Text>
        {subscriptionsQuery.isLoading ? (
          <Text style={text.bodyMuted}>Cargando...</Text>
        ) : subscriptions.length === 0 ? (
          <Text style={text.bodyMuted}>No tienes suscripciones activas.</Text>
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} style={styles.card}>
              <Text style={text.label}>Plan: {sub.planId}</Text>
              <Text style={[text.bodyMuted, styles.rowGap]}>Estado: {sub.status}</Text>
            </Card>
          ))
        )}

        <Text style={[text.sectionTitle, styles.section]}>Planes disponibles</Text>
        {plansQuery.isLoading ? (
          <Text style={text.bodyMuted}>Cargando planes...</Text>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} style={styles.card}>
              <Text style={text.label}>{plan.productId}</Text>
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
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  section: {
    marginTop: 24,
  },
  card: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  rowGap: {
    marginTop: 4,
  },
});
