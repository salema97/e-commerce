import React from 'react';
import { View, Text, ScrollView, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { formatPrice } from '@repo/shared-utils';

export default function ReferralsScreen(): React.ReactElement {
  const { data: code } = api.hooks.useReferralCode();
  const { data: report } = api.hooks.useReferralPerformance('me');

  async function shareLink(): Promise<void> {
    if (!code?.link) return;
    await Share.share({ message: code.link });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Invita y gana</Text>

        {code ? (
          <Card>
            <Text style={styles.code}>{code.code}</Text>
            <Text style={styles.link}>{code.link}</Text>
            <Button variant="outline" onPress={() => void shareLink()} style={styles.button}>
              Compartir enlace
            </Button>
          </Card>
        ) : null}

        {report ? (
          <Card style={styles.stats}>
            <Text>Conversiones: {report.totalConversions}</Text>
            <Text>Pendiente: {formatPrice(report.pendingCommission)}</Text>
            <Text>Pagado: {formatPrice(report.paidCommission)}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  code: { fontSize: 22, fontWeight: '700', fontFamily: 'monospace', marginBottom: 8 },
  link: { color: '#525252', marginBottom: 12 },
  button: { marginTop: 4 },
  stats: { marginTop: 16, gap: 6 },
});
