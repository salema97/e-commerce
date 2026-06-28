import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { Button, Card, Badge, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStickyFooter } from '../../components/neo-layout';
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

  if (!user) {
    return (
      <NeoScreen style={layout.screen}>
        <View style={layout.emptyState}>
          <View style={styles.guestPanel}>
            <NeoPageHeader eyebrow="Acceso" title="Cuenta" compact align="center" style={styles.guestHeader} />
            <Text style={[text.bodyMuted, styles.message]}>Inicia sesión para ver tus pedidos.</Text>
            <Button onPress={() => router.push('/sign-in')} fullWidth>
              Iniciar sesión
            </Button>
            <Button variant="outline" onPress={() => router.push('/sign-up')} fullWidth style={styles.authButtonGap}>
              Crear cuenta
            </Button>
          </View>
        </View>
      </NeoScreen>
    );
  }

  const orderItems = orders?.data ?? [];

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.listContentWithFooter}>
        <NeoPageHeader eyebrow="Perfil" title="Mi cuenta" style={layout.pageHeaderInList} compact />

        <Card style={layout.section}>
          <Text style={text.eyebrow}>Correo</Text>
          <Text style={text.label}>{user.email ?? 'No disponible'}</Text>
        </Card>

        {storeCredit && storeCredit.balance > 0 ? (
          <Card style={StyleSheet.flatten([layout.section, styles.creditCard])}>
            <Text style={text.eyebrow}>Crédito en tienda</Text>
            <Text style={text.totalValue}>{formatPrice(storeCredit.balance)}</Text>
            {storeCredit.expiresAt ? (
              <Text style={[text.bodyMuted, styles.creditExpiry]}>
                Vence el {formatDate(storeCredit.expiresAt)}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <View style={layout.actionsStack}>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/loyalty')}>
            Programa de lealtad
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/referrals')}>
            Invita y gana
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/subscriptions')}>
            Suscripciones
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/quotes')}>
            Mis cotizaciones
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/privacy')}>
            Privacidad y datos
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/account/notifications')}>
            Preferencias de notificaciones
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/help')}>
            Ayuda y preguntas frecuentes
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/wishlist')}>
            Lista de deseos
          </Button>
          <Button variant="outline" fullWidth onPress={() => router.push('/legal')}>
            Información legal
          </Button>
        </View>

        <Text style={text.sectionTitle}>Pedidos recientes</Text>

        {orderItems.length === 0 ? (
          <Text style={[text.bodyMuted, styles.empty]}>Aún no tienes pedidos.</Text>
        ) : (
          orderItems.map((item, index) => (
            <NeoStaggeredItem key={item.id} index={index}>
              <Pressable onPress={() => router.push(`/order/${item.id}`)}>
                <Card style={layout.section}>
                  <View style={styles.orderHeader}>
                    <Text style={text.label}>#{item.orderNumber}</Text>
                    <Badge variant="secondary">{orderStatusLabel(item.status)}</Badge>
                  </View>
                  <Text style={text.bodyMuted}>{formatDate(item.createdAt)}</Text>
                  <Text style={text.totalValue}>{formatPrice(item.total)}</Text>
                </Card>
              </Pressable>
            </NeoStaggeredItem>
          ))
        )}
      </ScrollView>

      <NeoStickyFooter>
        <Button variant="outline" onPress={handleSignOut} size="lg" fullWidth>
          Cerrar sesión
        </Button>
      </NeoStickyFooter>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  guestPanel: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  guestHeader: {
    marginBottom: 4,
    borderBottomWidth: 0,
    paddingBottom: 0,
    alignSelf: 'stretch',
  },
  message: {
    textAlign: 'center',
    marginBottom: 12,
  },
  authButtonGap: {
    marginTop: 0,
  },
  creditCard: {
    borderColor: neo.gold,
  },
  creditExpiry: {
    marginTop: 4,
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
    marginTop: 12,
  },
});
