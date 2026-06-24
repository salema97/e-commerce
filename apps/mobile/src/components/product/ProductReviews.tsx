import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Card } from '@repo/shared-ui';
import { api } from '../../lib/api.js';
import { useAuth } from '@clerk/clerk-expo';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps): React.ReactElement {
  const { isSignedIn } = useAuth();
  const { data: reviews } = api.hooks.useProductReviews(productId);
  const { data: summary } = api.hooks.useProductReviewSummary(productId);
  const createReview = api.hooks.useCreateProductReview();

  const [rating, setRating] = useState('5');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function submitReview(): Promise<void> {
    setMessage(null);
    try {
      await createReview.mutateAsync({
        productId,
        data: { rating: Number(rating), body },
      });
      setMessage('Reseña enviada. Se publicará tras moderación.');
      setBody('');
    } catch {
      setMessage('No se pudo enviar la reseña.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reseñas</Text>
      <Text style={styles.summary}>
        {(summary?.averageRating ?? 0).toFixed(1)} ★ ({summary?.reviewCount ?? 0})
      </Text>

      {(reviews ?? []).map((review) => (
        <Card key={review.id} style={styles.reviewCard}>
          <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text>
          <Text style={styles.reviewBody}>{review.body}</Text>
        </Card>
      ))}

      {isSignedIn ? (
        <View style={styles.form}>
          <Input label="Valoración (1-5)" value={rating} onChangeText={setRating} keyboardType="number-pad" />
          <Input
            label="Tu reseña"
            value={body}
            onChangeText={setBody}
            multiline
            containerStyle={styles.field}
          />
          <Text style={styles.link} onPress={() => void submitReview()}>
            Enviar reseña
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  summary: { color: '#737373', marginBottom: 12 },
  reviewCard: { marginBottom: 8 },
  reviewRating: { fontWeight: '600', marginBottom: 4 },
  reviewBody: { color: '#525252' },
  form: { marginTop: 16, gap: 8 },
  field: { marginTop: 8 },
  link: { color: '#171717', fontWeight: '600', marginTop: 8 },
  message: { color: '#737373', marginTop: 8 },
});
