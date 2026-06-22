import React, { useState, useMemo } from 'react';
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

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = api.hooks.useCategories();

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
    <TouchableOpacity
      onPress={() =>
        setSelectedCategory((current) => (current === item.id ? null : item.id))
      }
      style={styles.chip}
    >
      <Badge variant={selectedCategory === item.id ? 'primary' : 'secondary'}>
        {item.name}
      </Badge>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
    >
      <Card style={styles.productCard}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {item.category ? (
          <Text style={styles.categoryName}>{(item.category as Category).name}</Text>
        ) : null}
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tienda</Text>
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
        <ActivityIndicator size="large" color="#171717" style={styles.loader} />
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
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 12,
  },
  search: {
    marginBottom: 8,
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
    color: '#ef4444',
    textAlign: 'center',
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
    fontWeight: '600',
    color: '#171717',
  },
  categoryName: {
    fontSize: 13,
    color: '#737373',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#737373',
    marginTop: 24,
  },
});
