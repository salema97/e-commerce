import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Button, Input, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoScaleIn } from '../components/neo-animated';
import { useAuth } from '../providers/AuthProvider';

export default function SignInScreen(): React.ReactElement {
  const router = useRouter();
  const { signIn } = useAuth();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeoScreen style={layout.screen}>
      <NeoScaleIn style={styles.content}>
        <NeoPageHeader
          title="Iniciar sesión"
          subtitle="Accede con tu cuenta de la tienda"
          style={styles.header}
          compact
        />

        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          containerStyle={styles.field}
        />

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          containerStyle={styles.field}
        />

        {error ? <Text style={[text.error, styles.errorGap]}>{error}</Text> : null}

        <Button
          onPress={handleSignIn}
          loading={loading}
          disabled={!email || !password}
          style={styles.button}
        >
          Ingresar
        </Button>

        <View style={styles.footer}>
          <Text style={text.bodyMuted}>¿No tienes cuenta? </Text>
          <Link href="/sign-up" asChild>
            <Text style={text.link}>Regístrate</Text>
          </Link>
        </View>
      </NeoScaleIn>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  errorGap: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});
