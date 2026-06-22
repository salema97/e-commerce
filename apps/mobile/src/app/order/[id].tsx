import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

function isReturnable(order: Order): boolean {
  if (order.status !== 'DELIVERED') return false;
  const deliveredAt = new Date(order.createdAt);
  const windowDays = 30;
  return deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000 >= Date.now();
}

export default function OrderDetailScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading, isError } = api.hooks.useOrder(orderId, {
    refetchInterval: (query) => {
      const current = query.state.data as Order | undefined;
      if (current && (current.status === 'PAYMENT_PENDING' || current.status === 'PENDING')) {
        return 3000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>Cargando pedido...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el pedido.</Text>
        <Button onPress={() => router.replace('/(tabs)/account')}>Volver</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pedido {order.orderNumber}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{orderStatusLabel(order.status)}</Text>
        </View>

        {order.status === 'PAYMENT_PENDING' || order.status === 'PENDING' ? (
          <Text style={styles.notice}>
            Estamos confirmando tu pago. Esta pantalla se actualizara
            automaticamente.
          </Text>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Articulos</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  SKU: {item.sku} · Qty: {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(Number(item.price) * item.quantity)}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{formatPrice(Number(order.subtotal))}</Text>
          </View>
          {Number(order.discountAmount) > 0 ? (
            <View style={styles.row}>
              <Text style={styles.label}>Descuento</Text>
              <Text style={[styles.value, styles.discount]}>
                -{formatPrice(Number(order.discountAmount))}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>IVA</Text>
            <Text style={styles.value}>{formatPrice(Number(order.taxAmount))}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Envio</Text>
            <Text style={styles.value}>{formatPrice(Number(order.shippingAmount))}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(Number(order.total))}</Text>
          </View>
        </Card>

        {order.shippingAddress ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Direccion de envio</Text>
            <Text style={styles.addressLine}>{order.shippingAddress.recipientName}</Text>
            <Text style={styles.addressLine}>{order.shippingAddress.street}</Text>
            <Text style={styles.addressLine}>
              {order.shippingAddress.city}
              {order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ''}
            </Text>
          </Card>
        ) : null}

        {isReturnable(order) ? (
          <Button
            variant="outline"
            onPress={() => router.push(`/order/${orderId}/return`)}
            size="lg"
          >
            Request return
          </Button>
        ) : null}

        <Button onPress={() => router.replace('/(tabs)/account')} size="lg">
          Mis pedidos
        </Button>
      </ScrollView>
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
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171717',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171717',
  },
  notice: {
    fontSize: 14,
    color: '#525252',
    marginTop: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#171717',
  },
  itemMeta: {
    fontSize: 13,
    color: '#737373',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#525252',
  },
  value: {
    fontSize: 14,
    color: '#171717',
  },
  discount: {
    color: '#16a34a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
  },
  addressLine: {
    fontSize: 14,
    color: '#525252',
    marginBottom: 2,
  },
  muted: {
    color: '#737373',
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
  },
});
