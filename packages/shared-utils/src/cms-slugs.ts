/** Maps public URL slugs to CMS API slugs when they differ. */
export const LEGAL_CMS_SLUG_BY_PATH: Record<string, string> = {
  privacy: 'politica-privacidad',
  terms: 'terminos-servicio',
  shipping: 'politica-envios',
  returns: 'politica-devoluciones',
};

export const LEGAL_PATH_TITLES: Record<string, string> = {
  privacy: 'Política de privacidad',
  terms: 'Términos de servicio',
  shipping: 'Política de envíos',
  returns: 'Política de devoluciones',
};

export function resolveLegalCmsSlug(pathSlug: string): string {
  return LEGAL_CMS_SLUG_BY_PATH[pathSlug] ?? pathSlug;
}

export const LEGAL_PATH_SLUGS = Object.keys(LEGAL_PATH_TITLES) as Array<
  keyof typeof LEGAL_PATH_TITLES
>;
