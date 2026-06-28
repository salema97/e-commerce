import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Input, Textarea, Checkbox, Alert, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../../components/neo-screen';
import { NeoStaggeredItem } from '../../../components/neo-animated';
import { computeReturnEligibility, formatPrice } from '@repo/shared-utils';
import { useApiQueryHooks } from '../../../lib/api';
import type { Order } from '@repo/shared-types';

export default function ReturnRequestScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;
  const hooks = useApiQueryHooks();

  const { data: order, isError } = hooks.useOrder(orderId);
  const createReturn = hooks.useCreateReturnRequest();
  const [selected, setSelected] = React.useState<Record<string, { qty: number; reason: string }>>({});

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  if (isError || !order) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={[text.error, styles.errorGap]}>No se pudo cargar el pedido.</Text>
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
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.contentPaddedBottom}>
        <NeoPageHeader
          title="Solicitar devolución"
          subtitle={`Pedido #${currentOrder.orderNumber}`}
          compact
          style={layout.pageHeaderInList}
        />

        {!isDelivered ? (
          <NeoStaggeredItem index={0}>
            <Alert variant="destructive" title="Pedido no entregado" style={styles.banner}>
              Puedes solicitar una devolución después de que el pedido haya sido entregado.
            </Alert>
          </NeoStaggeredItem>
        ) : null}

        {isDelivered && !isWithinWindow ? (
          <NeoStaggeredItem index={0}>
            <Alert variant="destructive" title="Plazo de devolución cerrado" style={styles.banner}>
              El plazo de devolución para este pedido ha expirado.
            </Alert>
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
            <Checkbox
              checked={Boolean(selected[item.id])}
              onCheckedChange={() => toggleItem(item.id, item.quantity)}
              label={item.name}
              disabled={!canRequestReturn}
            />
            <Text style={[text.bodyMuted, styles.meta]}>
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
  header: {
    marginBottom: 16,
  },
  errorGap: {
    marginBottom: 16,
  },
  windowText: {
    fontSize: 14,
    color: neo.green,
    marginBottom: 16,
    fontWeight: '700',
  },
  banner: {
    marginBottom: 16,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
    gap: 8,
  },
  meta: {
    marginTop: 4,
  },
  inputs: {
    marginTop: 12,
  },
});
