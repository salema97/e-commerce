import Constants from 'expo-constants';

/**
 * URL base del API — una sola fuente para fetch nativo y @repo/api-client.
 * Prioridad: EXPO_PUBLIC_API_URL → extra.apiUrl (app.json) → localhost.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv;

  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim();
  }

  return 'http://localhost:3001/v1';
}
