import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  PRODUCT_IMAGE_FALLBACK_LABEL,
  normalizeProductImageUrl,
} from '@repo/shared-utils';
import { neo } from './theme.js';

export type ProductImageVariant = 'card' | 'detail' | 'thumbnail';

export interface ProductImageProps {
  url?: string | null;
  alt?: string;
  fallbackLabel?: string;
  variant?: ProductImageVariant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const variantHeights: Record<ProductImageVariant, number> = {
  card: 130,
  detail: 280,
  thumbnail: 72,
};

export function ProductImage({
  url,
  alt,
  fallbackLabel = PRODUCT_IMAGE_FALLBACK_LABEL,
  variant = 'card',
  style,
  imageStyle,
}: ProductImageProps): React.ReactElement {
  const height = variantHeights[variant];
  const normalizedUrl = normalizeProductImageUrl(url);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    setLoadError(false);
  }, [normalizedUrl]);

  const hasImage = Boolean(normalizedUrl) && !loadError;

  return (
    <View
      style={[
        styles.container,
        variant === 'thumbnail' && styles.thumbnail,
        { minHeight: height },
        style,
      ]}
      accessibilityLabel={hasImage ? alt : fallbackLabel}
    >
      {hasImage ? (
        <Image
          source={{ uri: normalizedUrl! }}
          accessibilityLabel={alt ?? fallbackLabel}
          style={[styles.image, { height }, imageStyle]}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      ) : (
        <View style={[styles.fallback, { height }]}>
          <Text
            style={[
              styles.fallbackText,
              variant === 'thumbnail' && styles.fallbackTextSmall,
            ]}
          >
            {fallbackLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    backgroundColor: '#e8e0cc',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 72,
    borderBottomWidth: 0,
    borderWidth: 3,
    borderColor: neo.onyx,
  },
  image: {
    width: '100%',
  },
  fallback: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e0cc',
    paddingHorizontal: 8,
  },
  fallbackText: {
    color: neo.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    fontSize: 12,
  },
  fallbackTextSmall: {
    fontSize: 9,
    lineHeight: 12,
  },
});
