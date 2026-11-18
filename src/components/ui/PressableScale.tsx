import React, { useCallback } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { tap } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      if (Platform.OS !== 'web') {
        scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400, mass: 0.4 });
      }
      onPressIn?.(event);
    },
    [onPressIn, scale, scaleTo]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      if (Platform.OS !== 'web') {
        scale.value = withSpring(1, { damping: 20, stiffness: 300, mass: 0.4 });
      }
      onPressOut?.(event);
    },
    [onPressOut, scale]
  );

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (haptic) tap();
      onPress?.(event);
    },
    [haptic, onPress]
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
