export function isNonProduction(): boolean {
  return process.env.NODE_ENV !== 'production';
}
