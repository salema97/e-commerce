import * as Linking from 'expo-linking';

export const linkingPrefixes = ['ecommerce://', 'https://ecommerce.example.com'];

export interface DeepLinkTarget {
  pathname: string;
  params?: Record<string, string>;
}

export function parseDeepLink(url: string): DeepLinkTarget | null {
  let pathname: string;
  let searchParams: URLSearchParams;

  try {
    const parsed = new URL(url);
    pathname = parsed.pathname.replace(/^\//, '');
    searchParams = parsed.searchParams;
  } catch {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const id = segments[1];

  if (!first) {
    return { pathname: '/(tabs)' };
  }

  if (first === 'product' && id) {
    return { pathname: '/(tabs)/product/[id]', params: { id } };
  }

  if (first === 'order' && id) {
    return { pathname: '/order/[id]', params: { id } };
  }

  if (first === 'cart') {
    return { pathname: '/(tabs)/cart' };
  }

  if (first === 'password-reset') {
    return { pathname: '/sign-in', params: Object.fromEntries(searchParams.entries()) };
  }

  return null;
}

export function useDeepLinkUrl(): string | null {
  return Linking.useURL();
}

export function addDeepLinkListener(callback: (url: string) => void): { remove: () => void } {
  return Linking.addEventListener('url', (event) => {
    callback(event.url);
  });
}
