import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { CartProvider } from '../lib/cart.js';
import { AuthTokenBridge } from '../providers/AuthTokenBridge.js';
import { PushNotificationManager } from '../providers/PushNotificationManager.js';
import { DeepLinkManager } from '../providers/DeepLinkManager.js';

const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, token: string): Promise<void> {
    return SecureStore.setItemAsync(key, token);
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.stripePublishableKey ??
  '';

export default function RootLayout(): React.ReactElement | null {
  if (!clerkPublishableKey) {
    return (
      <SafeAreaProvider>
        <StripeProvider publishableKey={stripePublishableKey}>
          <Stack screenOptions={{ headerShown: false }} />
        </StripeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
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
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
