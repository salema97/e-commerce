import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#ffffff' : '#171717'}
        />
      ) : (
        <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

function getVariantStyles(variant: ButtonProps['variant']) {
  switch (variant) {
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
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        text: { color: '#171717' },
      };
    case 'destructive':
      return {
        container: { backgroundColor: '#ef4444' },
        text: { color: '#ffffff' },
      };
    case 'primary':
    default:
      return {
        container: { backgroundColor: '#171717' },
        text: { color: '#ffffff' },
      };
  }
}

function getSizeStyles(size: ButtonProps['size']) {
  switch (size) {
    case 'sm':
      return { container: { paddingVertical: 8, paddingHorizontal: 12 }, text: { fontSize: 14 } };
    case 'lg':
      return { container: { paddingVertical: 16, paddingHorizontal: 24 }, text: { fontSize: 18 } };
    case 'md':
    default:
      return { container: { paddingVertical: 12, paddingHorizontal: 16 }, text: { fontSize: 16 } };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
