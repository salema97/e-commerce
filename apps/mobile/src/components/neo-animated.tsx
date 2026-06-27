import React from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  neoMotionDurations,
  neoMotionStagger,
} from '@repo/shared-utils';

const ms = (seconds: number) => Math.round(seconds * 1000);

type NeoAnimatedViewProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
};

function useNeoMotionEnabled(): boolean {
  const reducedMotion = useReducedMotion();
  return !reducedMotion;
}

export function NeoEnterFromTop({ children, delay = 0, style }: NeoAnimatedViewProps) {
  const motionEnabled = useNeoMotionEnabled();

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(ms(neoMotionDurations.slow))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function NeoEnterFromBottom({ children, delay = 0, style }: NeoAnimatedViewProps) {
  const motionEnabled = useNeoMotionEnabled();

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(ms(neoMotionDurations.slow))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function NeoScaleIn({ children, delay = 0, style }: NeoAnimatedViewProps) {
  const motionEnabled = useNeoMotionEnabled();

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(ms(neoMotionDurations.normal))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function NeoStaggeredItem({
  children,
  index,
  style,
}: NeoAnimatedViewProps & { index: number }) {
  const motionEnabled = useNeoMotionEnabled();
  const delay = index * ms(neoMotionStagger.listItem);

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(ms(neoMotionDurations.normal))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function NeoPulse({ children, style }: NeoAnimatedViewProps) {
  const motionEnabled = useNeoMotionEnabled();

  if (!motionEnabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return <PulseLoop style={style}>{children}</PulseLoop>;
}

function PulseLoop({ children, style }: NeoAnimatedViewProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, {
        duration: ms(neoMotionDurations.pulse),
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
