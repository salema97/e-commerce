import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Badge,
  Card,
  NeoPageHeader,
  getNeoLayoutStyles,
  getNeoTextStyles,
  neo,
  ProductImage,
} from '@repo/shared-ui';
import { NeoScreen } from '../../../components/neo-screen';
import { NeoStickyFooter } from '../../../components/neo-layout';
import { NeoStaggeredItem } from '../../../components/neo-animated';
import { useApiQueryHooks } from '../../../lib/api';
import { useCart } from '../../../lib/cart';
import { formatPrice, getProductPrimaryImageUrl, getProductPrimaryImageAlt } from '@repo/shared-utils';
import { getProductAvailableQuantity } from '@repo/shared-utils';
import { trackMobileEvent } from '../../../lib/analytics';
import { useAuth } from '../../../providers/AuthProvider';
import { useWishlist } from '../../../lib/wishlist';
import { BackInStockForm } from '../../../components/product/BackInStockForm';
import { ProductReviews } from '../../../components/product/ProductReviews';
import { captureMobileException } from '../../../lib/sentry';
import type { ProductVariant } from '@repo/shared-types';

export default function ProductDetailScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, error } = hooks.useProduct(id ?? '');
  const { user } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem, itemCount } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  useEffect(() => {
    if (!product) return;
    void trackMobileEvent(
      'product_view',
      { productId: product.id, productName: product.name },
      user?.id,
    );
  }, [product?.id, product?.name, user?.id]);

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
        imageUrl: getProductPrimaryImageUrl(product),
      },
      quantity,
    );

    void trackMobileEvent(
      'add_to_cart',
      {
        productId: product.id,
        productName: product.name,
        quantity,
        price: selectedVariant?.price ?? product.price,
        variantId: selectedVariant?.id,
      },
      user?.id,
    );

    router.push('/(tabs)/cart');
  };

  if (error || !product) {
    if (error) {
      captureMobileException(error, { screen: 'product-detail', productId: id });
    }
    return (
      <NeoScreen style={layout.screen}>
        <View style={layout.emptyState}>
          <Text style={text.error}>No se pudo cargar el producto.</Text>
        </View>
      </NeoScreen>
    );
  }

  const effectivePrice = selectedVariant?.price ?? product.price;
  const availableQuantity = getProductAvailableQuantity(product.inventory);
  const isOutOfStock = availableQuantity <= 0;
  const isPreOrder =
    product.isPreOrder &&
    product.preOrderReleaseDate &&
    new Date(product.preOrderReleaseDate) > new Date();
  const savedToWishlist = isInWishlist(product.id);

  const handleToggleWishlist = (): void => {
    if (savedToWishlist) {
      void removeFromWishlist(product.id);
      return;
    }
    void addToWishlist({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: getProductPrimaryImageUrl(product),
    });
  };

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.detailContent}>
        <NeoPageHeader eyebrow="Producto" title={product.name} style={layout.pageHeaderInList} compact />

        <NeoStaggeredItem index={0}>
          <Card padding="none" style={layout.section}>
            <View style={styles.imageSection}>
              <ProductImage
                url={getProductPrimaryImageUrl(product)}
                alt={getProductPrimaryImageAlt(product)}
                variant="detail"
              />
              <View style={styles.priceSticker}>
                <Text style={styles.priceStickerText}>{formatPrice(effectivePrice)}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.badgeRow}>
                {product.isFeatured ? <Badge variant="secondary">Destacado</Badge> : null}
                {isPreOrder ? <Badge variant="outline">Pre-orden</Badge> : null}
                <Badge variant="primary">
                  {isOutOfStock && !isPreOrder ? 'Sin stock' : 'En stock'}
                </Badge>
              </View>

              {product.description ? (
                <Text style={text.bodyMuted}>{product.description}</Text>
              ) : null}

              {isPreOrder && product.preOrderReleaseDate ? (
                <Text style={text.bodyMuted}>
                  Disponible a partir del{' '}
                  {new Date(product.preOrderReleaseDate).toLocaleDateString('es-EC')}
                </Text>
              ) : null}

              {product.variants && product.variants.length > 0 ? (
                <View style={layout.stackSection}>
                  <Text style={text.sectionTitle}>Variante</Text>
                  <View style={styles.variants}>
                    {product.variants.map((variant) => {
                      const selected = selectedVariant?.id === variant.id;
                      return (
                        <Button
                          key={variant.id}
                          variant={selected ? 'secondary' : 'outline'}
                          size="sm"
                          onPress={() => setSelectedVariant(variant)}
                        >
                          {variant.name}
                        </Button>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={layout.stackSection}>
                <Text style={text.sectionTitle}>Cantidad</Text>
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

              {isOutOfStock && !isPreOrder ? (
                <View style={layout.stackSection}>
                  <BackInStockForm productId={product.id} />
                </View>
              ) : null}
            </View>
          </Card>
        </NeoStaggeredItem>

        <ProductReviews productId={product.id} />
      </ScrollView>

      <NeoStickyFooter>
        {itemCount > 0 ? (
          <Badge variant="outline" style={styles.cartBadge}>
            {itemCount} en el carrito
          </Badge>
        ) : null}
        <Button variant="outline" onPress={handleToggleWishlist} size="lg" fullWidth>
          {savedToWishlist ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        </Button>
        <Button onPress={handleAddToCart} size="lg" fullWidth disabled={isOutOfStock && !isPreOrder}>
          {isOutOfStock && !isPreOrder ? 'Sin stock' : 'Agregar al carrito'}
        </Button>
      </NeoStickyFooter>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    position: 'relative',
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
  variants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  cartBadge: {
    alignSelf: 'flex-start',
  },
});
