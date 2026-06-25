'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@repo/shared-utils';
import type { ReferralCode, ReferralPerformanceReport } from '@repo/shared-types';

interface AccountReferralsPanelProps {
  initialCode: ReferralCode | null;
  initialReport: ReferralPerformanceReport | null;
}

export function AccountReferralsPanel({
  initialCode,
  initialReport,
}: AccountReferralsPanelProps) {
  const code = initialCode;
  const report = initialReport;

  return (
    <div className="space-y-6">
      {code ? (
        <Card className="brutalist-card">
          <CardHeader>
            <CardTitle>Tu código</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-2xl font-bold">{code.code}</p>
            <p className="break-all text-sm text-muted-foreground">{code.link}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(code.link)}
            >
              Copiar enlace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Generando tu código de referido...</p>
      )}

      {report ? (
        <Card className="brutalist-card">
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
