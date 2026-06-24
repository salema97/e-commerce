import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Badge, Card, neo } from '@repo/shared-ui';
import { api } from '../../../lib/api.js';
import { useCart } from '../../../lib/cart.js';
import { formatPrice } from '@repo/shared-utils';
import type { ProductVariant } from '@repo/shared-types';

export default function ProductDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error } = api.hooks.useProduct(id ?? '');
  const { addItem, itemCount } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = (): void => {
    if (!product) return;

    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id,
        name: selectedVariant
          ? `${product.name} - ${selectedVariant.name}`
          : product.name,
        price: selectedVariant?.price ?? product.price,
      },
      quantity,
    );

    router.push('/(tabs)/cart');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={neo.onyx} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el producto.</Text>
      </SafeAreaView>
    );
  }

  const effectivePrice = selectedVariant?.price ?? product.price;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card padding="none" style={styles.productShell}>
          <View style={styles.imageSection}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Imagen del producto</Text>
            </View>
            <View style={styles.priceSticker}>
              <Text style={styles.priceStickerText}>{formatPrice(effectivePrice)}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.badgeRow}>
              {product.isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
              <Badge variant="primary">En stock</Badge>
            </View>

            <Text style={styles.name}>{product.name}</Text>

            {product.description ? (
              <Text style={styles.description}>{product.description}</Text>
            ) : null}

            {product.variants && product.variants.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Variante</Text>
                <View style={styles.variants}>
                  {product.variants.map((variant) => {
                    const selected = selectedVariant?.id === variant.id;
                    return (
                      <View key={variant.id} style={styles.variantChip}>
                        <Button
                          variant={selected ? 'secondary' : 'outline'}
                          size="sm"
                          onPress={() => setSelectedVariant(variant)}
                        >
                          {variant.name}
                        </Button>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Cantidad</Text>
              <View style={styles.quantityControls}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </Button>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {itemCount > 0 ? (
          <Badge variant="outline" style={styles.cartBadge}>
            {itemCount} en el carrito
          </Badge>
        ) : null}
        <Button onPress={handleAddToCart} size="lg">
          Agregar al carrito
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
    backgroundColor: neo.bg,
  },
  error: {
    color: neo.scarlet,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 160,
  },
  productShell: {
    overflow: 'hidden',
  },
  imageSection: {
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    position: 'relative',
  },
  imagePlaceholder: {
    height: 280,
    backgroundColor: '#e8e0cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: neo.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceSticker: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: neo.scarlet,
    borderWidth: 3,
    borderColor: neo.onyx,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-2deg' }],
    shadowColor: neo.onyx,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  priceStickerText: {
    color: neo.white,
    fontSize: 20,
    fontWeight: '900',
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: neo.muted,
    lineHeight: 20,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: neo.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  variants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    marginBottom: 4,
  },
  quantitySection: {
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(17,17,17,0.1)',
    paddingTop: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'center',
    color: neo.onyx,
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
  cartBadge: {
    marginBottom: 12,
  },
});
