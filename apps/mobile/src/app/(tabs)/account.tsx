import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Button, Card, Badge, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStaggeredItem } from '../../components/neo-animated';
import { createMobileApiClient, useApiQueryHooks } from '../../lib/api';
import { getRegisteredPushToken } from '../../lib/push-token-registry';
import { formatPrice, formatDate, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function AccountScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const { user, signOut } = useAuth();
  const { data: orders } = hooks.useOrders({ limit: 10 });
  const { data: storeCredit } = hooks.useMyStoreCredit({
    enabled: Boolean(user),
  });

  const handleSignOut = async (): Promise<void> => {
    const pushToken = getRegisteredPushToken();
    if (pushToken) {
      await createMobileApiClient().notifications.pushTokens.remove(pushToken).catch(() => undefined);
    }
    await signOut();
    router.replace('/(tabs)');
  };

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  const renderOrder = ({ item, index }: { item: Order; index: number }) => (
    <NeoStaggeredItem index={index}>
      <Pressable onPress={() => router.push(`/order/${item.id}`)}>
        <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={text.label}>#{item.orderNumber}</Text>
          <Badge variant="secondary">{orderStatusLabel(item.status)}</Badge>
        </View>
        <Text style={text.bodyMuted}>{formatDate(item.createdAt)}</Text>
        <Text style={text.totalValue}>{formatPrice(item.total)}</Text>
        </Card>
      </Pressable>
    </NeoStaggeredItem>
  );

  if (!user) {
    return (
      <NeoScreen style={layout.screen}>
        <View style={layout.center}>
          <NeoPageHeader eyebrow="Acceso" title="Cuenta" compact style={styles.guestHeader} />
          <Text style={[text.bodyMuted, styles.message]}>Inicia sesión para ver tus pedidos.</Text>
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
    <NeoScreen style={layout.screen}>
      <NeoPageHeader eyebrow="Perfil" title="Mi cuenta" style={styles.header} compact />

      <Card style={styles.profileCard}>
        <Text style={text.eyebrow}>Correo</Text>
        <Text style={text.label}>{user?.email ?? 'No disponible'}</Text>
      </Card>

      {storeCredit && storeCredit.balance > 0 ? (
        <Card style={styles.creditCard}>
          <Text style={text.eyebrow}>Crédito en tienda</Text>
          <Text style={text.totalValue}>{formatPrice(storeCredit.balance)}</Text>
          {storeCredit.expiresAt ? (
            <Text style={[text.bodyMuted, styles.creditExpiry]}>
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

      <Text style={[text.sectionTitle, styles.sectionTitle]}>Pedidos recientes</Text>

      <FlatList
          data={orders?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[text.bodyMuted, styles.empty]}>Aún no tienes pedidos.</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 0,
  },
  guestHeader: {
    marginBottom: 12,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
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
  creditExpiry: {
    marginTop: 4,
  },
  actions: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
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
  empty: {
    textAlign: 'center',
    marginTop: 24,
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
