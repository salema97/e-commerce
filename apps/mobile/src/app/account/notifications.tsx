import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, neo } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useAuth } from '../../providers/AuthProvider';
import { NotificationPreferencesPanel } from '../../components/account/NotificationPreferencesPanel';

export default function NotificationPreferencesScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <NeoScreen style={styles.center}>
        <Text style={styles.message}>Inicia sesión para gestionar tus notificaciones.</Text>
        <Button onPress={() => router.replace('/sign-in')}>Iniciar sesión</Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.header}>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          Volver
        </Button>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.subtitle}>{user.email}</Text>
      </View>

      <View style={styles.content}>
        <NotificationPreferencesPanel />
      </View>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: neo.onyx,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: neo.onyx,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
  },
});
