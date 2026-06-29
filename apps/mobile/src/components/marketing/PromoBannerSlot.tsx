import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PromoBanner } from '@repo/shared-ui';
import { useMarketingPlacements } from '../../providers/MarketingPlacementProvider';
import { isAllowedMobileCta } from '../../lib/marketing-dismiss';
import type { MarketingPlacementPublic, MarketingPlacementSlot } from '@repo/shared-types';

interface PromoBannerSlotProps {
  slot: MarketingPlacementSlot;
  variant?: 'banner' | 'strip';
}

export function PromoBannerSlot({
  slot,
  variant = 'banner',
}: PromoBannerSlotProps): React.ReactElement | null {
  const router = useRouter();
  const { getSlot, dismiss } = useMarketingPlacements();
  const bucket = getSlot(slot);
  const items = variant === 'strip' ? bucket.promoStrips : bucket.banners;

  if (items.length === 0) {
    return null;
  }

  function handleCta(placement: MarketingPlacementPublic) {
    const href = placement.ctaHref ?? (placement.promotionId ? '/store' : undefined);
    if (!href || !isAllowedMobileCta(href)) return;
    router.push(href as never);
  }

  return (
    <View style={styles.container}>
      {items.map((placement) => (
        <PromoBanner
          key={placement.id}
          title={placement.title}
          body={placement.body}
          imageUrl={placement.imageUrl}
          ctaLabel={placement.ctaLabel}
          variant={variant}
          dismissible={placement.dismissible}
          onPress={placement.ctaLabel ? () => handleCta(placement) : undefined}
          onDismiss={() => void dismiss(placement)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 8,
  },
});
