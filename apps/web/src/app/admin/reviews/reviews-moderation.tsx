'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiQueryHooks } from '@/lib/client-api';

export function ReviewsModeration() {
  const { usePendingReviews, useModerateReview } = useApiQueryHooks();
  const pendingQuery = usePendingReviews();
  const moderate = useModerateReview();

  const reviews = pendingQuery.data ?? [];

  if (pendingQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando reseñas pendientes...</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reseñas pendientes de moderación.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {'★'.repeat(review.rating)} · Producto {review.productId.slice(0, 8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{review.body}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={moderate.isPending}
                onClick={() => void moderate.mutateAsync({ id: review.id, data: { status: 'APPROVED' } })}
              >
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={moderate.isPending}
                onClick={() => void moderate.mutateAsync({ id: review.id, data: { status: 'REJECTED' } })}
              >
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
