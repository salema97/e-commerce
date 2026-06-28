import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { NEO_SHADOW, neo } from '@repo/shared-ui';

const TAB_SHADOW = NEO_SHADOW.lg;

type NeoTabBarButtonProps = {
  children: React.ReactNode;
  /** Brand gold face — used for the Inicio tab. */
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  'aria-selected'?: boolean;
  href?: string;
};

export function NeoTabBarButton({
  children,
  accent = false,
  style,
  accessibilityState,
  'aria-selected': ariaSelected,
  ...rest
}: NeoTabBarButtonProps): React.ReactElement {
  const focused = ariaSelected === true || accessibilityState?.selected === true;

  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      style={[styles.pressable, style, styles.pressableTransparent, styles.pressableReset]}
    >
      {({ pressed }) => {
        const isPressed = focused || pressed;

        return (
          <View style={styles.item}>
            <View
              style={[
                styles.shadowHost,
                {
                  paddingRight: TAB_SHADOW.x,
                  paddingBottom: TAB_SHADOW.y,
                },
              ]}
            >
              <View style={styles.stack}>
                {!isPressed ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.shadowBlock,
                      {
                        left: TAB_SHADOW.x,
                        top: TAB_SHADOW.y,
                        right: -TAB_SHADOW.x,
                        bottom: -TAB_SHADOW.y,
                        backgroundColor: TAB_SHADOW.color,
                      },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.face,
                    accent && styles.faceAccent,
                    isPressed && {
                      transform: [
                        { translateX: TAB_SHADOW.x },
                        { translateY: TAB_SHADOW.y },
                      ],
                    },
                  ]}
                >
                  {children}
                </View>
              </View>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    overflow: 'visible',
  },
  pressableTransparent: {
    backgroundColor: 'transparent',
  },
  pressableReset: {
    padding: 0,
    margin: 0,
    borderRadius: 0,
  },
  item: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 3,
    alignItems: 'stretch',
    overflow: 'visible',
  },
  shadowHost: {
    width: '100%',
    overflow: 'visible',
  },
  stack: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
  shadowBlock: {
    position: 'absolute',
    zIndex: 0,
    borderRadius: 0,
  },
  face: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    borderWidth: neo.borderWidth,
    borderColor: neo.onyx,
    backgroundColor: neo.white,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  faceAccent: {
    backgroundColor: neo.gold,
  },
});
