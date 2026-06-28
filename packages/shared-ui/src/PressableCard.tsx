import React from 'react';
import { Pressable, View, Text, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';
import { Card } from './Card.js';
import { neo } from './theme.js';
import { NeoBrutalShadow } from './neo-brutal-shadow.js';

export interface PressableCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
  cardStyle?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function PressableCard({
  children,
  style,
  cardStyle,
  padding = 'md',
  fullWidth = false,
  ...pressableProps
}: PressableCardProps): React.ReactElement {
  return (
    <Pressable style={[styles.pressable, fullWidth && styles.fullWidth, style]} {...pressableProps}>
      {({ pressed }) => (
        <Card
          style={StyleSheet.flatten([cardStyle, pressed && styles.pressed])}
          padding={padding}
          fullWidth={fullWidth}
        >
          {children}
        </Card>
      )}
    </Pressable>
  );
}

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
}: CheckboxProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={styles.checkboxRow}
    >
      <NeoBrutalShadow shadow="xs">
        <View
          style={[
            styles.checkboxBox,
            checked && styles.checkboxBoxChecked,
            disabled && styles.checkboxDisabled,
          ]}
        >
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </NeoBrutalShadow>
      <Text style={[styles.checkboxLabel, disabled && styles.checkboxLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 3,
    borderColor: neo.onyx,
    backgroundColor: neo.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: neo.gold,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '900',
    color: neo.onyx,
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: neo.onyx,
  },
  checkboxLabelDisabled: {
    color: neo.muted,
  },
});
