export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure:
    process.env.NODE_ENV === 'production' ||
    process.env.APP_ENV === 'staging' ||
    process.env.VERCEL_ENV === 'preview',
  path: '/',
};
