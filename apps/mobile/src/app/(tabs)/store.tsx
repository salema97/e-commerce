import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Input, Badge, PressableCard, ProductImage, Button, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { StoreChatWidget } from '../../components/store/StoreChatWidget';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice } from '@repo/shared-utils';
import type { CatalogProductSummary, Category } from '@repo/shared-types';
import { NeoEnterFromTop, NeoStaggeredItem } from '../../components/neo-animated';
import { trackMobileEvent } from '../../lib/analytics';
import { useAuth } from '../../providers/AuthProvider';

export default function StoreScreen(): React.ReactElement {
  const router = useRouter();
  const hooks = useApiQueryHooks();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const lastSearchRef = useRef<string | null>(null);
  const lastCategoryRef = useRef<string | null>(null);

  const trimmedSearch = search.trim();

  const catalogQuery = useMemo(
    () => ({
      q: trimmedSearch || undefined,
      category: selectedCategory,
      minRating,
      page: 1,
      limit: 48,
      sort: 'newest' as const,
    }),
    [trimmedSearch, selectedCategory, minRating],
  );

  useEffect(() => {
    if (trimmedSearch.length >= 2 && trimmedSearch !== lastSearchRef.current) {
      lastSearchRef.current = trimmedSearch;
      void trackMobileEvent('search', { query: trimmedSearch }, user?.id);
    }
  }, [trimmedSearch, user?.id]);

  useEffect(() => {
    if (selectedCategory && selectedCategory !== lastCategoryRef.current) {
      lastCategoryRef.current = selectedCategory;
      void trackMobileEvent('filter', { categorySlug: selectedCategory }, user?.id);
    }
  }, [selectedCategory, user?.id]);

  const { data: catalog, error: catalogError } = hooks.useCatalog(catalogQuery);
  const { data: categories } = hooks.useCategories();

  const products: CatalogProductSummary[] = catalog?.items ?? [];

  const renderCategory = ({ item }: { item: Category }) => (
    <Button
      size="sm"
      variant={selectedCategory === item.slug ? 'secondary' : 'outline'}
      onPress={() =>
        setSelectedCategory((current) => (current === item.slug ? undefined : item.slug))
      }
      style={styles.chip}
      textStyle={styles.chipText}
    >
      {item.name}
    </Button>
  );

  const renderProduct = ({ item, index }: { item: CatalogProductSummary; index: number }) => (
    <NeoStaggeredItem index={index}>
      <PressableCard
        padding="none"
        cardStyle={styles.productCard}
        onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
      >
        <ProductImage url={item.imageUrl ?? undefined} alt={item.name} variant="card" />
        <View style={styles.productBody}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.categoryName ? (
            <Text style={styles.categoryName}>{item.categoryName}</Text>
          ) : null}
          {item.reviewCount && item.reviewCount > 0 ? (
            <Text style={styles.productRating}>
              {(item.averageRating ?? 0).toFixed(1)} ★ ({item.reviewCount})
            </Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
            {item.compareAtPrice ? <Badge variant="destructive" size="sm">Oferta</Badge> : null}
            {!item.inStock ? <Badge variant="outline" size="sm">Agotado</Badge> : null}
          </View>
        </View>
      </PressableCard>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={styles.container} entrance={false}>
      <NeoEnterFromTop>
        <View style={styles.header}>
          <Text style={styles.seasonLabel}>Catálogo</Text>
          <Text style={styles.title}>TIENDA</Text>
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.search}
          />
        </View>
      </NeoEnterFromTop>

      <FlatList
        horizontal
        data={categories ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.categories}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.ratingRow}>
        {[undefined, 4, 3].map((value) => (
          <Button
            key={value ?? 'all'}
            size="sm"
            variant={minRating === value ? 'secondary' : 'outline'}
            onPress={() => setMinRating(value)}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {value ? `${value}+ ★` : 'Todas'}
          </Button>
        ))}
      </View>

      {catalogError ? (
        <View style={styles.center}>
          <Text style={styles.error}>No se pudieron cargar los productos.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron productos.</Text>
          }
        />
      )}
      <StoreChatWidget />
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
    fontSize: 36,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: -1,
  },
  search: {
    marginBottom: 4,
  },
  categories: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  chipText: {
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: neo.scarlet,
    textAlign: 'center',
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  productCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  productBody: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  categoryName: {
    fontSize: 12,
    color: neo.muted,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productRating: {
    fontSize: 12,
    color: neo.muted,
    marginTop: 4,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: neo.onyx,
  },
  empty: {
    textAlign: 'center',
    color: neo.muted,
    marginTop: 24,
    fontWeight: '600',
  },
});
