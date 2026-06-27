import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, neo, ProductImage } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoStaggeredItem } from '../components/neo-animated';
import { useWishlist } from '../lib/wishlist';

export default function WishlistScreen(): React.ReactElement {
  const router = useRouter();
  const { items, isLoading, removeItem } = useWishlist();

  if (isLoading) {
    return (
      <NeoScreen style={styles.container}>
        <Text style={styles.loading}>Cargando lista de deseos…</Text>
      </NeoScreen>
    );
  }

  if (items.length === 0) {
    return (
      <NeoScreen style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.seasonLabel}>Favoritos</Text>
          <Text style={styles.title}>Lista de deseos</Text>
          <Text style={styles.emptyText}>Aún no guardaste productos.</Text>
          <Button onPress={() => router.push('/(tabs)/store')}>Explorar tienda</Button>
        </View>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.seasonLabel}>Favoritos</Text>
        <Text style={styles.title}>Lista de deseos ({items.length})</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <NeoStaggeredItem index={index}>
            <Card style={styles.itemCard} padding="sm">
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.productId } })
                }
              >
                <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </Pressable>
              <Button variant="outline" size="sm" onPress={() => void removeItem(item.productId)}>
                Eliminar
              </Button>
            </Card>
          </NeoStaggeredItem>
        )}
      />
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: neo.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  seasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: neo.muted,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  list: { padding: 16, paddingBottom: 120 },
  itemCard: { marginBottom: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  emptyText: { fontSize: 16, color: neo.muted, fontWeight: '600', marginBottom: 8 },
  loading: { textAlign: 'center', marginTop: 40, color: neo.muted, fontWeight: '600' },
});
