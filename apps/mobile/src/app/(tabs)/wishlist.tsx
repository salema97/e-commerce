import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, NeoPageHeader, ProductImage, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { NeoStaggeredItem } from '../../components/neo-animated';
import { useWishlist } from '../../lib/wishlist';

export default function WishlistTabScreen(): React.ReactElement {
  const router = useRouter();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const { items, isLoading, removeItem } = useWishlist();

  if (isLoading) {
    return (
      <NeoScreen style={layout.screen} entrance={false}>
        <View style={layout.emptyState}>
          <Text style={text.bodyMuted}>Cargando favoritos…</Text>
        </View>
      </NeoScreen>
    );
  }

  if (items.length === 0) {
    return (
      <NeoScreen style={layout.screen} entrance={false}>
        <NeoPageHeader
          eyebrow="Guardados"
          title="Favoritos"
          compact
          style={layout.pageHeaderInset}
        />
        <View style={layout.emptyState}>
          <Text style={[text.bodyMuted, styles.emptyText]}>Aún no guardaste productos.</Text>
          <Button onPress={() => router.push('/(tabs)/store')}>Ir a la tienda</Button>
        </View>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={layout.screen} entrance={false}>
      <NeoPageHeader
        eyebrow="Guardados"
        title={`Favoritos (${items.length})`}
        style={layout.pageHeaderInset}
        compact
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={layout.listContent}
        renderItem={({ item, index }) => (
          <NeoStaggeredItem index={index}>
            <Card style={layout.section} padding="sm">
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.productId } })
                }
              >
                <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
                <Text style={[text.label, styles.name]} numberOfLines={2}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  name: { flex: 1 },
  emptyText: { marginBottom: 16, textAlign: 'center' },
});
