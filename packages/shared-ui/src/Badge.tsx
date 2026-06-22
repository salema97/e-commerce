import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive' | 'success';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.base, variantStyles.container, sizeStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
};

function getVariantStyles(variant: BadgeProps['variant']) {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: '#171717' },
        text: { color: '#ffffff' },
      };
    case 'secondary':
      return {
        container: { backgroundColor: '#f5f5f5' },
        text: { color: '#171717' },
      };
    case 'outline':
      return {
        container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e5e5e5' },
        text: { color: '#171717' },
      };
    case 'destructive':
      return {
        container: { backgroundColor: '#fef2f2' },
        text: { color: '#ef4444' },
      };
    case 'success':
      return {
        container: { backgroundColor: '#f0fdf4' },
        text: { color: '#22c55e' },
      };
    case 'default':
    default:
      return {
        container: { backgroundColor: '#fafafa' },
        text: { color: '#525252' },
      };
  }
}

function getSizeStyles(size: BadgeProps['size']) {
  switch (size) {
    case 'sm':
      return { container: { paddingVertical: 2, paddingHorizontal: 8 }, text: { fontSize: 11 } };
    case 'md':
    default:
      return { container: { paddingVertical: 4, paddingHorizontal: 10 }, text: { fontSize: 12 } };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
  },
  text: {
    fontWeight: '500',
  },
});
