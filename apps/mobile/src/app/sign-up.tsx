import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '@repo/shared-ui';

export default function SignUpScreen(): React.ReactElement {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (): Promise<void> => {
    if (!isLoaded || !signUp) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else if (result.status === 'missing_requirements') {
        setError('Please verify your email to continue.');
      } else {
        setError('Sign-up step not complete. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-up failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.row}>
          <Input
            label="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            containerStyle={[styles.field, styles.halfField]}
          />
          <Input
            label="Apellido"
            value={lastName}
            onChangeText={setLastName}
            containerStyle={[styles.field, styles.halfField]}
          />
        </View>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          onPress={handleSignUp}
          loading={loading}
          disabled={!email || !password}
          style={styles.button}
        >
          Registrarme
        </Button>

        <View style={styles.footer}>
          <Text>¿Ya tienes cuenta? </Text>
          <Link href="/sign-in" asChild>
            <Text style={styles.link}>Inicia sesión</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#171717',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: '#ef4444',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: '#171717',
    fontWeight: '600',
  },
});
