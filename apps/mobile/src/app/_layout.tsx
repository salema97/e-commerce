import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { CartProvider } from '../lib/cart';
import { WishlistProvider } from '../lib/wishlist';
import { AuthProvider } from '../providers/AuthProvider';
import { AuthTokenBridge } from '../providers/AuthTokenBridge';
import { PushNotificationManager } from '../providers/PushNotificationManager';
import { DeepLinkManager } from '../providers/DeepLinkManager';
import { AnalyticsConsentBanner } from '../components/AnalyticsConsentBanner';
import { MarketingPlacementProvider } from '../providers/MarketingPlacementProvider';
import { NeoFontProvider } from '../providers/NeoFontProvider';
import { initMobileSentry } from '../lib/sentry';

initMobileSentry();

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
      <NeoFontProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={stripePublishableKey}>
            <CartProvider>
              <WishlistProvider>
              <AuthTokenBridge />
              <PushNotificationManager />
              <DeepLinkManager />
              <AnalyticsConsentBanner />
              <MarketingPlacementProvider>
              <Stack screenOptions={{ headerShown: false }} />
              </MarketingPlacementProvider>
              <StatusBar style="auto" />
              </WishlistProvider>
            </CartProvider>
          </StripeProvider>
        </QueryClientProvider>
      </AuthProvider>
      </NeoFontProvider>
    </SafeAreaProvider>
  );
}
