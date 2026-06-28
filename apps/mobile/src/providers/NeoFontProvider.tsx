import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { neo, setNeoFontFamilies } from '@repo/shared-ui';

type NeoFontProviderProps = {
  children: React.ReactNode;
};

export function NeoFontProvider({ children }: NeoFontProviderProps): React.ReactElement | null {
  const [loaded] = useFonts({
    Anton_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    setNeoFontFamilies({
      display: 'Anton_400Regular',
      sans: 'SpaceGrotesk_500Medium',
    });
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={neo.onyx} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: neo.bg,
  },
});
