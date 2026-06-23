import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { Card } from '@repo/shared-ui';
import { api } from '../../lib/api.js';

export function NotificationPreferencesPanel(): React.ReactElement {
  const { data, isLoading } = api.hooks.useNotificationPreferences();
  const updatePreferences = api.hooks.useUpdateNotificationPreferences();
  const [message, setMessage] = useState('');

  if (isLoading || !data) {
    return <Text style={styles.loading}>Cargando preferencias…</Text>;
  }

  const handleToggle = (
    field: 'emailOptOut' | 'marketingEmailOptOut' | 'whatsappOptOut',
    enabled: boolean,
  ): void => {
    setMessage('');
    updatePreferences.mutate(
      { [field]: !enabled },
      {
        onSuccess: () => setMessage('Preferencias actualizadas.'),
        onError: () => setMessage('No pudimos guardar los cambios.'),
      },
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>Emails transaccionales</Text>
            <Text style={styles.hint}>Confirmaciones, envíos y reembolsos.</Text>
          </View>
          <Switch
            value={!data.emailOptOut}
            onValueChange={(value) => handleToggle('emailOptOut', value)}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>Emails de marketing</Text>
            <Text style={styles.hint}>Promociones, carrito abandonado y win-back.</Text>
          </View>
          <Switch
            value={!data.marketingEmailOptOut}
            onValueChange={(value) => handleToggle('marketingEmailOptOut', value)}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>WhatsApp</Text>
            <Text style={styles.hint}>Actualizaciones de pedido por WhatsApp.</Text>
          </View>
          <Switch
            value={!data.whatsappOptOut}
            onValueChange={(value) => handleToggle('whatsappOptOut', value)}
          />
        </View>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.clerkNote}>
        El restablecimiento de contraseña y la verificación de cuenta se gestionan con Clerk.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loading: {
    color: '#737373',
    fontSize: 15,
  },
  card: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#737373',
    lineHeight: 18,
  },
  message: {
    fontSize: 14,
    color: '#525252',
  },
  clerkNote: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 18,
    marginTop: 8,
  },
});
