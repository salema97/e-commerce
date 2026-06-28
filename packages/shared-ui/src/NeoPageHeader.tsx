import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { getNeoLayoutStyles, getNeoTextStyles } from './typography.js';

export interface NeoPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Slot to the right of the title block (e.g. search field). */
  trailing?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
  align?: 'left' | 'center';
}

export function NeoPageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  trailing,
  style,
  compact = false,
  align = 'left',
}: NeoPageHeaderProps): React.ReactElement {
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const centered = align === 'center';

  return (
    <View
      style={[
        compact ? layout.pageHeaderCompact : layout.pageHeader,
        centered && styles.centered,
        style,
      ]}
    >
      <View style={[styles.titleRow, trailing ? styles.titleRowWithTrailing : null]}>
        <View style={[styles.titleBlock, trailing ? styles.titleBlockTrailing : null]}>
          {eyebrow ? (
            <Text style={[text.eyebrow, styles.eyebrowGap, centered && styles.textCenter]}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={[text.pageTitle, centered && styles.textCenter]}>{title}</Text>
          {subtitle ? (
            <Text style={[text.pageSubtitle, styles.subtitleGap, centered && styles.textCenter]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    width: '100%',
  },
  titleRowWithTrailing: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  titleBlock: {
    alignSelf: 'stretch',
  },
  titleBlockTrailing: {
    flex: 1,
    flexShrink: 1,
  },
  trailing: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
    paddingBottom: 2,
  },
  centered: {
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  eyebrowGap: {
    marginBottom: 6,
  },
  subtitleGap: {
    marginTop: 8,
  },
});
