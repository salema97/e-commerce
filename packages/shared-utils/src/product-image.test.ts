import { describe, expect, it } from 'vitest';
import {
  getProductPrimaryImageUrl,
  normalizeProductImageUrl,
} from './product-image.js';

describe('normalizeProductImageUrl', () => {
  it('returns undefined for empty values', () => {
    expect(normalizeProductImageUrl()).toBeUndefined();
    expect(normalizeProductImageUrl('')).toBeUndefined();
    expect(normalizeProductImageUrl('   ')).toBeUndefined();
  });

  it('normalizes placehold.co URLs without format and strips text query', () => {
    expect(
      normalizeProductImageUrl(
        'https://placehold.co/800x600/1e293b/f8fafc?text=Laptop+Pro+14',
      ),
    ).toBe('https://placehold.co/800x600/1e293b/f8fafc/png');
  });

  it('keeps placehold.co URLs that already end with /png', () => {
    expect(normalizeProductImageUrl('https://placehold.co/800x600/1e293b/f8fafc/png')).toBe(
      'https://placehold.co/800x600/1e293b/f8fafc/png',
    );
  });

  it('passes through other valid URLs unchanged', () => {
    const url = 'https://cdn.example.com/products/shoe.jpg';
    expect(normalizeProductImageUrl(url)).toBe(url);
  });
});

describe('getProductPrimaryImageUrl', () => {
  it('normalizes the first product image URL', () => {
    expect(
      getProductPrimaryImageUrl({
        images: [{ url: 'https://placehold.co/100x100/ccc/fff?text=Demo' }],
      }),
    ).toBe('https://placehold.co/100x100/ccc/fff/png');
  });
});
