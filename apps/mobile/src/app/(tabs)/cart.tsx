import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button, ProductImage, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStickyFooter } from '../../components/neo-layout';
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
      <Card style={layout.section} padding="sm">
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
        style={layout.pageHeaderInset}
        compact
      />

      {items.length === 0 ? (
        <View style={layout.emptyState}>
          <View style={styles.emptyPanel}>
            <Text style={[text.bodyMuted, styles.emptyText]}>Tu carrito está vacío.</Text>
            <Button variant="outline" onPress={() => router.push('/(tabs)/store')} fullWidth>
              Ir a la tienda
            </Button>
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.productId}-${item.variantId ?? 'default'}`}
          renderItem={renderItem}
          contentContainerStyle={layout.listContentWithFooter}
        />
      )}

      {items.length > 0 ? (
        <NeoStickyFooter>
          <View style={styles.totalRow}>
            <Text style={text.totalLabel}>Total</Text>
            <Text style={text.totalValue}>{formatPrice(total)}</Text>
          </View>
          <Button onPress={() => router.push('/checkout')} size="lg" fullWidth>
            Continuar al pago
          </Button>
        </NeoStickyFooter>
      ) : null}
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  info: {
    flex: 1,
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
  },
  emptyPanel: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    alignItems: 'stretch',
  },
  emptyText: {
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    paddingBottom: 12,
  },
});
