import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { navigateDeepLink } from '../lib/deep-links';

export function DeepLinkManager(): null {
  const router = useRouter();
  const initialUrl = Linking.useURL();

  useEffect(() => {
    if (initialUrl) {
      navigateDeepLink(router, initialUrl);
    }
  }, [initialUrl, router]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      navigateDeepLink(router, event.url);
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}
