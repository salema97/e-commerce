import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Input, Textarea } from '@repo/shared-ui';
import { NeoScreen } from '../../../components/neo-screen.js';
import { NeoStaggeredItem } from '../../../components/neo-animated.js';
import { api } from '../../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

const RETURN_WINDOW_DAYS = 30;

function computeReturnEligibility(order: Order) {
  const isDelivered = order.status === 'DELIVERED';
  const createdAt = new Date(order.createdAt);
  const cutoff = new Date(createdAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const isWithinWindow = cutoff >= now;
  const remainingMs = Math.max(0, cutoff.getTime() - now.getTime());
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return { isDelivered, isWithinWindow, remainingDays };
}

export default function ReturnRequestScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isError } = api.hooks.useOrder(orderId);
  const createReturn = api.hooks.useCreateReturnRequest();
  const [selected, setSelected] = React.useState<Record<string, { qty: number; reason: string }>>({});

  if (isError || !order) {
    return (
      <NeoScreen style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el pedido.</Text>
        <Button onPress={() => router.back()}>Volver</Button>
      </NeoScreen>
    );
  }

  const currentOrder = order;
  const { isDelivered, isWithinWindow, remainingDays } = computeReturnEligibility(currentOrder);
  const canRequestReturn = isDelivered && isWithinWindow;

  function toggleItem(itemId: string, maxQty: number) {
    if (!canRequestReturn) return;
    setSelected((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { qty: maxQty, reason: '' } };
    });
  }

  async function handleSubmit() {
    if (!canRequestReturn) return;
    const items = Object.entries(selected).map(([itemId, value]) => {
      const orderItem = currentOrder.items.find((i) => i.id === itemId)!;
      return {
        productId: orderItem.productId,
        variantId: orderItem.variantId ?? undefined,
        quantity: value.qty,
        reason: value.reason,
      };
    });

    await createReturn.mutateAsync({
      orderId: currentOrder.id,
      data: {
        items,
        reason: items.map((i) => i.reason).join('; ') || 'Devolución del cliente',
      },
    });
    router.replace(`/order/${orderId}`);
  }

  return (
    <NeoScreen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Solicitar devolución</Text>
        <Text style={styles.subtitle}>Pedido #{currentOrder.orderNumber}</Text>

        {!isDelivered ? (
          <NeoStaggeredItem index={0}>
            <Card style={styles.banner}>
              <Text style={styles.bannerTitle}>Pedido no entregado</Text>
              <Text style={styles.bannerText}>
                Puedes solicitar una devolución después de que el pedido haya sido entregado.
              </Text>
            </Card>
          </NeoStaggeredItem>
        ) : null}

        {isDelivered && !isWithinWindow ? (
          <NeoStaggeredItem index={0}>
            <Card style={styles.banner}>
              <Text style={styles.bannerTitle}>Plazo de devolución cerrado</Text>
              <Text style={styles.bannerText}>
                El plazo de devolución para este pedido ha expirado.
              </Text>
            </Card>
          </NeoStaggeredItem>
        ) : null}

        {isDelivered && isWithinWindow ? (
          <Text style={styles.windowText}>
            {remainingDays === 1
              ? 'Plazo de devolución: queda 1 día'
              : `Plazo de devolución: quedan ${remainingDays} días`}
          </Text>
        ) : null}

        {currentOrder.items.map((item, index) => (
          <NeoStaggeredItem key={item.id} index={index + 1}>
            <Card style={styles.itemCard}>
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Button
                variant={selected[item.id] ? 'primary' : 'outline'}
                size="sm"
                onPress={() => toggleItem(item.id, item.quantity)}
                disabled={!canRequestReturn}
              >
                {selected[item.id] ? 'Seleccionado' : 'Seleccionar'}
              </Button>
            </View>
            <Text style={styles.meta}>
              SKU: {item.sku} · {formatPrice(item.price * item.quantity)}
            </Text>

            {selected[item.id] ? (
              <View style={styles.inputs}>
                <Input
                  label={`Cantidad (máx. ${item.quantity})`}
                  keyboardType="numeric"
                  value={String(selected[item.id].qty)}
                  onChangeText={(text) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        qty: Math.min(
                          Math.max(1, Number(text) || 1),
                          item.quantity,
                        ),
                      },
                    }))
                  }
                  editable={canRequestReturn}
                />
                <Textarea
                  label="Motivo"
                  value={selected[item.id].reason}
                  onChangeText={(text) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], reason: text },
                    }))
                  }
                  placeholder="Motivo de la devolución de este artículo"
                  editable={canRequestReturn}
                />
              </View>
            ) : null}
            </Card>
          </NeoStaggeredItem>
        ))}

        <NeoStaggeredItem index={currentOrder.items.length + 1}>
          <Button
            onPress={handleSubmit}
            disabled={createReturn.isPending || Object.keys(selected).length === 0 || !canRequestReturn}
            size="lg"
          >
            {createReturn.isPending ? 'Enviando...' : 'Enviar solicitud de devolución'}
          </Button>
        </NeoStaggeredItem>
      </ScrollView>
    </NeoScreen>
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
  subtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 20,
  },
  windowText: {
    fontSize: 14,
    color: '#15803d',
    marginBottom: 16,
  },
  banner: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
    flex: 1,
    marginRight: 12,
  },
  meta: {
    fontSize: 13,
    color: '#737373',
  },
  inputs: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    color: '#525252',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#171717',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#a3a3a3',
  },
  muted: {
    color: '#737373',
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
  },
});
