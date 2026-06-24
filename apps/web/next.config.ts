import type { NextConfig } from 'next';

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
];

const r2Pattern = remotePatternFromEnvUrl(process.env.R2_PUBLIC_URL);
if (r2Pattern) {
  remotePatterns.push(r2Pattern);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
