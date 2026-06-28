import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { neo } from './theme.js';

/** Web box-shadow presets — blur always 0. */
export type NeoShadowPreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'gold' | 'none';

export interface NeoShadowSpec {
  x: number;
  y: number;
  color: string;
}

/** Matches web shadow tokens (button, card, alert, dialog, checkbox, etc.). */
export const NEO_SHADOW: Record<Exclude<NeoShadowPreset, 'none'>, NeoShadowSpec> = {
  xs: { x: 2, y: 2, color: neo.onyx },
  sm: { x: 3, y: 3, color: neo.onyx },
  md: { x: 4, y: 4, color: neo.onyx },
  lg: { x: 6, y: 6, color: neo.onyx },
  xl: { x: 12, y: 12, color: neo.onyx },
  gold: { x: 6, y: 6, color: neo.gold },
};

export const NEO_PRESS_OFFSET = 4;

export function resolveNeoShadow(preset: NeoShadowPreset): NeoShadowSpec | null {
  if (preset === 'none') return null;
  return NEO_SHADOW[preset];
}

export interface NeoBrutalShadowProps {
  children: React.ReactNode;
  shadow?: NeoShadowPreset;
  /** Hide offset block (pressed / active state). */
  hideShadow?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Solid offset shadow block — same visual as CSS `box-shadow: Npx Npx 0 0 color`.
 * Used by Button, Card, Alert, Modal, Switch, Checkbox, ChatBubble, etc.
 */
export function NeoBrutalShadow({
  children,
  shadow = 'md',
  hideShadow = false,
  fullWidth = false,
  style,
}: NeoBrutalShadowProps): React.ReactElement {
  const spec = resolveNeoShadow(shadow);
  const showShadow = Boolean(spec && !hideShadow);

  return (
    <View style={[styles.root, fullWidth && styles.fullWidth, style]}>
      <View
        style={[
          styles.host,
          showShadow && spec && { paddingRight: spec.x, paddingBottom: spec.y },
          fullWidth && styles.fullWidth,
        ]}
      >
        <View style={[styles.stack, fullWidth && styles.fullWidth]}>
          {showShadow && spec ? (
            <View
              pointerEvents="none"
              style={[
                styles.block,
                {
                  left: spec.x,
                  top: spec.y,
                  right: -spec.x,
                  bottom: -spec.y,
                  backgroundColor: spec.color,
                },
              ]}
            />
          ) : null}
          <View style={[styles.faceSlot, fullWidth && styles.fullWidth]}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
  },
  host: {
    alignSelf: 'flex-start',
  },
  stack: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  block: {
    position: 'absolute',
    borderRadius: 0,
  },
  faceSlot: {
    position: 'relative',
    zIndex: 1,
  },
});
