import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { neo } from './theme.js';
import { getNeoFontFamilies } from './typography.js';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  const fonts = getNeoFontFamilies();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyles.shadow,
        variantStyles.container,
        sizeStyles.container,
        pressed && variant !== 'ghost' && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? neo.white : neo.onyx}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontFamily: size === 'lg' ? fonts.display : fonts.sans },
            variantStyles.text,
            sizeStyles.text,
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
};

function getVariantStyles(variant: ButtonProps['variant']) {
  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: neo.gold,
          borderColor: neo.onyx,
        },
        text: { color: neo.onyx },
        shadow: styles.shadowMd,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: neo.white,
          borderColor: neo.onyx,
        },
        text: { color: neo.onyx },
        shadow: styles.shadowMd,
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
        text: { color: neo.onyx },
        shadow: styles.shadowNone,
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: neo.scarlet,
          borderColor: neo.onyx,
        },
        text: { color: neo.white },
        shadow: styles.shadowLg,
      };
    case 'primary':
    default:
      return {
        container: {
          backgroundColor: neo.onyx,
          borderColor: neo.onyx,
        },
        text: { color: neo.white },
        shadow: styles.shadowPrimary,
      };
  }
}

function getSizeStyles(size: ButtonProps['size']) {
  switch (size) {
    case 'sm':
      return { container: { paddingVertical: 8, paddingHorizontal: 12 }, text: { fontSize: 12 } };
    case 'lg':
      return { container: { paddingVertical: 16, paddingHorizontal: 24 }, text: { fontSize: 18 } };
    case 'md':
    default:
      return { container: { paddingVertical: 12, paddingHorizontal: 16 }, text: { fontSize: 15 } };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 8,
  },
  shadowPrimary: {
    shadowColor: neo.gold,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  shadowLg: {
    shadowColor: neo.onyx,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  shadowMd: {
    shadowColor: neo.onyx,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  shadowNone: {
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
