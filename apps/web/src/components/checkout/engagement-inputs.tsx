'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiQueryHooks } from '@/lib/client-api';
import { useAuth } from '@/contexts/auth-context';

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
  const { user } = useAuth();
  const { useLoyaltyAccount, useLoyaltyRedemptionQuote } = useApiQueryHooks();
  const accountQuery = useLoyaltyAccount({ enabled: Boolean(user) });
  const quoteQuery = useLoyaltyRedemptionQuote(subtotal, loyaltyPoints || undefined, {
    enabled: Boolean(user) && subtotal > 0,
  });

  if (!user) {
    return (
      <div className="space-y-2">
        <Label htmlFor="referralCode">Código de referido</Label>
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
        <Label htmlFor="referralCode">Código de referido</Label>
        <Input
          id="referralCode"
          value={referralCode}
          onChange={(event) => onReferralCodeChange(event.target.value.toUpperCase())}
          placeholder="REF-XXXX"
        />
      </div>

      {account ? (
        <div className="space-y-2 border-[3px] border-neo-onyx bg-white p-3 text-sm shadow-[4px_4px_0_0_#111111]">
          <p className="font-bold uppercase">
            Puntos disponibles: <span className="text-neo-gold">{account.points}</span> ({account.tier})
          </p>
          <Label htmlFor="loyaltyPoints">Canjear puntos</Label>
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
