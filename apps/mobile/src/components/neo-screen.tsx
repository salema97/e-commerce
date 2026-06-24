import React from 'react';
import { type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { neo } from '@repo/shared-ui';
import { NeoEnterFromTop } from './neo-animated.js';

type NeoScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  /** Desactiva entrada si la pantalla ya anima su contenido (p. ej. Descubrir). */
  entrance?: boolean;
};

export function NeoScreen({
  children,
  style,
  edges,
  entrance = true,
}: NeoScreenProps): React.ReactElement {
  const content = (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );

  if (!entrance) {
    return content;
  }

  return <NeoEnterFromTop style={styles.flex}>{content}</NeoEnterFromTop>;
}

const styles = {
  flex: { flex: 1 } satisfies ViewStyle,
  root: {
    flex: 1,
    backgroundColor: neo.bg,
  } satisfies ViewStyle,
};
