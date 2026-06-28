import React from 'react';
import { Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { createMobileApiClient } from '../../lib/api';

export default function PrivacyScreen(): React.ReactElement {
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  async function exportData(): Promise<void> {
    try {
      const bundle = await createMobileApiClient().privacy.exportMine();
      Alert.alert('Exportación lista', `Datos exportados el ${bundle.exportedAt}`);
    } catch {
      Alert.alert('Error', 'No se pudo exportar tus datos.');
    }
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.content}>
        <NeoPageHeader title="Privacidad y datos" style={layout.pageHeaderInList} compact />
        <Card style={styles.card}>
          <Text style={text.label}>Exportar datos (GDPR)</Text>
          <Button variant="outline" onPress={() => void exportData()} style={styles.button}>
            Solicitar exportación
          </Button>
        </Card>
        <Text style={text.bodyMuted}>
          Para eliminación completa de cuenta, usa la versión web en /account/privacy.
        </Text>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  card: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    marginTop: 4,
  },
});
