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

const storagePattern = remotePatternFromEnvUrl(process.env.AWS_S3_PUBLIC_URL);
if (storagePattern) {
  remotePatterns.push(storagePattern);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
