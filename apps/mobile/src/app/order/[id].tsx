import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Badge, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStaggeredItem } from '../../components/neo-animated';
import { createMobileApiClient, useApiQueryHooks } from '../../lib/api';
import { formatPrice, isOrderReturnable, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function OrderDetailScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;
  const hooks = useApiQueryHooks();

  const { data: order, isError } = hooks.useOrder(orderId, {
    refetchInterval: (query) => {
      const current = query.state.data as Order | undefined;
      if (current && (current.status === 'PAYMENT_PENDING' || current.status === 'PENDING')) {
        return 3000;
      }
      return false;
    },
  });

  const [isGeneratingReceipt, setIsGeneratingReceipt] = React.useState(false);

  async function handleDownloadReceipt(): Promise<void> {
    if (!orderId) return;
    setIsGeneratingReceipt(true);
    try {
      const client = createMobileApiClient();
      const receipt = await client.orders.getReceipt(orderId).catch(async () =>
        client.orders.generateReceipt(orderId),
      );
      if (receipt?.url) {
        await Linking.openURL(receipt.url);
      }
    } finally {
      setIsGeneratingReceipt(false);
    }
  }

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  if (isError || !order) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={[text.error, styles.errorGap]}>No se pudo cargar el pedido.</Text>
        <Button onPress={() => router.replace('/(tabs)/account')}>Volver</Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.contentPaddedBottom}>
        <NeoPageHeader
          eyebrow="Pedido"
          title={order.orderNumber}
          style={styles.header}
          compact
        />
        <Badge variant="secondary" style={styles.statusBadge}>
          {orderStatusLabel(order.status)}
        </Badge>

        {order.status === 'PAYMENT_PENDING' || order.status === 'PENDING' ? (
          <Text style={[text.bodyMuted, styles.notice]}>
            Estamos confirmando tu pago. Esta pantalla se actualizará
            automáticamente.
          </Text>
        ) : null}

        <NeoStaggeredItem index={0}>
          <Card style={styles.section}>
            <Text style={text.sectionTitle}>Artículos</Text>
            {order.items.map((item, index) => (
              <NeoStaggeredItem key={item.id} index={index}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={text.label}>{item.name}</Text>
                    <Text style={[text.bodyMuted, styles.itemMeta]}>
                      SKU: {item.sku} · Cant.: {item.quantity}
                    </Text>
                  </View>
                  <Text style={text.label}>
                    {formatPrice(Number(item.price) * item.quantity)}
                  </Text>
                </View>
              </NeoStaggeredItem>
            ))}
          </Card>
        </NeoStaggeredItem>

        <NeoStaggeredItem index={1}>
          <Card style={styles.section}>
          <Text style={text.sectionTitle}>Resumen</Text>
          <View style={styles.row}>
            <Text style={text.bodyMuted}>Subtotal</Text>
            <Text style={text.label}>{formatPrice(Number(order.subtotal))}</Text>
          </View>
          {Number(order.discountAmount) > 0 ? (
            <View style={styles.row}>
              <Text style={text.bodyMuted}>Descuento</Text>
              <Text style={[text.label, styles.discount]}>
                -{formatPrice(Number(order.discountAmount))}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={text.bodyMuted}>IVA</Text>
            <Text style={text.label}>{formatPrice(Number(order.taxAmount))}</Text>
          </View>
          <View style={styles.row}>
            <Text style={text.bodyMuted}>Envío</Text>
            <Text style={text.label}>{formatPrice(Number(order.shippingAmount))}</Text>
          </View>
          <View style={[styles.row, layout.totalRow]}>
            <Text style={text.totalLabel}>Total</Text>
            <Text style={text.totalValue}>{formatPrice(Number(order.total))}</Text>
          </View>
          </Card>
        </NeoStaggeredItem>

        {order.shippingAddress ? (
          <NeoStaggeredItem index={2}>
            <Card style={styles.section}>
              <Text style={text.sectionTitle}>Dirección de envío</Text>
              <Text style={[text.bodyMuted, styles.addressLine]}>{order.shippingAddress.recipientName}</Text>
              <Text style={[text.bodyMuted, styles.addressLine]}>{order.shippingAddress.street}</Text>
              <Text style={[text.bodyMuted, styles.addressLine]}>
                {order.shippingAddress.city}
                {order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ''}
              </Text>
            </Card>
          </NeoStaggeredItem>
        ) : null}

        <NeoStaggeredItem index={3}>
          {order.status !== 'PAYMENT_PENDING' && order.status !== 'PENDING' ? (
            <Button
              variant="outline"
              onPress={() => void handleDownloadReceipt()}
              disabled={isGeneratingReceipt}
              size="lg"
            >
              {isGeneratingReceipt ? 'Preparando recibo…' : 'Descargar recibo'}
            </Button>
          ) : null}

          {isOrderReturnable(order) ? (
            <Button
              variant="outline"
              onPress={() => router.push(`/order/${orderId}/return`)}
              size="lg"
            >
              Solicitar devolución
            </Button>
          ) : null}

          <Button onPress={() => router.replace('/(tabs)/account')} size="lg">
            Mis pedidos
          </Button>
        </NeoStaggeredItem>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  errorGap: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  notice: {
    marginBottom: 12,
  },
  section: {
    marginTop: 20,
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
  itemMeta: {
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  discount: {
    color: neo.green,
  },
  addressLine: {
    marginBottom: 2,
  },
});
