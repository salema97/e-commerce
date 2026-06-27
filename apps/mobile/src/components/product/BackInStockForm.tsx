import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Input, neo } from '@repo/shared-ui';
import { useAuth } from '../../providers/AuthProvider';
import { useApiQueryHooks } from '../../lib/api';

interface BackInStockFormProps {
  productId: string;
}

export function BackInStockForm({ productId }: BackInStockFormProps): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const subscribe = hooks.useSubscribeBackInStock();

  const handleSubmit = (): void => {
    setMessage('');
    subscribe.mutate(
      { productId, email: email.trim() },
      {
        onSuccess: () => setMessage('Te avisaremos cuando vuelva a haber stock.'),
        onError: () => setMessage('No pudimos registrar tu alerta. Intenta de nuevo.'),
      },
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Avísame cuando haya stock</Text>
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button onPress={handleSubmit} disabled={subscribe.isPending || email.trim().length === 0}>
        {subscribe.isPending ? 'Registrando…' : 'Suscribirme'}
      </Button>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 14,
    color: neo.muted,
    fontWeight: '600',
  },
});
