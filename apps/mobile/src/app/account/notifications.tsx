import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  NeoPageHeader,
  getNeoLayoutStyles,
  getNeoTextStyles,
  neo,
} from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useAuth } from '../../providers/AuthProvider';
import { NotificationPreferencesPanel } from '../../components/account/NotificationPreferencesPanel';

export default function NotificationPreferencesScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  if (!user) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={[text.bodyMuted, styles.message]}>
          Inicia sesión para gestionar tus notificaciones.
        </Text>
        <Button onPress={() => router.replace('/sign-in')}>Iniciar sesión</Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={styles.container}>
      <View style={styles.headerWrap}>
        <Button variant="outline" size="sm" onPress={() => router.back()}>
          Volver
        </Button>
        <NeoPageHeader title="Notificaciones" subtitle={user.email} compact />
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
    backgroundColor: neo.bg,
  },
  headerWrap: {
    gap: 8,
    paddingTop: 8,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
