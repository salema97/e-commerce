import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Badge } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';
import type { CatalogProductSummary, Category } from '@repo/shared-types';

export default function StoreScreen(): React.ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();

  const catalogQuery = useMemo(
    () => ({
      q: search.trim() || undefined,
      category: selectedCategory,
      minRating,
      page: 1,
      limit: 48,
      sort: 'newest' as const,
    }),
    [search, selectedCategory, minRating],
  );

  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
  } = api.hooks.useCatalog(catalogQuery);

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = api.hooks.useCategories();

  const products: CatalogProductSummary[] = catalog?.items ?? [];

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      onPress={() =>
        setSelectedCategory((current) => (current === item.slug ? undefined : item.slug))
      }
      style={styles.chip}
    >
      <Badge variant={selectedCategory === item.slug ? 'default' : 'secondary'}>
        {item.name}
      </Badge>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: CatalogProductSummary }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/product/${item.id}`)}
      style={styles.productCard}
    >
      <Card>
        <Text style={styles.productName}>{item.name}</Text>
        {item.reviewCount && item.reviewCount > 0 ? (
          <Text style={styles.productRating}>
            {(item.averageRating ?? 0).toFixed(1)} ★ ({item.reviewCount})
          </Text>
        ) : null}
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        {!item.inStock ? <Badge variant="outline">Agotado</Badge> : null}
      </Card>
    </TouchableOpacity>
  );

  if (catalogLoading || categoriesLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (catalogError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No se pudo cargar el catálogo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tienda</Text>
      <Input
        placeholder="Buscar productos..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.search}
      />
      <FlatList
        horizontal
        data={categories ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
      />
      <View style={styles.ratingRow}>
        {[undefined, 4, 3].map((value) => (
          <TouchableOpacity
            key={value ?? 'all'}
            onPress={() => setMinRating(value)}
            style={styles.chip}
          >
            <Badge variant={minRating === value ? 'default' : 'secondary'}>
              {value ? `${value}+ ★` : 'Todas'}
            </Badge>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  search: { marginBottom: 12 },
  categoryList: { marginBottom: 12, maxHeight: 44 },
  ratingRow: { flexDirection: 'row', marginBottom: 12 },
  chip: { marginRight: 8 },
  productCard: { flex: 1, margin: 4 },
  productName: { fontWeight: '600' },
  productRating: { fontSize: 12, color: '#737373', marginTop: 2 },
  productPrice: { marginTop: 4 },
  row: { justifyContent: 'space-between' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' },
});
