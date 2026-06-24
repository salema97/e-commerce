export const PRODUCT_IMAGE_FALLBACK_LABEL = 'Sin imagen';

const IMAGE_EXTENSION_RE = /(?:\.(png|jpe?g|webp|gif|avif|svg)|\/(png|jpe?g|webp|gif|svg))$/i;

export interface ProductImageSource {
  url: string;
  alt?: string | null;
}

export interface ProductWithImages {
  images?: ProductImageSource[] | null;
  name?: string;
}

/**
 * Normalizes external image URLs for Next.js / RN consumers.
 * placehold.co URLs with `?text=` return SVG and break the Next image optimizer.
 */
export function normalizeProductImageUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) return undefined;

  if (/^https:\/\/placehold\.co\//i.test(trimmed)) {
    const withoutQuery = trimmed.split('?')[0];
    const path = withoutQuery.replace(/^https:\/\/placehold\.co/i, '').replace(/\/$/, '');
    if (!IMAGE_EXTENSION_RE.test(path)) {
      return `https://placehold.co${path}/png`;
    }
    return `https://placehold.co${path}`;
  }

  return trimmed;
}

export function hasProductImageUrl(url?: string | null): boolean {
  return normalizeProductImageUrl(url) !== undefined;
}

export function getProductPrimaryImage(
  product: ProductWithImages,
): ProductImageSource | undefined {
  return product.images?.[0];
}

export function getProductPrimaryImageUrl(product: ProductWithImages): string | undefined {
  return normalizeProductImageUrl(product.images?.[0]?.url);
}

export function getProductPrimaryImageAlt(
  product: ProductWithImages,
  fallbackName?: string,
): string {
  const image = getProductPrimaryImage(product);
  return image?.alt ?? fallbackName ?? product.name ?? PRODUCT_IMAGE_FALLBACK_LABEL;
}
