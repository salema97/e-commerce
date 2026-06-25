import { getServerApiClient } from '@/lib/api';
import { ReviewsModerationView } from './reviews-moderation-view';
import type { ProductReview } from '@repo/shared-types';

type PendingReview = ProductReview & {
  product?: { id: string; name: string; slug: string };
};

export default async function AdminReviewsPage() {
  const api = await getServerApiClient();
  const initialReviews = await api.reviews.listPending().catch(() => [] as PendingReview[]);

  return <ReviewsModerationView initialReviews={initialReviews} />;
}
