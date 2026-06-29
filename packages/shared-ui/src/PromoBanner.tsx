import React from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';
import { Button } from './Button.js';
import { neo } from './theme.js';
import { getNeoTextStyles } from './typography.js';
import { PressableCard } from './PressableCard.js';

export interface PromoBannerProps {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  onPress?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  variant?: 'banner' | 'strip';
  style?: ViewStyle;
}

export function PromoBanner({
  title,
  body,
  imageUrl,
  ctaLabel,
  onPress,
  onDismiss,
  dismissible = true,
  variant = 'banner',
  style,
}: PromoBannerProps): React.ReactElement {
  const text = getNeoTextStyles();
  const isStrip = variant === 'strip';

  const content = (
    <View style={[styles.inner, isStrip && styles.stripInner]}>
      {imageUrl && !isStrip ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}
      <View style={styles.copy}>
        <Text style={[text.label, isStrip && styles.stripTitle]}>{title}</Text>
        {body ? (
          <Text style={[text.bodyMuted, isStrip && styles.stripBody]} numberOfLines={isStrip ? 1 : 3}>
            {body}
          </Text>
        ) : null}
        {ctaLabel && onPress ? (
          <View style={styles.ctaRow}>
            <Button size="sm" onPress={onPress}>
              {ctaLabel}
            </Button>
          </View>
        ) : null}
      </View>
      {dismissible && onDismiss ? (
        <Button size="sm" variant="ghost" onPress={onDismiss} style={styles.dismiss}>
          ×
        </Button>
      ) : null}
    </View>
  );

  if (onPress && !ctaLabel) {
    return (
      <PressableCard onPress={onPress} style={style} cardStyle={isStrip ? styles.stripCard : undefined}>
        {content}
      </PressableCard>
    );
  }

  return (
    <View style={[styles.wrapper, isStrip && styles.stripWrapper, style]}>
      <View style={[styles.card, isStrip && styles.stripCard]}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  stripWrapper: {
    marginBottom: 8,
  },
  card: {
    borderWidth: 3,
    borderColor: neo.onyx,
    backgroundColor: neo.white,
    overflow: 'hidden',
  },
  stripCard: {
    backgroundColor: neo.gold,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stripInner: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  image: {
    width: 120,
    minHeight: 80,
  },
  copy: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  stripTitle: {
    fontSize: 12,
  },
  stripBody: {
    fontSize: 11,
  },
  ctaRow: {
    marginTop: 8,
  },
  dismiss: {
    alignSelf: 'flex-start',
    margin: 4,
    minWidth: 32,
  },
});
