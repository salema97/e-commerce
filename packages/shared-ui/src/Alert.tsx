import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { neo } from './theme.js';
import { NeoBrutalShadow } from './neo-brutal-shadow.js';

export interface AlertProps {
  variant?: 'default' | 'destructive';
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  title,
  children,
  style,
  titleStyle,
  textStyle,
  fullWidth = true,
}) => {
  const isDestructive = variant === 'destructive';

  return (
    <NeoBrutalShadow shadow="md" fullWidth={fullWidth}>
      <View
        style={[
          styles.alert,
          isDestructive ? styles.destructive : styles.default,
          fullWidth && styles.fullWidth,
          style,
        ]}
        accessibilityRole="alert"
      >
        {title ? (
          <Text style={[styles.title, isDestructive && styles.destructiveTitle, titleStyle]}>
            {title}
          </Text>
        ) : null}
        {typeof children === 'string' ? (
          <Text style={[styles.text, isDestructive && styles.destructiveText, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </NeoBrutalShadow>
  );
};

const styles = StyleSheet.create({
  alert: {
    borderWidth: 3,
    borderColor: neo.onyx,
    padding: 16,
  },
  fullWidth: {
    width: '100%',
  },
  default: {
    backgroundColor: neo.white,
  },
  destructive: {
    backgroundColor: neo.bg,
    borderColor: neo.scarlet,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: neo.onyx,
    marginBottom: 4,
  },
  destructiveTitle: {
    color: neo.scarlet,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: neo.muted,
    lineHeight: 18,
  },
  destructiveText: {
    color: neo.onyx,
  },
});
