'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { useApiClient, useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { queryKeys } from '@repo/api-client';
import { formatDate } from '@repo/shared-utils';
import type { ProductReview } from '@repo/shared-types';

type PendingReview = ProductReview & {
  product?: { id: string; name: string; slug: string };
};

interface ReviewsModerationViewProps {
  initialReviews: PendingReview[];
}

export function ReviewsModerationView({ initialReviews }: ReviewsModerationViewProps) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const { useModerateReview } = useApiQueryHooks();
  const moderate = useModerateReview();

  const { data: reviews = initialReviews } = useQuery({
    queryKey: queryKeys.pendingReviews,
    queryFn: () => api.reviews.listPending(),
    initialData: initialReviews,
    enabled: authReady,
    refetchInterval: 30_000,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <AdminPageHeader
        eyebrow="Ventas"
        title="Reseñas"
        subtitle="Aprueba o rechaza reseñas de clientes antes de publicarlas en la tienda."
        metrics={[
          { label: 'Pendientes', value: String(reviews.length), accent: reviews.length > 0 },
        ]}
      />

      {reviews.length === 0 ? (
        <p className="text-sm font-medium text-muted-foreground">
          No hay reseñas pendientes de moderación.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="brutalist-card border-[3px] border-neo-onyx shadow-[6px_6px_0_0_#111111]">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  {'★'.repeat(review.rating)}
                  {review.isVerifiedPurchase ? ' · Compra verificada' : ''}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {review.product?.name ?? `Producto ${review.productId.slice(0, 8)}`}
                  {review.user?.name || review.user?.email
                    ? ` · ${review.user.name ?? review.user.email}`
                    : ''}
                  {review.createdAt ? ` · ${formatDate(review.createdAt)}` : ''}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.title ? <p className="font-medium">{review.title}</p> : null}
                <p>{review.body}</p>
                {review.product?.slug ? (
                  <Link
                    href={`/store/${review.product.slug}`}
                    className="text-sm font-bold uppercase underline-offset-4 hover:underline"
                  >
                    Ver producto
                  </Link>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={moderate.isPending}
                    onClick={() =>
                      void moderate.mutateAsync({
                        id: review.id,
                        data: { status: 'APPROVED' },
                      })
                    }
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={moderate.isPending}
                    onClick={() =>
                      void moderate.mutateAsync({
                        id: review.id,
                        data: { status: 'REJECTED' },
                      })
                    }
                  >
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
