import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Badge, PressableCard, neo } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';
import type { Product, Category } from '@repo/shared-types';

export default function StoreScreen(): React.ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = api.hooks.useProducts();

  const { data: categories, isLoading: categoriesLoading } = api.hooks.useCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory
        ? product.categoryId === selectedCategory
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const renderCategory = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() =>
        setSelectedCategory((current) => (current === item.id ? null : item.id))
      }
      style={styles.chip}
    >
      <Badge variant={selectedCategory === item.id ? 'secondary' : 'outline'}>
        {item.name}
      </Badge>
    </Pressable>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <PressableCard
      padding="sm"
      cardStyle={styles.productCard}
      onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
    >
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.category ? (
          <Text style={styles.categoryName}>{(item.category as Category).name}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          {item.compareAtPrice ? <Badge variant="destructive" size="sm">Oferta</Badge> : null}
        </View>
    </PressableCard>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {categoriesLoading ? null : (
        <FlatList
          horizontal
          data={categories ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.categories}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {productsLoading ? (
        <ActivityIndicator size="large" color={neo.onyx} style={styles.loader} />
      ) : productsError ? (
        <View style={styles.center}>
          <Text style={styles.error}>No se pudieron cargar los productos.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron productos.</Text>
          }
        />
      )}
    </SafeAreaView>
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
  loader: {
    marginTop: 40,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
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
