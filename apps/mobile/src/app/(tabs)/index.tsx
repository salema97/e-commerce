import React from 'react';
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
import { Card, Button } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';
import type { Product } from '@repo/shared-types';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { data: products, isLoading, error } = api.hooks.useProducts();

  const featuredProducts = React.useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.isFeatured).slice(0, 6);
  }, [products]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })}
    >
      <Card style={styles.productCard}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Bienvenido</Text>
        <Text style={styles.subheading}>Descubre nuestros productos destacados</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#171717" style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>No se pudieron cargar los productos.</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
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
            <Text style={styles.empty}>No hay productos destacados por ahora.</Text>
          }
        />
      )}

      <View style={styles.footer}>
        <Button onPress={() => router.push('/(tabs)/store')} size="lg">
          Explorar tienda
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
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
  },
  subheading: {
    fontSize: 16,
    color: '#737373',
    marginTop: 4,
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
    color: '#ef4444',
    textAlign: 'center',
  },
  errorDetail: {
    color: '#737373',
    textAlign: 'center',
    marginTop: 8,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    marginHorizontal: 6,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#171717',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  empty: {
    textAlign: 'center',
    color: '#737373',
    marginTop: 24,
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
});
