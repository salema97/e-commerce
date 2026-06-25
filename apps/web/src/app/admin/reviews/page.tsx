import { ReviewsModeration } from './reviews-moderation';

export default function AdminReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Moderación de reseñas</h1>
      <ReviewsModeration />
    </div>
  );
}
