import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '@repo/shared-ui';
import { useCart } from '../../lib/cart.js';
import { formatPrice } from '@repo/shared-utils';

export default function CartScreen(): React.ReactElement {
  const router = useRouter();
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  const renderItem = ({ item }: { item: import('../../lib/cart.js').CartItem }) => (
    <Card style={styles.itemCard} padding="sm">
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.productId, item.variantId)}>
          <Text style={styles.remove}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quantityRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
        >
          -
        </Button>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Button
          variant="outline"
          size="sm"
          onPress={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
        >
          +
        </Button>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Carrito ({itemCount})</Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
          <Button onPress={() => router.push('/(tabs)/store')} style={styles.emptyButton}>
            Ir a la tienda
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.productId}-${item.variantId ?? 'default'}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {items.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <Button onPress={() => router.push('/checkout')} size="lg">
            Continuar al pago
          </Button>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
    padding: 24,
    paddingBottom: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 180,
  },
  itemCard: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  price: {
    fontSize: 14,
    color: '#525252',
    marginTop: 4,
  },
  remove: {
    color: '#ef4444',
    fontSize: 13,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 16,
  },
  emptyButton: {
    minWidth: 180,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171717',
  },
});
