const DEFAULT_LOCALE = 'es-EC';

export interface SlugOptions {
  lower?: boolean;
  strict?: boolean;
  remove?: RegExp;
}

export function generateSlug(value: string, options: SlugOptions = {}): string {
  const { lower = true, strict = true, remove } = options;

  let slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (remove) {
    slug = slug.replace(remove, '');
  }

  slug = slug
    .replace(/[^\w\s-]/g, strict ? '' : '-')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return lower ? slug.toLowerCase() : slug;
}

export function uniqueSlug(base: string, existing: string[]): string {
  let slug = generateSlug(base);
  let counter = 1;

  while (existing.includes(slug)) {
    slug = `${generateSlug(base)}-${counter}`;
    counter += 1;
  }

  return slug;
}

export function formatSlug(value: string): string {
  return generateSlug(value, { lower: true, strict: true });
}

export function slugifyName(name: string, locale = DEFAULT_LOCALE): string {
  return generateSlug(name, { lower: true, strict: true });
}
