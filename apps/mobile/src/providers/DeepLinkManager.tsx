import { useEffect } from 'react';
import { useRouter, type Href } from 'expo-router';
import {
  addDeepLinkListener,
  parseDeepLink,
  useDeepLinkUrl,
} from '../lib/deep-links';

export function DeepLinkManager(): null {
  const router = useRouter();
  const initialUrl = useDeepLinkUrl();

  useEffect(() => {
    if (!initialUrl) {
      return;
    }

    const target = parseDeepLink(initialUrl);
    if (target) {
      router.navigate({
        pathname: target.pathname,
        params: target.params,
      } as Href);
    }
  }, [initialUrl, router]);

  useEffect(() => {
    const subscription = addDeepLinkListener((url) => {
      const target = parseDeepLink(url);
      if (target) {
        router.navigate({
        pathname: target.pathname,
        params: target.params,
      } as Href);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
