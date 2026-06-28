import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { neo } from './theme.js';
import { NeoBrutalShadow } from './neo-brutal-shadow.js';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold' | 'dark';
  fullWidth?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  variant = 'default',
  fullWidth = false,
}) => {
  return (
    <NeoBrutalShadow shadow="lg" fullWidth={fullWidth}>
      <View
        style={[
          styles.base,
          variantStyles[variant],
          getPaddingStyle(padding),
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {children}
      </View>
    </NeoBrutalShadow>
  );
};

const variantStyles = {
  default: {
    backgroundColor: neo.white,
  },
  gold: {
    backgroundColor: neo.gold,
  },
  dark: {
    backgroundColor: neo.onyx,
  },
} as const;

function getPaddingStyle(padding: CardProps['padding']): ViewStyle {
  switch (padding) {
    case 'none':
      return { padding: 0 };
    case 'sm':
      return { padding: 12 };
    case 'lg':
      return { padding: 24 };
    case 'md':
    default:
      return { padding: 16 };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 0,
    borderWidth: 3,
    borderColor: neo.onyx,
  },
  fullWidth: {
    width: '100%',
  },
});
