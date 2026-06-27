import type { Href } from 'expo-router';

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

export function navigateDeepLink(
  router: { navigate: (href: Href) => void },
  url: string,
): void {
  const target = parseDeepLink(url);
  if (target) {
    router.navigate({
      pathname: target.pathname,
      params: target.params,
    } as Href);
  }
}
