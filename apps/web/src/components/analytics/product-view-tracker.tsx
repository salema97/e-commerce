'use client';

import * as React from 'react';
import { trackEvent } from '@/lib/analytics/track';

export function ProductViewTracker({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  React.useEffect(() => {
    void trackEvent('product_view', { productId, productName });
  }, [productId, productName]);

  return null;
}
