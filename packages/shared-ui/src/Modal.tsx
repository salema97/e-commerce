import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type ModalProps,
} from 'react-native';
import { neo } from './theme.js';
import { NeoBrutalShadow } from './neo-brutal-shadow.js';

export interface ModalPropsCustom {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  overlayStyle?: ViewStyle;
  closeOnOverlayPress?: boolean;
}

export const Modal: React.FC<ModalPropsCustom> = ({
  visible,
  onClose,
  children,
  style,
  overlayStyle,
  closeOnOverlayPress = true,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={closeOnOverlayPress ? onClose : undefined}
        accessibilityRole="button"
        accessibilityLabel="Cerrar modal"
      />
      <NeoBrutalShadow shadow="xl" style={styles.dialogHost}>
        <View style={[styles.container, style]}>{children}</View>
      </NeoBrutalShadow>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 17, 17, 0.7)',
  },
  dialogHost: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  container: {
    backgroundColor: neo.white,
    borderWidth: 3,
    borderColor: neo.onyx,
    borderRadius: 0,
    padding: 24,
    width: '100%',
  },
});

export type { ModalProps };
