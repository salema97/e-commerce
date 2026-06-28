import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { getNeoLayoutStyles } from '@repo/shared-ui';

type NeoStickyFooterProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Fixed bottom bar for CTAs (cart, product, home, account). */
export function NeoStickyFooter({ children, style }: NeoStickyFooterProps): React.ReactElement {
  const layout = getNeoLayoutStyles();
  return <View style={[layout.stickyFooter, style]}>{children}</View>;
}
