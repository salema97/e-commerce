import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Input, Badge, PressableCard, ProductImage, Button, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
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

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

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
      variant="outline"
      active={selectedCategory === item.slug}
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
    <NeoStaggeredItem index={index} style={layout.productGridItem}>
      <PressableCard
        padding="none"
        cardStyle={styles.productCard}
        fullWidth
        onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
      >
        <ProductImage url={item.imageUrl ?? undefined} alt={item.name} variant="card" />
        <View style={styles.productBody}>
          <Text style={[text.label, styles.productName]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.categoryName ? (
            <Text style={text.bodyMuted}>{item.categoryName}</Text>
          ) : null}
          {item.reviewCount && item.reviewCount > 0 ? (
            <Text style={text.bodyMuted}>
              {(item.averageRating ?? 0).toFixed(1)} ★ ({item.reviewCount})
            </Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={text.label}>{formatPrice(item.price)}</Text>
            {item.compareAtPrice ? <Badge variant="destructive" size="sm">Oferta</Badge> : null}
            {!item.inStock ? <Badge variant="outline" size="sm">Agotado</Badge> : null}
          </View>
        </View>
      </PressableCard>
    </NeoStaggeredItem>
  );

  return (
    <NeoScreen style={layout.screen} entrance={false}>
      <NeoEnterFromTop>
        <NeoPageHeader
          eyebrow="Catálogo"
          title="Tienda"
          style={layout.pageHeaderInset}
          compact
          trailing={
            <Input
              placeholder="Buscar..."
              value={search}
              onChangeText={setSearch}
            />
          }
        />
      </NeoEnterFromTop>

      <FlatList
        horizontal
        data={categories ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={layout.horizontalInset}
        showsHorizontalScrollIndicator={false}
      />

      <View style={[layout.horizontalInset, styles.ratingRow]}>
        {[undefined, 4, 3].map((value) => (
          <Button
            key={value ?? 'all'}
            size="sm"
            variant="outline"
            active={minRating === value}
            onPress={() => setMinRating(value)}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {value ? `${value}+ ★` : 'Todas'}
          </Button>
        ))}
      </View>

      {catalogError ? (
        <View style={layout.emptyState}>
          <Text style={text.error}>No se pudieron cargar los productos.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={layout.productGridRow}
          renderItem={renderProduct}
          contentContainerStyle={layout.listContent}
          ListEmptyComponent={
            <Text style={[text.bodyMuted, styles.empty]}>No se encontraron productos.</Text>
          }
        />
      )}
      <StoreChatWidget />
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginRight: 8,
  },
  chipText: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    overflow: 'hidden',
  },
  productBody: {
    padding: 12,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});
