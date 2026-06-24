'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiQueryHooks } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';

export default function AccountReferralsPage() {
  const { useReferralCode, useReferralPerformance } = useApiQueryHooks();
  const codeQuery = useReferralCode();
  const performanceQuery = useReferralPerformance('me');

  const code = codeQuery.data;
  const report = performanceQuery.data;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Invita y gana</h1>

      {code ? (
        <Card>
          <CardHeader>
            <CardTitle>Tu código</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-mono font-bold">{code.code}</p>
            <p className="text-sm text-muted-foreground break-all">{code.link}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(code.link)}
            >
              Copiar enlace
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
            <p>Conversiones: {report.totalConversions}</p>
            <p>Pendiente: {formatPrice(report.pendingCommission)}</p>
            <p>Pagado: {formatPrice(report.paidCommission)}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
