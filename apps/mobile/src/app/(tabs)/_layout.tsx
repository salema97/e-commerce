import React from 'react';
import { Tabs } from 'expo-router';
import { neo } from '@repo/shared-ui';

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: neo.bg,
          borderTopWidth: 3,
          borderTopColor: neo.onyx,
          height: 64,
          paddingBottom: 8,
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
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="store" options={{ title: 'Tienda' }} />
      <Tabs.Screen name="cart" options={{ title: 'Carrito' }} />
      <Tabs.Screen name="account" options={{ title: 'Cuenta' }} />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
