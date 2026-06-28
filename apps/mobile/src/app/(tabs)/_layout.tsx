import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryKeys } from '@repo/api-client';
import { neo } from '@repo/shared-ui';
import { createMobileApiClient } from '../../lib/api';
import { tabIcons } from '../../components/tab-icons';

export default function TabLayout(): React.ReactElement {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.catalog({ page: 1, limit: 48, sort: 'newest' }),
      queryFn: () => createMobileApiClient().catalog.browse({ page: 1, limit: 48, sort: 'newest' }),
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.categories,
      queryFn: () => createMobileApiClient().categories.findAll(),
    });
  }, [queryClient]);

  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: neo.bg,
          borderTopWidth: 3,
          borderTopColor: neo.onyx,
          height: 56 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: neo.onyx,
        tabBarInactiveTintColor: neo.muted,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: tabIcons.home }}
      />
      <Tabs.Screen
        name="store"
        options={{ title: 'Tienda', tabBarIcon: tabIcons.store }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Carrito', tabBarIcon: tabIcons.cart }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Cuenta', tabBarIcon: tabIcons.account }}
      />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
