'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CartItem } from '@/lib/cart-store';
import { OrderSummary } from './order-summary';

interface CheckoutOrderSummaryCardProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode?: string;
}

export function CheckoutOrderSummaryCard(props: CheckoutOrderSummaryCardProps) {
  return (
    <div>
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Resumen del pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderSummary {...props} />
        </CardContent>
      </Card>
    </div>
  );
}
