export {};

declare global {
  // Minimal process typings for Expo public environment variables.
  // eslint-disable-next-line no-var
  var process: {
    env: Record<string, string | undefined>;
  };
}
