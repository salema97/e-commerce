import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, neo, ProductImage } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen.js';
import { NeoStaggeredItem } from '../../components/neo-animated.js';
import { useCart } from '../../lib/cart.js';
import { formatPrice } from '@repo/shared-utils';

export default function CartScreen(): React.ReactElement {
  const router = useRouter();
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  const renderItem = ({
    item,
    index,
  }: {
    item: import('../../lib/cart.js').CartItem;
    index: number;
  }) => (
    <NeoStaggeredItem index={index}>
      <Card style={styles.itemCard} padding="sm">
      <View style={styles.row}>
        <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>
        <Button variant="ghost" size="sm" onPress={() => removeItem(item.productId, item.variantId)}>
          Eliminar
        </Button>
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
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Pago</Text>
        <Text style={styles.title}>CARRITO ({itemCount})</Text>
      </View>

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
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neo.bg,
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
  list: {
    padding: 16,
    paddingBottom: 200,
  },
  itemCard: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 14,
    color: neo.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  remove: {
    color: neo.scarlet,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
    color: neo.onyx,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: neo.muted,
    marginBottom: 16,
    fontWeight: '600',
  },
  emptyButton: {
    minWidth: 180,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    paddingBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: neo.onyx,
  },
});
