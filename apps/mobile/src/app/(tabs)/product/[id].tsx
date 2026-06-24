import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Badge } from '@repo/shared-ui';
import { api } from '../../../lib/api.js';
import { useCart } from '../../../lib/cart.js';
import { getProductAvailableQuantity } from '../../../lib/product-stock.js';
import { BackInStockForm } from '../../../components/product/BackInStockForm.js';
import { ProductReviews } from '../../../components/product/ProductReviews.js';
import { formatPrice } from '@repo/shared-utils';
import { trackMobileEvent } from '../../../lib/analytics.js';
import { captureMobileException } from '../../../lib/sentry.js';
import type { ProductVariant } from '@repo/shared-types';

export default function ProductDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error } = api.hooks.useProduct(id ?? '');
  const { addItem, itemCount } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      void trackMobileEvent('product_view', {
        productId: product.id,
        productName: product.name,
      });
    }
  }, [product?.id, product?.name]);

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

    void trackMobileEvent('add_to_cart', {
      productId: product.id,
      quantity,
      variantId: selectedVariant?.id,
    });

    router.push('/(tabs)/cart');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#171717" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    if (error) {
      captureMobileException(error, { screen: 'product-detail', productId: id });
    }
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>No se pudo cargar el producto.</Text>
      </SafeAreaView>
    );
  }

  const effectivePrice = selectedVariant?.price ?? product.price;
  const availableQuantity = getProductAvailableQuantity(product.inventory);
  const isOutOfStock = availableQuantity <= 0;
  const isPreOrder =
    product.isPreOrder &&
    product.preOrderReleaseDate &&
    new Date(product.preOrderReleaseDate) > new Date();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Imagen del producto</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.name}>{product.name}</Text>
          {isPreOrder ? <Badge variant="outline">Pre-orden</Badge> : null}
          <Text style={styles.price}>{formatPrice(effectivePrice)}</Text>
        </View>

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}

        {product.variants && product.variants.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variantes</Text>
            <View style={styles.variants}>
              {product.variants.map((variant) => (
                <View key={variant.id} style={styles.chip}>
                  <Button
                    variant={
                      selectedVariant?.id === variant.id ? 'primary' : 'outline'
                    }
                    size="sm"
                    onPress={() => setSelectedVariant(variant)}
                  >
                    {variant.name} ({formatPrice(variant.price ?? product.price)})
                  </Button>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.quantity}>
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

        {isOutOfStock ? <BackInStockForm productId={product.id} /> : null}
        <ProductReviews productId={product.id} />
      </ScrollView>

      <View style={styles.footer}>
        {itemCount > 0 ? (
          <Badge variant="secondary" style={styles.cartBadge}>
            {itemCount} en el carrito
          </Badge>
        ) : null}
        <Button onPress={handleAddToCart} size="lg" disabled={isOutOfStock && !isPreOrder}>
          {isOutOfStock && !isPreOrder ? 'Sin stock' : 'Agregar al carrito'}
        </Button>
      </View>
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
    backgroundColor: '#ffffff',
  },
  error: {
    color: '#ef4444',
  },
  content: {
    padding: 24,
    paddingBottom: 140,
  },
  imagePlaceholder: {
    height: 240,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePlaceholderText: {
    color: '#737373',
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171717',
  },
  description: {
    fontSize: 15,
    color: '#525252',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 10,
  },
  variants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  quantity: {
    marginBottom: 20,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
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
  cartBadge: {
    marginBottom: 12,
  },
});
