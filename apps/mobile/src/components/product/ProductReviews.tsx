import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Card, Button, neo } from '@repo/shared-ui';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps): React.ReactElement {
  const { user } = useAuth();
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

      {user ? (
        <View style={styles.form}>
          <Input label="Valoración (1-5)" value={rating} onChangeText={setRating} keyboardType="number-pad" />
          <Input
            label="Tu reseña"
            value={body}
            onChangeText={setBody}
            multiline
            containerStyle={styles.field}
          />
          <Button onPress={() => void submitReview()} size="sm" style={styles.submit}>
            Enviar reseña
          </Button>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4, color: neo.onyx, textTransform: 'uppercase' },
  summary: { color: neo.muted, marginBottom: 12, fontWeight: '600' },
  reviewCard: { marginBottom: 8 },
  reviewRating: { fontWeight: '700', marginBottom: 4, color: neo.onyx },
  reviewBody: { color: neo.muted, fontWeight: '600' },
  form: { marginTop: 16, gap: 8 },
  field: { marginTop: 8 },
  submit: { marginTop: 8, alignSelf: 'flex-start' },
  message: { color: neo.muted, marginTop: 8, fontWeight: '600' },
});
