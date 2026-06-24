import 'react-native-reanimated';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { CartProvider } from '../lib/cart.js';
import { AuthProvider } from '../providers/AuthProvider.js';
import { AuthTokenBridge } from '../providers/AuthTokenBridge.js';
import { PushNotificationManager } from '../providers/PushNotificationManager.js';
import { DeepLinkManager } from '../providers/DeepLinkManager.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.stripePublishableKey ??
  '';

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={stripePublishableKey}>
            <CartProvider>
              <AuthTokenBridge />
              <PushNotificationManager />
              <DeepLinkManager />
              <Stack screenOptions={{ headerShown: false }} />
              <StatusBar style="auto" />
            </CartProvider>
          </StripeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
