import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@repo/shared-ui';
import { api } from '../lib/api.js';
import { useCart } from '../lib/cart.js';
import { formatPrice } from '@repo/shared-utils';
import type { OrderAddress } from '@repo/shared-types';

export default function CheckoutScreen(): React.ReactElement {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Ecuador');

  const createOrder = api.hooks.useCreateOrder();
  const createPaymentIntent = api.hooks.useCreatePaymentIntent();

  const shippingAddress: OrderAddress = {
    recipientName,
    street,
    city,
    state,
    country,
    zipCode,
    phone,
  };

  const handleCheckout = async (): Promise<void> => {
    try {
      const order = await createOrder.mutateAsync({
        customerEmail: email,
        customerPhone: phone,
        shippingAddress,
        billingAddress: shippingAddress,
      });

      const paymentIntent = await createPaymentIntent.mutateAsync({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: total,
        currency: 'USD',
        provider: 'STRIPE',
        customerEmail: email,
      });

      // Stripe Payment Intents UI placeholder.
      // In a development build, initialize the Stripe React Native SDK with
      // paymentIntent.publicKey and confirm the payment using paymentIntent.clientSecret.
      // eslint-disable-next-line no-console
      console.log('Payment intent created', paymentIntent);

      clearCart();
      router.replace({ pathname: '/(tabs)/account', params: { orderId: order.id } });
    } catch (err) {
      // Error handling is delegated to the mutation error state.
    }
  };

  const isProcessing = createOrder.isPending || createPaymentIntent.isPending;
  const error = createOrder.error?.message ?? createPaymentIntent.error?.message ?? null;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>No hay productos en el carrito.</Text>
        <Button onPress={() => router.push('/(tabs)/store')}>
          Ir a la tienda
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Checkout</Text>

        <Card style={styles.summary}>
          <Text style={styles.sectionTitle}>Resumen del pedido</Text>
          {items.map((item) => (
            <View key={`${item.productId}-${item.variantId ?? 'default'}`} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.summaryPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Datos de contacto</Text>
        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.field}
        />
        <Input
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerStyle={styles.field}
        />

        <Text style={styles.sectionTitle}>Dirección de envío</Text>
        <Input
          label="Nombre del destinatario"
          value={recipientName}
          onChangeText={setRecipientName}
          containerStyle={styles.field}
        />
        <Input label="Calle" value={street} onChangeText={setStreet} containerStyle={styles.field} />
        <View style={styles.row}>
          <Input
            label="Ciudad"
            value={city}
            onChangeText={setCity}
            containerStyle={[styles.field, styles.halfField]}
          />
          <Input
            label="Provincia"
            value={state}
            onChangeText={setState}
            containerStyle={[styles.field, styles.halfField]}
          />
        </View>
        <View style={styles.row}>
          <Input
            label="Código postal"
            value={zipCode}
            onChangeText={setZipCode}
            containerStyle={[styles.field, styles.halfField]}
          />
          <Input
            label="País"
            value={country}
            onChangeText={setCountry}
            containerStyle={[styles.field, styles.halfField]}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isProcessing ? (
          <ActivityIndicator size="large" color="#171717" style={styles.loader} />
        ) : (
          <Button
            onPress={handleCheckout}
            disabled={!email || !recipientName || !street || !city || !country}
            size="lg"
          >
            Pagar {formatPrice(total)}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 16,
    color: '#737373',
    marginBottom: 16,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginTop: 20,
    marginBottom: 12,
  },
  summary: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryName: {
    flex: 1,
    color: '#525252',
    marginRight: 12,
  },
  summaryPrice: {
    color: '#171717',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171717',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
  },
  field: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  error: {
    color: '#ef4444',
    marginVertical: 12,
  },
  loader: {
    marginVertical: 24,
  },
});
