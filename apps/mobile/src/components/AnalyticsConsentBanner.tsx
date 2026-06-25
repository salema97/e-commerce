import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, neo } from '@repo/shared-ui';
import {
  DEFAULT_ANALYTICS_CONSENT,
  getStoredAnalyticsConsent,
  saveAnalyticsConsent,
} from '../lib/analytics-consent.js';

export function AnalyticsConsentBanner(): React.ReactElement | null {
  const [visible, setVisible] = useState(false);

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
      <Text style={styles.title}>Privacidad y analítica</Text>
      <Text style={styles.body}>
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
    zIndex: 100,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: neo.onyx,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    color: neo.muted,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
