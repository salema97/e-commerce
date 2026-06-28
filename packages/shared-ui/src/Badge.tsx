import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { neo } from './theme.js';

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
    case 'default':
      return {
        container: { backgroundColor: neo.onyx },
        text: { color: neo.gold },
      };
    case 'secondary':
      return {
        container: { backgroundColor: neo.gold },
        text: { color: neo.onyx },
      };
    case 'outline':
      return {
        container: { backgroundColor: neo.white },
        text: { color: neo.onyx },
      };
    case 'destructive':
      return {
        container: { backgroundColor: neo.scarlet },
        text: { color: neo.white },
      };
    case 'success':
      return {
        container: { backgroundColor: neo.green },
        text: { color: neo.white },
      };
    default:
      return {
        container: { backgroundColor: neo.onyx },
        text: { color: neo.gold },
      };
  }
}

function getSizeStyles(size: BadgeProps['size']) {
  switch (size) {
    case 'sm':
      return { container: { paddingVertical: 2, paddingHorizontal: 8 }, text: { fontSize: 10 } };
    case 'md':
    default:
      return { container: { paddingVertical: 4, paddingHorizontal: 10 }, text: { fontSize: 11 } };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: neo.onyx,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
