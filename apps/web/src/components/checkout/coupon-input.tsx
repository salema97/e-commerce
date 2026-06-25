'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CouponInputProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
}

export function CouponInput({ couponCode, onCouponCodeChange }: CouponInputProps) {
  const [applied, setApplied] = React.useState(false);

  function handleApply() {
    if (couponCode.trim()) {
      setApplied(true);
    }
  }

  function handleRemove() {
    onCouponCodeChange('');
    setApplied(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="couponCode">Código de cupón</Label>
      <div className="flex gap-2">
        <Input
          id="couponCode"
          value={couponCode}
          onChange={(e) => {
            onCouponCodeChange(e.target.value);
            if (applied) setApplied(false);
          }}
          placeholder="Ingresa el código de cupón"
          disabled={applied}
        />
        {applied ? (
          <Button type="button" variant="outline" onClick={handleRemove}>
            Eliminar
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handleApply}
            disabled={!couponCode.trim()}
          >
            Aplicar
          </Button>
        )}
      </div>
      {applied ? (
        <p className="text-sm text-muted-foreground">
          El cupón &quot;{couponCode}&quot; se validará al finalizar la compra.
        </p>
      ) : null}
    </div>
  );
}
