import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

function remotePatternFromEnvUrl(url: string | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      pathname: '/**' as const,
    };
  } catch {
    return null;
  }
}

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    pathname: '/**',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
    pathname: '/**',
  },
];

const storagePattern = remotePatternFromEnvUrl(process.env.AWS_S3_PUBLIC_URL);
if (storagePattern) {
  remotePatterns.push(storagePattern);
}

const devApiConnectSrc = [
  'http://127.0.0.1:3001',
  'http://localhost:3001',
  'ws://127.0.0.1:3000',
  'ws://localhost:3000',
].join(' ');

const cspDirectives = [
  "default-src 'self'",
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'nonce-{NONCE}' https://challenges.cloudflare.com https://js.stripe.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com",
  process.env.NODE_ENV === 'production'
    ? "style-src 'self'"
    : "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  process.env.NODE_ENV === 'production'
    ? "connect-src 'self' https: wss:"
    : `connect-src 'self' https: wss: ${devApiConnectSrc}`,
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
];

const nextConfig: NextConfig = {
  // Playwright E2E uses 127.0.0.1; without this, Next 16 blocks dev HMR and client hydration.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@repo/shared-ui'],
  },
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [{ source: '/:path*', headers }];
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
