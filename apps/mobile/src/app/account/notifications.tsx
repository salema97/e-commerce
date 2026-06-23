import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@repo/shared-ui';
import { NotificationPreferencesPanel } from '../../components/account/NotificationPreferencesPanel.js';

export default function NotificationPreferencesScreen(): React.ReactElement {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>Inicia sesión para gestionar tus notificaciones.</Text>
        <Button onPress={() => router.replace('/sign-in')}>Iniciar sesión</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          Volver
        </Button>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>
          {user?.primaryEmailAddress?.emailAddress ?? 'Cuenta activa'}
        </Text>
      </View>

      <View style={styles.content}>
        <NotificationPreferencesPanel />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  message: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
