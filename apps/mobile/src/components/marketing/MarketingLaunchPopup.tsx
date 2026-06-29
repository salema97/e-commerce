import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, getNeoTextStyles } from '@repo/shared-ui';
import type { MarketingPlacementPublic } from '@repo/shared-types';

interface MarketingLaunchPopupProps {
  placement: MarketingPlacementPublic;
  onDismiss: () => void;
  onCta: () => void;
}

export function MarketingLaunchPopup({
  placement,
  onDismiss,
  onCta,
}: MarketingLaunchPopupProps): React.ReactElement {
  const text = getNeoTextStyles();

  return (
    <Modal
      visible
      onClose={placement.dismissible ? onDismiss : undefined}
      closeOnOverlayPress={placement.dismissible}
    >
      <View accessibilityViewIsModal importantForAccessibility="yes">
        <Text style={text.title}>{placement.title}</Text>
        {placement.body ? <Text style={[text.bodyMuted, styles.body]}>{placement.body}</Text> : null}
        <View style={styles.actions}>
          {placement.ctaLabel ? (
            <Button size="sm" onPress={onCta}>
              {placement.ctaLabel}
            </Button>
          ) : null}
          {placement.dismissible ? (
            <Button size="sm" variant="ghost" onPress={onDismiss}>
              Cerrar
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
