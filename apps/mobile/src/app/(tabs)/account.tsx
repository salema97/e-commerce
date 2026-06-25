import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider.js';
import { Button, Card, Badge, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen.js';
import { NeoStaggeredItem } from '../../components/neo-animated.js';
import { api } from '../../lib/api.js';
import { getRegisteredPushToken } from '../../lib/push-token-registry.js';
import { formatPrice, formatDate, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function AccountScreen(): React.ReactElement {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: orders } = api.hooks.useOrders({ limit: 10 });
  const { data: storeCredit } = api.hooks.useMyStoreCredit({
    enabled: Boolean(user),
  });

  const handleSignOut = async (): Promise<void> => {
    const pushToken = getRegisteredPushToken();
    if (pushToken) {
      await api.client.notifications.pushTokens.remove(pushToken).catch(() => undefined);
    }
    await signOut();
    router.replace('/(tabs)');
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => (
    <NeoStaggeredItem index={index}>
      <Pressable onPress={() => router.push(`/order/${item.id}`)}>
        <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Badge variant="secondary">{orderStatusLabel(item.status)}</Badge>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
        </Card>
      </Pressable>
    </NeoStaggeredItem>
  );

  if (!user) {
    return (
      <NeoScreen style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.seasonLabel}>Acceso</Text>
          <Text style={styles.title}>CUENTA</Text>
          <Text style={styles.message}>Inicia sesión para ver tus pedidos.</Text>
          <Button onPress={() => router.push('/sign-in')} style={styles.authButton}>
            Iniciar sesión
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/sign-up')}
            style={styles.authButton}
          >
            Crear cuenta
          </Button>
        </View>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Perfil</Text>
        <Text style={styles.title}>MI CUENTA</Text>
      </View>

      <Card style={styles.profileCard}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user?.email ?? 'No disponible'}</Text>
      </Card>

      {storeCredit && storeCredit.balance > 0 ? (
        <Card style={styles.creditCard}>
          <Text style={styles.label}>Crédito en tienda</Text>
          <Text style={styles.creditValue}>{formatPrice(storeCredit.balance)}</Text>
          {storeCredit.expiresAt ? (
            <Text style={styles.creditExpiry}>
              Vence el {formatDate(storeCredit.expiresAt)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button variant="outline" onPress={() => router.push('/account/loyalty')}>
          Programa de lealtad
        </Button>
        <Button variant="outline" onPress={() => router.push('/account/referrals')}>
          Invita y gana
        </Button>
        <Button variant="outline" onPress={() => router.push('/account/subscriptions')}>
          Suscripciones
        </Button>
        <Button variant="outline" onPress={() => router.push('/account/quotes')}>
          Mis cotizaciones
        </Button>
        <Button variant="outline" onPress={() => router.push('/account/privacy')}>
          Privacidad y datos
        </Button>
        <Button variant="outline" onPress={() => router.push('/account/notifications')}>
          Preferencias de notificaciones
        </Button>
        <Button variant="outline" onPress={() => router.push('/help')}>
          Ayuda y preguntas frecuentes
        </Button>
        <Button variant="outline" onPress={() => router.push('/wishlist')}>
          Lista de deseos
        </Button>
        <Button variant="outline" onPress={() => router.push('/legal')}>
          Información legal
        </Button>
      </View>

      <Text style={styles.sectionTitle}>Pedidos recientes</Text>

      <FlatList
          data={orders?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Aún no tienes pedidos.</Text>
          }
        />

      <View style={styles.footer}>
        <Button variant="outline" onPress={handleSignOut} size="lg">
          Cerrar sesión
        </Button>
      </View>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neo.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
  message: {
    fontSize: 16,
    color: neo.muted,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  authButton: {
    minWidth: 220,
    marginBottom: 12,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  creditCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: neo.gold,
  },
  creditValue: {
    fontSize: 24,
    fontWeight: '900',
    color: neo.onyx,
  },
  creditExpiry: {
    fontSize: 12,
    color: neo.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  label: {
    fontSize: 11,
    color: neo.muted,
    marginBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    color: neo.onyx,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: neo.onyx,
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 140,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  orderDate: {
    fontSize: 12,
    color: neo.muted,
    marginBottom: 6,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: neo.onyx,
  },
  empty: {
    textAlign: 'center',
    color: neo.muted,
    marginTop: 24,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: neo.bg,
    borderTopWidth: 3,
    borderTopColor: neo.onyx,
  },
});
