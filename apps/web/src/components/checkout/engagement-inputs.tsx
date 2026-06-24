'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useApiQueryHooks } from '@/lib/client-api';
import { useAuth } from '@clerk/nextjs';

interface EngagementInputsProps {
  subtotal: number;
  referralCode: string;
  onReferralCodeChange: (value: string) => void;
  loyaltyPoints: number;
  onLoyaltyPointsChange: (value: number) => void;
}

export function EngagementInputs({
  subtotal,
  referralCode,
  onReferralCodeChange,
  loyaltyPoints,
  onLoyaltyPointsChange,
}: EngagementInputsProps) {
  const { isSignedIn } = useAuth();
  const { useLoyaltyAccount, useLoyaltyRedemptionQuote } = useApiQueryHooks();
  const accountQuery = useLoyaltyAccount({ enabled: isSignedIn });
  const quoteQuery = useLoyaltyRedemptionQuote(subtotal, loyaltyPoints || undefined, {
    enabled: isSignedIn && subtotal > 0,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && !referralCode) {
      onReferralCodeChange(ref);
    }
  }, [onReferralCodeChange, referralCode]);

  if (!isSignedIn) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium" htmlFor="referralCode">
          Código de referido
        </label>
        <Input
          id="referralCode"
          value={referralCode}
          onChange={(event) => onReferralCodeChange(event.target.value.toUpperCase())}
          placeholder="REF-XXXX"
        />
      </div>
    );
  }

  const account = accountQuery.data;
  const quote = quoteQuery.data;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="referralCode">
          Código de referido
        </label>
        <Input
          id="referralCode"
          value={referralCode}
          onChange={(event) => onReferralCodeChange(event.target.value.toUpperCase())}
          placeholder="REF-XXXX"
        />
      </div>

      {account ? (
        <div className="space-y-2 rounded-md border p-3 text-sm">
          <p>
            Puntos disponibles: <strong>{account.points}</strong> ({account.tier})
          </p>
          <label className="text-sm font-medium" htmlFor="loyaltyPoints">
            Canjear puntos
          </label>
          <Input
            id="loyaltyPoints"
            type="number"
            min={0}
            max={quote?.maxRedeemablePoints ?? account.points}
            value={loyaltyPoints || ''}
            onChange={(event) => onLoyaltyPointsChange(Number(event.target.value) || 0)}
          />
          {quote && loyaltyPoints > 0 ? (
            <p className="text-muted-foreground">
              Descuento estimado: ${quote.discountAmount.toFixed(2)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
