'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/track';

export function StoreAnalyticsTracker() {
  const searchParams = useSearchParams();
  const lastSearch = React.useRef<string | null>(null);
  const lastCategory = React.useRef<string | null>(null);

  React.useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    if (search && search !== lastSearch.current) {
      lastSearch.current = search;
      void trackEvent('search', { query: search });
    }

    if (category && category !== lastCategory.current) {
      lastCategory.current = category;
      void trackEvent('filter', { category });
    }
  }, [searchParams]);

  return null;
}
