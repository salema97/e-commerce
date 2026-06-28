import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Switch, getNeoTextStyles } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';

export function NotificationPreferencesPanel(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { data, isLoading } = hooks.useNotificationPreferences();
  const updatePreferences = hooks.useUpdateNotificationPreferences();
  const [message, setMessage] = useState('');

  const text = getNeoTextStyles();

  if (isLoading || !data) {
    return <Text style={text.bodyMuted}>Cargando preferencias…</Text>;
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
            <Text style={text.label}>Emails transaccionales</Text>
            <Text style={text.bodyMuted}>Confirmaciones, envíos y reembolsos.</Text>
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
            <Text style={text.label}>Emails de marketing</Text>
            <Text style={text.bodyMuted}>Promociones, carrito abandonado y win-back.</Text>
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
            <Text style={text.label}>WhatsApp</Text>
            <Text style={text.bodyMuted}>Actualizaciones de pedido por WhatsApp.</Text>
          </View>
          <Switch
            value={!data.whatsappOptOut}
            onValueChange={(value) => handleToggle('whatsappOptOut', value)}
            accessibilityLabel="Notificaciones WhatsApp"
          />
        </View>
      </Card>

      {message ? <Text style={text.body}>{message}</Text> : null}

      <Text style={[text.bodyMuted, styles.accountNote]}>
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
  accountNote: {
    lineHeight: 18,
    marginTop: 8,
  },
});
