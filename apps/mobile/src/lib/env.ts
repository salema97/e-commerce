import Constants from 'expo-constants';
import { Platform } from 'react-native';

function platformDefaultHost(): string {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  if (Platform.OS === 'ios') {
    return 'localhost';
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    (typeof Constants.expoConfig?.hostUri === 'string'
      ? Constants.expoConfig.hostUri.split(':')[0]
      : null);

  if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
    return debuggerHost;
  }

  return 'localhost';
}

/** `EXPO_PUBLIC_API_URL` or platform default (Android emulator → 10.0.2.2). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  return `http://${platformDefaultHost()}:3001/v1`;
}
