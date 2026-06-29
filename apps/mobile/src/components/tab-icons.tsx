import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabBarIconProps = {
  color: ColorValue;
  focused: boolean;
  size: number;
};

/** Outline when inactive, filled when active — similar to Lucide on web. */
export function neoTabIcon(outline: IconName, filled: IconName) {
  const Icon = ({ color, focused, size }: TabBarIconProps) => (
    <MaterialCommunityIcons name={focused ? filled : outline} size={size} color={color} />
  );
  Icon.displayName = `neoTabIcon(${String(outline)}, ${String(filled)})`;
  return Icon;
}

export const tabIcons = {
  home: neoTabIcon('home-outline', 'home'),
  store: neoTabIcon('store-outline', 'store'),
  wishlist: neoTabIcon('heart-outline', 'heart'),
  cart: neoTabIcon('cart-outline', 'cart'),
  account: neoTabIcon('account-outline', 'account'),
} as const;
