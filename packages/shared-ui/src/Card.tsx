import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { neo } from './theme.js';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold' | 'dark';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  variant = 'default',
}) => {
  return (
    <View style={[styles.base, variantStyles[variant], getPaddingStyle(padding), style]}>
      {children}
    </View>
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
    shadowColor: neo.onyx,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
});
