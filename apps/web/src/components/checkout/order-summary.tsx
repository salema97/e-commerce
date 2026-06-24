import { Separator } from '@/components/ui/separator';
import { ProductImage } from '@/components/store/product-image';
import { formatPrice } from '@repo/shared-utils';
import type { CartItem } from '@/lib/cart-store';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponCode?: string;
}

export function OrderSummary({
  items,
  subtotal,
  discount,
  tax,
  shipping,
  total,
  couponCode,
}: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={`${item.productId}:${item.variantId ?? ''}`}
            className="flex items-start gap-3 text-sm"
          >
            <ProductImage url={item.imageUrl} alt={item.name} variant="thumbnail" />
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
              </div>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex justify-between text-green-600">
            <span>
              Descuento{couponCode ? ` (${couponCode})` : null}
            </span>
            <span>-{formatPrice(discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>IVA (15%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
