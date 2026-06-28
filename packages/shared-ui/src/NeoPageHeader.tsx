import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { getNeoLayoutStyles, getNeoTextStyles } from './typography.js';

export interface NeoPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
}

export function NeoPageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  style,
  compact = false,
}: NeoPageHeaderProps): React.ReactElement {
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  return (
    <View
      style={[
        compact ? layout.pageHeaderCompact : layout.pageHeader,
        style,
      ]}
    >
      {eyebrow ? <Text style={[text.eyebrow, styles.eyebrowGap]}>{eyebrow}</Text> : null}
      <Text style={text.pageTitle}>{title}</Text>
      {subtitle ? <Text style={[text.pageSubtitle, styles.subtitleGap]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowGap: {
    marginBottom: 6,
  },
  subtitleGap: {
    marginTop: 8,
  },
});
