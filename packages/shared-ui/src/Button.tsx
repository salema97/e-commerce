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
import { NeoBrutalShadow, getNeoPressTransform, type NeoShadowPreset } from './neo-brutal-shadow.js';

/** Matches web `buttonVariants` + `btn-brutal` in apps/web. */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'selected';

export type ButtonSize = 'default' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Persistent pressed look (shadow hidden + offset). Same colors — like an active tab. */
  active?: boolean;
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
): Exclude<ButtonVariant, 'primary' | 'default' | 'selected'> | 'default' | 'outline' {
  if (variant === 'primary') return 'default';
  if (variant === 'selected') return 'outline';
  return variant;
}

function getShadowPreset(variant: ReturnType<typeof resolveVariant>): NeoShadowPreset {
  if (variant === 'ghost') return 'none';
  return 'lg';
}

function getVariantStyles(variant: ReturnType<typeof resolveVariant>) {
  switch (variant) {
    case 'secondary':
      return {
        face: { backgroundColor: neo.gold, borderColor: neo.onyx },
        text: { color: neo.onyx },
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

function isTextChild(children: React.ReactNode): boolean {
  return typeof children === 'string' || typeof children === 'number';
}

function getSizeStyles(size: ButtonSize) {
  switch (size) {
    case 'icon':
      return {
        face: { width: 44, height: 44, paddingHorizontal: 0 },
        text: { fontSize: 14, lineHeight: 18 },
        displayFont: false,
        iconOnly: true,
      };
    case 'sm':
      return {
        face: { height: 36, paddingHorizontal: 12 },
        text: { fontSize: 12, lineHeight: 16 },
        displayFont: false,
        iconOnly: false,
      };
    case 'lg':
      return {
        face: { height: 56, paddingHorizontal: 32 },
        text: { fontSize: 16, lineHeight: 20 },
        displayFont: true,
        iconOnly: false,
      };
    case 'md':
    case 'default':
    default:
      return {
        face: { height: 44, paddingHorizontal: 20 },
        text: { fontSize: 14, lineHeight: 18 },
        displayFont: false,
        iconOnly: false,
      };
  }
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  active = false,
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
  const isToggleActive = active || variant === 'selected';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading, selected: isToggleActive }}
      style={[styles.root, fullWidth && styles.fullWidth, style]}
    >
      {({ pressed }) => {
        const showPressed = (pressed && !isDisabled) || isToggleActive;
        const hasShadow = shadowPreset !== 'none';

        return (
          <NeoBrutalShadow
            shadow={shadowPreset}
            hideShadow={isDisabled || showPressed}
            reserveShadowSpace={hasShadow}
            fullWidth={fullWidth}
          >
            <View
              style={[
                styles.face,
                variantStyles.face,
                sizeStyles.face,
                fullWidth && !sizeStyles.iconOnly && styles.fullWidth,
                isDisabled && styles.disabled,
                showPressed && getNeoPressTransform(shadowPreset),
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    resolvedVariant === 'default' || resolvedVariant === 'destructive'
                      ? neo.white
                      : neo.onyx
                  }
                />
              ) : isTextChild(children) ? (
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
              ) : (
                children
              )}
            </View>
          </NeoBrutalShadow>
        );
      }}
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
