import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Switch, neo } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';

export function NotificationPreferencesPanel(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { data, isLoading } = hooks.useNotificationPreferences();
  const updatePreferences = hooks.useUpdateNotificationPreferences();
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
            accessibilityLabel="Emails transaccionales"
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
            accessibilityLabel="Emails de marketing"
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
            accessibilityLabel="Notificaciones WhatsApp"
          />
        </View>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.accountNote}>
        Para cambiar tu contraseña, cierra sesión y usa «¿Olvidaste tu contraseña?» en el inicio de
        sesión de la tienda web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loading: {
    color: neo.muted,
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
    fontWeight: '700',
    color: neo.onyx,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: neo.muted,
    lineHeight: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: neo.onyx,
    fontWeight: '600',
  },
  accountNote: {
    fontSize: 12,
    color: neo.muted,
    lineHeight: 18,
    marginTop: 8,
    fontWeight: '600',
  },
});
