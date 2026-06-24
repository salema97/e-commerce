import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider.js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge, neo } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice, formatDate, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function AccountScreen(): React.ReactElement {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { data: orders, isLoading } = api.hooks.useOrders({ limit: 10 });

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/(tabs)');
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Badge variant="secondary">{orderStatusLabel(item.status)}</Badge>
      </View>
      <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
    </Card>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Perfil</Text>
        <Text style={styles.title}>MI CUENTA</Text>
      </View>

      <Card style={styles.profileCard}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user?.email ?? 'No disponible'}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Pedidos recientes</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={neo.onyx} style={styles.loader} />
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
    marginBottom: 20,
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
