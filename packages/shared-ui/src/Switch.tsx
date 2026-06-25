import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { neo } from './theme.js';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        value ? styles.trackOn : styles.trackOff,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
};

const TRACK_WIDTH = 48;
const THUMB_SIZE = 20;

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: 28,
    borderWidth: 3,
    borderColor: neo.onyx,
    justifyContent: 'center',
    paddingHorizontal: 2,
    shadowColor: neo.onyx,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  trackOff: {
    backgroundColor: neo.white,
  },
  trackOn: {
    backgroundColor: neo.gold,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderWidth: 3,
    borderColor: neo.onyx,
    backgroundColor: neo.onyx,
    transform: [{ translateX: 0 }],
  },
  thumbOn: {
    transform: [{ translateX: TRACK_WIDTH - THUMB_SIZE - 10 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
