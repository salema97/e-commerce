import type { ExpoConfig, ConfigContext } from 'expo/config';

const LOCAL_EAS_PROJECT_ID_PLACEHOLDER = 'your-eas-project-id';

function isDevelopmentAppEnv(): boolean {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
  return appEnv === undefined || appEnv === 'development';
}

function resolveEasProjectId(): string {
  return (
    process.env.EAS_PROJECT_ID ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    LOCAL_EAS_PROJECT_ID_PLACEHOLDER
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopment = isDevelopmentAppEnv();

  return {
    ...config,
    android: {
      ...config.android,
      ...(isDevelopment ? { usesCleartextTraffic: true } : {}),
    },
    extra: {
      ...config.extra,
      eas: {
        ...(typeof config.extra?.eas === 'object' && config.extra.eas !== null
          ? config.extra.eas
          : {}),
        projectId: resolveEasProjectId(),
      },
    },
  };
};
