import React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@repo/shared-ui';
import { api } from '../../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default function ReturnRequestScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading, isError } = api.hooks.useOrder(orderId);
  const createReturn = api.hooks.useCreateReturnRequest();
  const [selected, setSelected] = React.useState<Record<string, { qty: number; reason: string }>>({});

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>Loading order...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Could not load order.</Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </SafeAreaView>
    );
  }

  const currentOrder = order;

  function toggleItem(itemId: string, maxQty: number) {
    setSelected((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { qty: maxQty, reason: '' } };
    });
  }

  async function handleSubmit() {
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
        reason: items.map((i) => i.reason).join('; ') || 'Customer return',
      },
    });
    router.replace(`/order/${orderId}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request return</Text>
        <Text style={styles.subtitle}>Order #{currentOrder.orderNumber}</Text>

        {currentOrder.items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Button
                variant={selected[item.id] ? 'primary' : 'outline'}
                size="sm"
                onPress={() => toggleItem(item.id, item.quantity)}
              >
                {selected[item.id] ? 'Selected' : 'Select'}
              </Button>
            </View>
            <Text style={styles.meta}>
              SKU: {item.sku} · {formatPrice(item.price * item.quantity)}
            </Text>

            {selected[item.id] ? (
              <View style={styles.inputs}>
                <Text style={styles.label}>Quantity (max {item.quantity})</Text>
                <TextInput
                  style={styles.input}
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
                />
                <Text style={styles.label}>Reason</Text>
                <TextInput
                  style={styles.input}
                  value={selected[item.id].reason}
                  onChangeText={(text) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], reason: text },
                    }))
                  }
                  placeholder="Reason for returning this item"
                />
              </View>
            ) : null}
          </Card>
        ))}

        <Button
          onPress={handleSubmit}
          disabled={createReturn.isPending || Object.keys(selected).length === 0}
          size="lg"
        >
          {createReturn.isPending ? 'Submitting...' : 'Submit return request'}
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
  subtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 20,
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
  muted: {
    color: '#737373',
  },
  error: {
    color: '#ef4444',
    marginBottom: 16,
  },
});
