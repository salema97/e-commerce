import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

export default function RootLayout(): React.ReactElement | null {
  if (!clerkPublishableKey) {
    return (
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <AuthTokenBridge />
            <PushNotificationManager />
            <DeepLinkManager />
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="auto" />
          </CartProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
