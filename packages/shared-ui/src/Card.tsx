import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 'md' }) => {
  return (
    <View style={[styles.base, getPaddingStyle(padding), style]}>
      {children}
    </View>
  );
};

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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
