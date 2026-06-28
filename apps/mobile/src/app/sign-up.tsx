import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Button, Input, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoScaleIn } from '../components/neo-animated';
import { useAuth } from '../providers/AuthProvider';

export default function SignUpScreen(): React.ReactElement {
  const router = useRouter();
  const { signUp } = useAuth();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      await signUp(email, password, name || undefined);
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeoScreen style={layout.screen}>
      <NeoScaleIn style={StyleSheet.flatten([layout.content, styles.authContent])}>
        <NeoPageHeader
          title="Crear cuenta"
          subtitle="Regístrate para comprar y seguir tus pedidos"
          style={styles.header}
          compact
        />

        <Input
          label="Nombre"
          value={name}
          onChangeText={setName}
          containerStyle={styles.field}
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
          textContentType="newPassword"
          containerStyle={styles.field}
        />

        {error ? <Text style={[text.error, styles.errorGap]}>{error}</Text> : null}

        <Button
          onPress={handleSignUp}
          loading={loading}
          disabled={!email || !password}
          fullWidth
          style={styles.button}
        >
          Registrarme
        </Button>

        <View style={styles.footer}>
          <Text style={text.bodyMuted}>¿Ya tienes cuenta? </Text>
          <Link href="/sign-in" asChild>
            <Text style={text.link}>Inicia sesión</Text>
          </Link>
        </View>
      </NeoScaleIn>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  authContent: {
    flex: 1,
    justifyContent: 'center',
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
