'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  PRODUCT_IMAGE_FALLBACK_LABEL,
  normalizeProductImageUrl,
} from '@repo/shared-utils';
import { cn } from '@/lib/utils';

export type ProductImageVariant = 'card' | 'detail' | 'hero' | 'thumbnail';

interface ProductImageProps {
  url?: string | null;
  alt?: string;
  fallbackLabel?: string;
  variant?: ProductImageVariant;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  grayscaleHover?: boolean;
}

const variantContainer: Record<ProductImageVariant, string> = {
  card: 'relative aspect-square overflow-hidden border-b-[3px] border-neo-onyx bg-muted',
  detail:
    'relative aspect-square overflow-hidden border-b-[3px] border-neo-onyx bg-muted lg:border-b-0 lg:border-r-[3px]',
  hero: 'relative overflow-hidden border-[3px] border-neo-onyx bg-white shadow-[12px_12px_0_0_#111111]',
  thumbnail:
    'relative size-20 shrink-0 overflow-hidden border-[3px] border-neo-onyx bg-muted',
};

const variantFallback: Record<ProductImageVariant, string> = {
  card: 'flex h-full min-h-full w-full items-center justify-center text-sm font-bold uppercase text-muted-foreground',
  detail:
    'flex h-full min-h-full w-full items-center justify-center font-bold uppercase text-muted-foreground',
  hero: 'flex aspect-[4/5] w-full items-center justify-center font-bold uppercase text-muted-foreground',
  thumbnail:
    'flex h-full min-h-full w-full items-center justify-center px-1 text-center text-[10px] font-bold uppercase leading-tight text-muted-foreground',
};

export function ProductImage({
  url,
  alt,
  fallbackLabel = PRODUCT_IMAGE_FALLBACK_LABEL,
  variant = 'card',
  fill = true,
  width,
  height,
  className,
  imageClassName,
  priority,
  sizes,
  grayscaleHover = false,
}: ProductImageProps) {
  const normalizedUrl = React.useMemo(() => normalizeProductImageUrl(url), [url]);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    setLoadError(false);
  }, [normalizedUrl]);

  const showImage = Boolean(normalizedUrl) && !loadError;

  return (
    <div className={cn(variantContainer[variant], className)}>
      {showImage ? (
        <Image
          src={normalizedUrl!}
          alt={alt ?? ''}
          fill={fill && width === undefined && height === undefined}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          onError={() => setLoadError(true)}
          className={cn(
            'object-cover',
            grayscaleHover && 'grayscale transition-all duration-500 group-hover:grayscale-0',
            imageClassName,
          )}
        />
      ) : (
        <div className={variantFallback[variant]}>{fallbackLabel}</div>
      )}
    </div>
  );
}
