import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { Button, Input, Card } from '@repo/shared-ui';
import { api } from '../lib/api.js';
import { useCart } from '../lib/cart.js';
import { formatPrice } from '@repo/shared-utils';
import type { OrderAddress, CreateOrderDto, CreatePaymentIntentDto } from '@repo/shared-types';

const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FLAT_RATE = 5;
const TAX_RATE = 0.15;

export default function CheckoutScreen(): React.ReactElement {
  const router = useRouter();
  const { items, total: cartTotal, clearCart } = useCart();
  const stripe = useStripe();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Ecuador');
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = api.hooks.useCreateOrder();
  const createPaymentIntent = api.hooks.useCreatePaymentIntent();

  const shipping = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const tax = cartTotal * TAX_RATE;
  const estimatedTotal = cartTotal + shipping + tax;

  const error = createOrder.error?.message ?? createPaymentIntent.error?.message ?? null;

  const shippingAddress: OrderAddress = {
    recipientName,
    street,
    city,
    state: state || undefined,
    country,
    zipCode: zipCode || undefined,
    phone: phone || undefined,
  };

  async function handleCheckout(): Promise<void> {
    if (!stripe) {
      Alert.alert('Error', 'Stripe no está disponible. Construye con una compilación de desarrollo.');
      return;
    }

    setIsProcessing(true);
    try {
      const orderDto: CreateOrderDto = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        channel: 'MOBILE',
        couponCode: couponCode.trim() || undefined,
        customerEmail: email,
        customerPhone: phone || undefined,
        shippingAddress,
        billingAddress: shippingAddress,
      };

      const order = await createOrder.mutateAsync(orderDto);

      const intentDto: CreatePaymentIntentDto = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Math.round(Number(order.total) * 100),
        currency: 'USD',
        provider: 'STRIPE',
        channel: 'MOBILE',
        customerEmail: email,
      };
      const paymentIntent = await createPaymentIntent.mutateAsync(intentDto);

      if (!paymentIntent.clientSecret) {
        throw new Error('No se recibió el client secret de Stripe.');
      }

      const { error: initError } = await stripe.initPaymentSheet({
        merchantDisplayName: 'E-commerce',
        paymentIntentClientSecret: paymentIntent.clientSecret,
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        // Cancellation or decline: order remains PENDING_PAYMENT until the
        // reservation TTL releases stock. Do not clear the cart.
        if (presentError.code !== 'Canceled') {
          Alert.alert('Pago fallido', presentError.message);
        }
        return;
      }

      // Payment Sheet completed. The Stripe webhook is the source of truth for
      // order status; navigate to the order detail screen.
      clearCart();
      router.replace({ pathname: '/order/[id]', params: { id: order.id } });
    } catch {
      // Error details are surfaced via the mutation error state below.
    } finally {
      setIsProcessing(false);
    }
  }

  const isFormValid = Boolean(email && recipientName && street && city && country);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>No hay productos en el carrito.</Text>
        <Button onPress={() => router.push('/(tabs)/store')}>Ir a la tienda</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Finalizar compra</Text>

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
          <View style={[styles.summaryRow, styles.subRow]}>
            <Text style={styles.subLabel}>Subtotal</Text>
            <Text style={styles.subValue}>{formatPrice(cartTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.subLabel}>Envío</Text>
            <Text style={styles.subValue}>
              {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.subLabel}>IVA (15%)</Text>
            <Text style={styles.subValue}>{formatPrice(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>{formatPrice(estimatedTotal)}</Text>
          </View>
          <Text style={styles.disclaimer}>
            El total final se calcula al crear el pedido.
          </Text>
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

        <Text style={styles.sectionTitle}>Cupón (opcional)</Text>
        <Input
          label="Código de cupón"
          value={couponCode}
          onChangeText={setCouponCode}
          autoCapitalize="none"
          containerStyle={styles.field}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isProcessing ? (
          <ActivityIndicator size="large" color="#171717" style={styles.loader} />
        ) : (
          <Button
            onPress={handleCheckout}
            disabled={!isFormValid}
            size="lg"
          >
            Pagar {formatPrice(estimatedTotal)}
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
  subRow: {
    marginTop: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#525252',
  },
  subValue: {
    fontSize: 14,
    color: '#171717',
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
  disclaimer: {
    fontSize: 12,
    color: '#737373',
    marginTop: 8,
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
