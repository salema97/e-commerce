import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, neo, ProductImage, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStaggeredItem } from '../../components/neo-animated';
import { useCart } from '../../lib/cart';
import { formatPrice } from '@repo/shared-utils';
import { trackMobileEvent } from '../../lib/analytics';
import { useAuth } from '../../providers/AuthProvider';

export default function CartScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  function handleRemoveItem(productId: string, variantId?: string): void {
    const item = items.find(
      (entry) => entry.productId === productId && entry.variantId === variantId,
    );
    removeItem(productId, variantId);
    if (item) {
      void trackMobileEvent(
        'remove_from_cart',
        {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        },
        user?.id,
      );
    }
  }

  function handleUpdateQuantity(
    productId: string,
    quantity: number,
    variantId?: string,
  ): void {
    if (quantity <= 0) {
      handleRemoveItem(productId, variantId);
      return;
    }
    updateQuantity(productId, quantity, variantId);
  }

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

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
          <Text style={[text.label, styles.name]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={text.bodyMuted}>{formatPrice(item.price)}</Text>
        </View>
        <Button variant="ghost" size="sm" onPress={() => handleRemoveItem(item.productId, item.variantId)}>
          Eliminar
        </Button>
      </View>

      <View style={styles.quantityRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
        >
          -
        </Button>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Button
          variant="outline"
          size="sm"
          onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
        >
          +
        </Button>
      </View>
      </Card>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={layout.screen}>
      <NeoPageHeader
        eyebrow="Pago"
        title={`Carrito (${itemCount})`}
        style={styles.header}
        compact
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={text.bodyMuted}>Tu carrito está vacío.</Text>
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
            <Text style={text.totalLabel}>Total</Text>
            <Text style={text.totalValue}>{formatPrice(total)}</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 0,
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
  emptyButton: {
    minWidth: 180,
    marginTop: 16,
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
});
