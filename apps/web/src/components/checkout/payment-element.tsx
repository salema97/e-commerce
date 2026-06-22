'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@repo/shared-utils';

const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

// Stripe.js is loaded lazily and cached by the SDK.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

interface PaymentElementWrapperProps {
  clientSecret: string;
  orderId: string;
  total: number;
}

function CheckoutForm({ clientSecret, orderId, total }: PaymentElementWrapperProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      return;
    }

    // Payment succeeded (or requires no further action). The webhook is the
    // source of truth for order status; redirect to the order detail page.
    router.push(`/orders/${orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{ layout: 'tabs' }}
        // Re-mount when a new client secret arrives (e.g. retried order).
        key={clientSecret}
      />
      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? 'Processing...' : `Pay ${formatPrice(total)}`}
      </Button>
      <p className="text-xs text-muted-foreground">
        Payment is confirmed securely by Stripe. Your card details never touch
        our servers.
      </p>
    </form>
  );
}

interface PaymentFormProps {
  clientSecret: string;
  orderId: string;
  total: number;
}

export function PaymentForm({ clientSecret, orderId, total }: PaymentFormProps) {
  const options = React.useMemo(
    () => ({ clientSecret, appearance: { theme: 'stripe' as const } }),
    [clientSecret],
  );

  return (
    <Elements stripe={getStripe()} options={options}>
      <CheckoutForm clientSecret={clientSecret} orderId={orderId} total={total} />
    </Elements>
  );
}
