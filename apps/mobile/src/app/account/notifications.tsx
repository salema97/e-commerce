import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  NeoPageHeader,
  getNeoLayoutStyles,
  getNeoTextStyles,
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
      <NeoScreen style={layout.screen}>
        <View style={layout.emptyState}>
          <Text style={[text.bodyMuted, styles.message]}>
            Inicia sesión para gestionar tus notificaciones.
          </Text>
          <Button onPress={() => router.replace('/sign-in')}>Iniciar sesión</Button>
        </View>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.contentPaddedBottom}>
        <NeoPageHeader
          title="Notificaciones"
          subtitle={user.email}
          compact
          style={layout.pageHeaderInList}
        >
          <Button variant="outline" size="sm" onPress={() => router.back()} style={styles.back}>
            Volver
          </Button>
        </NeoPageHeader>
        <NotificationPreferencesPanel />
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  back: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
