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
      <Label htmlFor="couponCode">Coupon code</Label>
      <div className="flex gap-2">
        <Input
          id="couponCode"
          value={couponCode}
          onChange={(e) => {
            onCouponCodeChange(e.target.value);
            if (applied) setApplied(false);
          }}
          placeholder="Enter coupon code"
          disabled={applied}
        />
        {applied ? (
          <Button type="button" variant="outline" onClick={handleRemove}>
            Remove
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handleApply}
            disabled={!couponCode.trim()}
          >
            Apply
          </Button>
        )}
      </div>
      {applied ? (
        <p className="text-sm text-muted-foreground">
          Coupon &quot;{couponCode}&quot; will be validated at checkout.
        </p>
      ) : null}
    </div>
  );
}
