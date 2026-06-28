import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { neo } from './theme.js';
import { NeoBrutalShadow } from './neo-brutal-shadow.js';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={style}
    >
      <NeoBrutalShadow shadow="sm">
        <View
          style={[
            styles.track,
            value ? styles.trackOn : styles.trackOff,
            disabled && styles.disabled,
          ]}
        >
          <View style={[styles.thumb, value && styles.thumbOn]} />
        </View>
      </NeoBrutalShadow>
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
