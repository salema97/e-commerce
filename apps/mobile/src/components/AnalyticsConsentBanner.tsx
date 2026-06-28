import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, getNeoTextStyles, neo } from '@repo/shared-ui';
import {
  DEFAULT_ANALYTICS_CONSENT,
  getStoredAnalyticsConsent,
  saveAnalyticsConsent,
} from '../lib/analytics-consent';

export function AnalyticsConsentBanner(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);

  const text = getNeoTextStyles();

  useEffect(() => {
    void getStoredAnalyticsConsent().then((stored) => {
      if (!stored) {
        setVisible(true);
      }
    });
  }, []);

  if (!visible) {
    return null;
  }

  async function acceptAnalytics(): Promise<void> {
    await saveAnalyticsConsent({ analytics: true });
    setVisible(false);
  }

  async function rejectAnalytics(): Promise<void> {
    await saveAnalyticsConsent(DEFAULT_ANALYTICS_CONSENT);
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={text.label}>Privacidad y analítica</Text>
      <Text style={[text.bodyMuted, styles.body]}>
        Usamos eventos anónimos para mejorar la tienda. Puedes aceptar analítica o continuar solo
        con lo esencial.
      </Text>
      <View style={styles.actions}>
        <Button size="sm" onPress={() => void acceptAnalytics()}>
          Aceptar
        </Button>
        <Button size="sm" variant="ghost" onPress={() => void rejectAnalytics()}>
          Solo esencial
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: neo.bg,
    borderWidth: 3,
    borderColor: neo.onyx,
    shadowColor: neo.onyx,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    zIndex: 100,
  },
  body: {
    marginBottom: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
