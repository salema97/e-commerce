import React from 'react';
import { Text, ScrollView, StyleSheet, Share } from 'react-native';
import { Button, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles } from '@repo/shared-ui';
import { NeoScreen } from '../../components/neo-screen';
import { useApiQueryHooks } from '../../lib/api';
import { formatPrice } from '@repo/shared-utils';

export default function ReferralsScreen(): React.ReactElement {
  const hooks = useApiQueryHooks();
  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();
  const { data: code } = hooks.useReferralCode();
  const { data: report } = hooks.useReferralPerformance('me');

  async function shareLink(): Promise<void> {
    if (!code?.link) return;
    await Share.share({ message: code.link });
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.content}>
        <NeoPageHeader title="Invita y gana" style={layout.pageHeaderInList} compact />

        {code ? (
          <Card>
            <Text style={text.mono}>{code.code}</Text>
            <Text style={[text.bodyMuted, styles.link]}>{code.link}</Text>
            <Button variant="outline" onPress={() => void shareLink()} style={styles.button}>
              Compartir enlace
            </Button>
          </Card>
        ) : null}

        {report ? (
          <Card style={styles.stats}>
            <Text style={text.label}>Conversiones: {report.totalConversions}</Text>
            <Text style={[text.body, styles.rowGap]}>
              Pendiente: {formatPrice(report.pendingCommission)}
            </Text>
            <Text style={text.body}>Pagado: {formatPrice(report.paidCommission)}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  link: {
    marginVertical: 12,
  },
  button: {
    marginTop: 4,
  },
  stats: {
    marginTop: 16,
    gap: 6,
  },
  rowGap: {
    marginVertical: 6,
  },
});
