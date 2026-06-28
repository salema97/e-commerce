import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { Button, Input, Card, NeoPageHeader, getNeoLayoutStyles, getNeoTextStyles, neo } from '@repo/shared-ui';
import { NeoScreen } from '../components/neo-screen';
import { NeoEnterFromBottom, NeoStaggeredItem } from '../components/neo-animated';
import { createMobileApiClient, useApiQueryHooks } from '../lib/api';
import { useCart } from '../lib/cart';
import { formatPrice, estimateCheckoutTotals } from '@repo/shared-utils';
import type { OrderAddress, CreateOrderDto, CreatePaymentIntentDto } from '@repo/shared-types';
import { trackMobileEvent } from '../lib/analytics';
import { useAuth } from '../providers/AuthProvider';

export default function CheckoutScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { items, total: cartTotal, clearCart } = useCart();
  const stripe = useStripe();

  useEffect(() => {
    if (items.length === 0) return;
    void trackMobileEvent('begin_checkout', { itemCount: items.length, total: cartTotal }, user?.id);
  }, [items.length, cartTotal, user?.id]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Ecuador');
  const [couponCode, setCouponCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAmount, setShippingAmount] = useState<number | null>(null);

  const hooks = useApiQueryHooks();
  const createOrder = hooks.useCreateOrder();
  const createPaymentIntent = hooks.useCreatePaymentIntent();
  const { data: loyaltyAccount } = hooks.useLoyaltyAccount();

  const addressReady = Boolean(recipientName && street && city && country);

  useEffect(() => {
    if (!addressReady || items.length === 0) {
      setShippingAmount(null);
      return;
    }

    let cancelled = false;
    void createMobileApiClient().shipping
      .quote({
        country,
        province: state || undefined,
        subtotal: cartTotal,
        freeShipping: false,
      })
      .then((quote) => {
        if (!cancelled) {
          setShippingAmount(quote.amount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShippingAmount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [addressReady, cartTotal, country, items.length, state]);

  const fallbackTotals = estimateCheckoutTotals(cartTotal);
  const shipping = shippingAmount ?? fallbackTotals.shipping;
  const tax = fallbackTotals.tax;
  const estimatedTotal = Number((cartTotal + shipping + tax).toFixed(2));

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
        referralCode: referralCode.trim() || undefined,
        loyaltyPointsToRedeem: loyaltyPoints ? Number(loyaltyPoints) : undefined,
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
      void trackMobileEvent('purchase', { orderId: order.id, total: order.total }, user?.id);
      clearCart();
      router.replace({ pathname: '/order/[id]', params: { id: order.id } });
    } catch {
      // Error details are surfaced via the mutation error state below.
    } finally {
      setIsProcessing(false);
    }
  }

  const isFormValid = Boolean(email && recipientName && street && city && country);

  const text = getNeoTextStyles();
  const layout = getNeoLayoutStyles();

  if (items.length === 0) {
    return (
      <NeoScreen style={layout.center}>
        <Text style={text.bodyMuted}>No hay productos en el carrito.</Text>
        <Button onPress={() => router.push('/(tabs)/store')} style={styles.emptyButton}>
          Ir a la tienda
        </Button>
      </NeoScreen>
    );
  }

  return (
    <NeoScreen style={layout.screen}>
      <ScrollView contentContainerStyle={layout.contentPaddedBottom}>
        <NeoPageHeader eyebrow="Checkout" title="Finalizar compra" style={layout.pageHeaderInList} compact />

        <NeoEnterFromBottom delay={0}>
          <Card style={styles.summary}>
            <Text style={text.sectionTitle}>Resumen del pedido</Text>
            {items.map((item, index) => (
              <NeoStaggeredItem key={`${item.productId}-${item.variantId ?? 'default'}`} index={index}>
                <View style={styles.summaryRow}>
                  <Text style={text.bodyMuted} numberOfLines={1}>
                    {item.name} x{item.quantity}
                  </Text>
                  <Text style={text.label}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              </NeoStaggeredItem>
            ))}
          <View style={[styles.summaryRow, styles.subRow]}>
            <Text style={text.bodyMuted}>Subtotal</Text>
            <Text style={text.label}>{formatPrice(cartTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={text.bodyMuted}>Envío</Text>
            <Text style={text.label}>
              {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={text.bodyMuted}>IVA (15%)</Text>
            <Text style={text.label}>{formatPrice(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, layout.totalRow]}>
            <Text style={text.totalLabel}>Total estimado</Text>
            <Text style={text.totalValue}>{formatPrice(estimatedTotal)}</Text>
          </View>
          <Text style={[text.bodyMuted, styles.disclaimer]}>
            El total final se calcula al crear el pedido.
          </Text>
          </Card>
        </NeoEnterFromBottom>

        <NeoEnterFromBottom delay={80}>
          <View style={layout.stackSection}>
            <Text style={text.sectionTitle}>Datos de contacto</Text>
          </View>
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
        </NeoEnterFromBottom>

        <NeoEnterFromBottom delay={160}>
          <View style={layout.stackSection}>
            <Text style={text.sectionTitle}>Dirección de envío</Text>
          </View>
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
        </NeoEnterFromBottom>

        <NeoEnterFromBottom delay={240}>
          <View style={layout.stackSection}>
            <Text style={text.sectionTitle}>Cupón (opcional)</Text>
          </View>
          <Input
            label="Código de cupón"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="none"
            containerStyle={styles.field}
          />
        </NeoEnterFromBottom>

        <NeoEnterFromBottom delay={280}>
          <View style={layout.stackSection}>
            <Text style={text.sectionTitle}>Referido y puntos</Text>
          </View>
          <Input
            label="Código de referido"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            containerStyle={styles.field}
          />
          {loyaltyAccount ? (
            <Text style={[text.bodyMuted, styles.loyaltyHint]}>
              Puntos disponibles: {loyaltyAccount.points} ({loyaltyAccount.tier})
            </Text>
          ) : null}
          <Input
            label="Puntos a canjear"
            value={loyaltyPoints}
            onChangeText={setLoyaltyPoints}
            keyboardType="number-pad"
            containerStyle={styles.field}
          />
        </NeoEnterFromBottom>

        <NeoEnterFromBottom delay={320}>
          {error ? <Text style={[text.error, styles.errorGap]}>{error}</Text> : null}

          {isProcessing ? (
            <ActivityIndicator size="large" color={neo.onyx} style={styles.loader} />
          ) : (
            <Button
              onPress={handleCheckout}
              disabled={!isFormValid}
              size="lg"
              fullWidth
            >
              Pagar {formatPrice(estimatedTotal)}
            </Button>
          )}
        </NeoEnterFromBottom>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  emptyButton: {
    marginTop: 16,
  },
  summary: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subRow: {
    marginTop: 8,
  },
  disclaimer: {
    marginTop: 8,
  },
  field: {
    marginBottom: 12,
  },
  loyaltyHint: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  errorGap: {
    marginVertical: 12,
  },
  loader: {
    marginVertical: 24,
  },
});
