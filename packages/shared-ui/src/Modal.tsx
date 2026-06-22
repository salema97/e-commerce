import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type ModalProps,
} from 'react-native';

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
        accessibilityLabel="Close modal"
      />
      <View style={[styles.container, style]}>{children}</View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
});

export type { ModalProps };
