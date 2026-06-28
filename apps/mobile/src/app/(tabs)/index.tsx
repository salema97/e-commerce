import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, PressableCard, ProductImage, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice, getProductPrimaryImageUrl, getProductPrimaryImageAlt } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';
import {
  NeoEnterFromBottom,
  NeoEnterFromTop,
  NeoPulse,
  NeoScaleIn,
  NeoStaggeredItem,
} from '../../components/neo-animated';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const { data: products, error } = hooks.useProducts();

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  const featuredProducts = React.useMemo(() => {
    if (!products) return [];
    const featured = products.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : products).slice(0, 6);
  }, [products]);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <NeoStaggeredItem index={index} style={styles.productTouchable}>
      <PressableCard
        cardStyle={styles.productCard}
        padding="none"
        onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
      >
        <NeoScaleIn delay={120}>
          <ProductImage
            url={getProductPrimaryImageUrl(item)}
            alt={getProductPrimaryImageAlt(item)}
            variant="card"
            style={styles.productImage}
          />
        </NeoScaleIn>
        <View style={styles.productBody}>
          <View style={styles.productTop}>
            <Text style={[text.label, styles.productName]} numberOfLines={2}>
              {item.name}
            </Text>
            {item.isFeatured ? <View style={styles.featuredDot} /> : null}
          </View>
          <Text style={text.label}>{formatPrice(item.price)}</Text>
        </View>
      </PressableCard>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={layout.screen} entrance={false}>
      <NeoEnterFromTop>
        <NeoPageHeader
          eyebrow="Colección"
          title="Descubre"
          subtitle="Productos destacados de la tienda"
          style={styles.header}
          compact
        />
      </NeoEnterFromTop>

      {error ? (
        <View style={layout.center}>
          <Text style={text.error}>No se pudieron cargar los productos.</Text>
          <Text style={text.bodyMuted}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={featuredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={renderProduct}
          ListEmptyComponent={
            <Text style={[text.bodyMuted, styles.empty]}>No hay productos destacados por ahora.</Text>
          }
        />
      )}

      <NeoEnterFromBottom delay={120}>
        <View style={styles.footer}>
          <NeoPulse>
            <Button onPress={() => router.push('/(tabs)/store')} size="lg">
              Explorar tienda
            </Button>
          </NeoPulse>
        </View>
      </NeoEnterFromBottom>
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
  heading: {
    fontSize: 40,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    color: neo.muted,
    marginTop: 6,
  },
  loader: {
    marginTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  error: {
    color: neo.scarlet,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorDetail: {
    color: neo.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productTouchable: {
    flex: 1,
    marginHorizontal: 6,
  },
  productCard: {
    minHeight: 180,
    overflow: 'hidden',
  },
  productImage: {
    borderBottomWidth: 0,
  },
  productBody: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  productTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  featuredDot: {
    width: 10,
    height: 10,
    backgroundColor: neo.scarlet,
    borderWidth: 2,
    borderColor: neo.onyx,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: neo.onyx,
    marginTop: 10,
  },
  empty: {
    textAlign: 'center',
    color: neo.muted,
    marginTop: 24,
    fontWeight: '600',
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
});
