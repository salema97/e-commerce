import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, Card, Button, getNeoTextStyles } from '@repo/shared-ui';
import { useApiQueryHooks } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps): React.ReactElement {
  const hooks = useApiQueryHooks();
  const { user } = useAuth();
  const { data: reviews } = hooks.useProductReviews(productId);
  const { data: summary } = hooks.useProductReviewSummary(productId);
  const createReview = hooks.useCreateProductReview();

  const [rating, setRating] = useState('5');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const text = getNeoTextStyles();

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
      <Text style={text.sectionTitle}>Reseñas</Text>
      <Text style={[text.bodyMuted, styles.summary]}>
        {(summary?.averageRating ?? 0).toFixed(1)} ★ ({summary?.reviewCount ?? 0})
      </Text>

      {(reviews ?? []).map((review) => (
        <Card key={review.id} style={styles.reviewCard}>
          <Text style={text.label}>{'★'.repeat(review.rating)}</Text>
          <Text style={text.bodyMuted}>{review.body}</Text>
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
          {message ? <Text style={[text.bodyMuted, styles.message]}>{message}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  summary: { marginBottom: 12 },
  reviewCard: { marginBottom: 8 },
  form: { marginTop: 16, gap: 8 },
  field: { marginTop: 8 },
  submit: { marginTop: 8, alignSelf: 'flex-start' },
  message: { marginTop: 8 },
});
