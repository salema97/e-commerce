import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#171717',
        tabBarInactiveTintColor: '#737373',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Tienda',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
        }}
      />
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
