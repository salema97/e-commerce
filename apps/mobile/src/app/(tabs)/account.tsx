import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice, formatDate, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function AccountScreen(): React.ReactElement {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { data: orders, isLoading } = api.hooks.useOrders({ limit: 10 });

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/(tabs)');
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Pedido #{item.orderNumber}</Text>
        <Badge variant="secondary">{orderStatusLabel(item.status)}</Badge>
      </View>
      <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.orderTotal}>Total: {formatPrice(item.total)}</Text>
    </Card>
  );

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Cuenta</Text>
          <Text style={styles.message}>Inicia sesión para ver tus pedidos y direcciones.</Text>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mi cuenta</Text>

      <Card style={styles.profileCard}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user?.primaryEmailAddress?.emailAddress ?? 'No disponible'}</Text>
      </Card>

      <View style={styles.actions}>
        <Button variant="outline" onPress={() => router.push('/account/notifications')}>
          Preferencias de notificaciones
        </Button>
      </View>

      <Text style={styles.sectionTitle}>Pedidos recientes</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#171717" style={styles.loader} />
      ) : (
        <FlatList
          data={orders?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Aún no tienes pedidos.</Text>
          }
        />
      )}

      <View style={styles.footer}>
        <Button variant="outline" onPress={handleSignOut} size="lg">
          Cerrar sesión
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
    padding: 24,
    paddingBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    minWidth: 200,
    marginBottom: 12,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actions: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#171717',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    paddingHorizontal: 24,
    marginBottom: 12,
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
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  orderDate: {
    fontSize: 13,
    color: '#737373',
    marginBottom: 6,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  empty: {
    textAlign: 'center',
    color: '#737373',
    marginTop: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
});
