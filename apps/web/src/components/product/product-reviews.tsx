'use client';

import * as React from 'react';
import type { ProductReview, ProductReviewSummary } from '@repo/shared-types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiQueryHooks } from '@/lib/client-api';

interface ProductReviewsProps {
  productId: string;
  initialReviews: ProductReview[];
  initialSummary: ProductReviewSummary;
}

export function ProductReviews({
  productId,
  initialReviews,
  initialSummary,
}: ProductReviewsProps) {
  const { user } = useAuth();
  const {
    useProductReviews,
    useProductReviewSummary,
    useCreateProductReview,
  } = useApiQueryHooks();

  const reviewsQuery = useProductReviews(productId, { initialData: initialReviews });
  const summaryQuery = useProductReviewSummary(productId, { initialData: initialSummary });
  const createReview = useCreateProductReview();

  const [rating, setRating] = React.useState(5);
  const [body, setBody] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);

  const reviews = reviewsQuery.data ?? initialReviews;
  const summary = summaryQuery.data ?? initialSummary;

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await createReview.mutateAsync({ productId, data: { rating, body } });
      setMessage('Reseña enviada. Se publicará tras moderación.');
      setBody('');
    } catch {
      setMessage('No se pudo enviar la reseña.');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reseñas</h2>
        <p className="text-sm text-muted-foreground">
          {summary.averageRating.toFixed(1)} ★ ({summary.reviewCount})
        </p>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {'★'.repeat(review.rating)}
                {review.isVerifiedPurchase ? ' · Compra verificada' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{review.body}</p>
            </CardContent>
          </Card>
        ))}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay reseñas publicadas.</p>
        ) : null}
      </div>

      {user ? (
        <form onSubmit={(event) => void submitReview(event)} className="space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">Escribe tu reseña</h3>
          <label className="text-sm font-medium" htmlFor="review-rating">
            Calificación (1–5)
          </label>
          <Input
            id="review-rating"
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
          <label className="text-sm font-medium" htmlFor="review-body">
            Tu reseña
          </label>
          <textarea
            id="review-body"
            className="min-h-24 w-full rounded-md border p-2 text-sm"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Cuéntanos tu experiencia"
            required
          />
          <Button type="submit" disabled={createReview.isPending}>
            {createReview.isPending ? 'Enviando...' : 'Enviar reseña'}
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
