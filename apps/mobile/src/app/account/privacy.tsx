import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@repo/shared-ui';
import { api } from '../../lib/api.js';

export default function PrivacyScreen(): React.ReactElement {
  async function exportData(): Promise<void> {
    try {
      const bundle = await api.client.privacy.exportMine();
      Alert.alert('Exportación lista', `Datos exportados el ${bundle.exportedAt}`);
    } catch {
      Alert.alert('Error', 'No se pudo exportar tus datos.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacidad y datos</Text>
        <Card style={styles.card}>
          <Text style={styles.label}>Exportar datos (GDPR)</Text>
          <Button variant="outline" onPress={() => void exportData()}>
            Solicitar exportación
          </Button>
        </Card>
        <Text style={styles.hint}>
          Para eliminación completa de cuenta, usa la versión web en /account/privacy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { gap: 12, marginBottom: 16 },
  label: { fontWeight: '600' },
  hint: { color: '#737373', fontSize: 13 },
});
