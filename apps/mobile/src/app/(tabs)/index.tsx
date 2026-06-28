import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Button,
  PressableCard,
  ProductImage,
  NeoPageHeader,
  getNeoLayoutStyles,
  getNeoTextStyles,
  neo,
} from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice, getProductPrimaryImageUrl, getProductPrimaryImageAlt } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';
import {
  NeoEnterFromTop,
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
    <NeoStaggeredItem index={index} style={layout.productGridItem}>
      <PressableCard
        cardStyle={styles.productCard}
        padding="none"
        fullWidth
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
          style={layout.pageHeaderInset}
          compact
          trailingCompact
          trailing={
            <Button
              variant="outline"
              size="icon"
              accessibilityLabel="Notificaciones"
              onPress={() => router.push('/account/notifications')}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={neo.onyx} />
            </Button>
          }
        />
      </NeoEnterFromTop>

      {error ? (
        <View style={layout.emptyState}>
          <Text style={text.error}>No se pudieron cargar los productos.</Text>
          <Text style={text.bodyMuted}>{error.message}</Text>
        </View>
      ) : (
        <FlatList
          data={featuredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={layout.listContent}
          columnWrapperStyle={layout.productGridRow}
          renderItem={renderProduct}
          ListEmptyComponent={
            <Text style={[text.bodyMuted, styles.empty]}>No hay productos destacados por ahora.</Text>
          }
        />
      )}
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: 18,
  },
  featuredDot: {
    width: 10,
    height: 10,
    backgroundColor: neo.scarlet,
    borderWidth: 2,
    borderColor: neo.onyx,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});
