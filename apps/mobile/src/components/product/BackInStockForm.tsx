import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Button, Card } from '@repo/shared-ui';
import { api } from '../../lib/api.js';

interface BackInStockFormProps {
  productId: string;
}

export function BackInStockForm({ productId }: BackInStockFormProps): React.ReactElement {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? '');
  const [message, setMessage] = useState('');
  const subscribe = api.hooks.useSubscribeBackInStock();

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
      <TextInput
        style={styles.input}
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
    fontWeight: '600',
    color: '#171717',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#171717',
  },
  message: {
    fontSize: 14,
    color: '#525252',
  },
});
