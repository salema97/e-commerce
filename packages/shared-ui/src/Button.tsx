import React from 'react';
import {
  Pressable,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { neo } from './theme.js';
import { getNeoFontFamilies } from './typography.js';
import { NeoBrutalShadow, type NeoShadowPreset } from './neo-brutal-shadow.js';

/** Matches web `buttonVariants` + `btn-brutal` in apps/web. */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'selected';

export type ButtonSize = 'default' | 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

function resolveVariant(
  variant: ButtonVariant,
): Exclude<ButtonVariant, 'primary' | 'default'> | 'default' {
  if (variant === 'primary') return 'default';
  return variant;
}

function getShadowPreset(variant: ReturnType<typeof resolveVariant>): NeoShadowPreset {
  switch (variant) {
    case 'default':
    case 'destructive':
      return 'lg';
    case 'outline':
    case 'secondary':
    case 'selected':
      return 'md';
    case 'ghost':
      return 'none';
    default:
      return 'none';
  }
}

function getVariantStyles(variant: ReturnType<typeof resolveVariant>) {
  switch (variant) {
    case 'secondary':
      return {
        face: { backgroundColor: neo.gold, borderColor: neo.onyx },
        text: { color: neo.onyx },
      };
    case 'selected':
      return {
        face: { backgroundColor: neo.onyx, borderColor: neo.onyx },
        text: { color: neo.white },
      };
    case 'outline':
      return {
        face: { backgroundColor: neo.white, borderColor: neo.onyx },
        text: { color: neo.onyx },
      };
    case 'ghost':
      return {
        face: { backgroundColor: 'transparent', borderColor: 'transparent' },
        text: { color: neo.onyx },
      };
    case 'destructive':
      return {
        face: { backgroundColor: neo.scarlet, borderColor: neo.onyx },
        text: { color: neo.white },
      };
    case 'default':
    default:
      return {
        face: { backgroundColor: neo.onyx, borderColor: neo.onyx },
        text: { color: neo.white },
      };
  }
}

function getSizeStyles(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return {
        face: { height: 36, paddingHorizontal: 12 },
        text: { fontSize: 12, lineHeight: 16 },
        displayFont: false,
      };
    case 'lg':
      return {
        face: { height: 56, paddingHorizontal: 32 },
        text: { fontSize: 16, lineHeight: 20 },
        displayFont: true,
      };
    case 'md':
    case 'default':
    default:
      return {
        face: { height: 44, paddingHorizontal: 20 },
        text: { fontSize: 14, lineHeight: 18 },
        displayFont: false,
      };
  }
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;
  const resolvedVariant = resolveVariant(variant);
  const variantStyles = getVariantStyles(resolvedVariant);
  const sizeStyles = getSizeStyles(size);
  const shadowPreset = getShadowPreset(resolvedVariant);
  const fonts = getNeoFontFamilies();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[styles.root, fullWidth && styles.fullWidth, style]}
    >
      <NeoBrutalShadow shadow={shadowPreset} hideShadow={isDisabled} fullWidth={fullWidth}>
        <View
          style={[
            styles.face,
            variantStyles.face,
            sizeStyles.face,
            fullWidth && styles.fullWidth,
            isDisabled && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                resolvedVariant === 'default' ||
                resolvedVariant === 'destructive' ||
                resolvedVariant === 'selected'
                  ? neo.white
                  : neo.onyx
              }
            />
          ) : (
            <Text
              style={[
                styles.label,
                sizeStyles.displayFont
                  ? { fontFamily: fonts.display }
                  : { fontFamily: fonts.sans },
                variantStyles.text,
                sizeStyles.text,
                textStyle,
              ]}
            >
              {children}
            </Text>
          )}
        </View>
      </NeoBrutalShadow>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    borderWidth: neo.borderWidth,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
