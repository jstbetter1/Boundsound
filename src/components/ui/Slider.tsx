import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbSize?: number;
  height?: number;
  accessibilityLabel?: string;
};

export function Slider({
  value,
  onChange,
  onSlidingStart,
  onSlidingComplete,
  disabled = false,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbSize = 14,
  height = 26,
  accessibilityLabel = 'Playback position',
}: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayed = dragValue ?? Math.max(0, Math.min(1, value));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const updateFromX = useCallback(
    (x: number) => {
      if (width <= 0) return;
      const next = Math.max(0, Math.min(1, x / width));
      setDragValue(next);
      onChange?.(next);
    },
    [onChange, width]
  );

  const begin = useCallback(() => {
    onSlidingStart?.();
  }, [onSlidingStart]);

  const finish = useCallback(() => {
    setDragValue((current) => {
      onSlidingComplete?.(current ?? Math.max(0, Math.min(1, value)));
      return null;
    });
  }, [onSlidingComplete, value]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(0)
        .hitSlop({ top: 14, bottom: 14 })
        .onBegin((event) => {
          runOnJS(begin)();
          runOnJS(updateFromX)(event.x);
        })
        .onUpdate((event) => {
          runOnJS(updateFromX)(event.x);
        })
        .onEnd(() => {
          runOnJS(finish)();
        })
        .onFinalize(() => {
          runOnJS(finish)();
        }),
    [begin, disabled, finish, updateFromX]
  );

  const active = minimumTrackTintColor ?? colors.accent;
  const inactive = maximumTrackTintColor ?? colors.borderStrong;
  const thumbLeft = Math.max(0, Math.min(width - thumbSize, displayed * width - thumbSize / 2));

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(displayed * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const step = 0.05;
          const next =
            event.nativeEvent.actionName === 'increment'
              ? Math.min(1, displayed + step)
              : Math.max(0, displayed - step);
          onChange?.(next);
          onSlidingComplete?.(next);
        }}
        onLayout={handleLayout}
        style={[styles.trackWrap, { height, opacity: disabled ? 0.4 : 1 }]}>
        <View style={[styles.track, { backgroundColor: inactive }]} />
        <View style={[styles.track, styles.fill, { backgroundColor: active, width: `${displayed * 100}%` }]} />
        <View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: colors.text,
              left: thumbLeft,
              transform: [{ scale: dragValue !== null ? 1.25 : 1 }],
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  trackWrap: {
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  fill: {
    right: undefined,
  },
  thumb: {
    position: 'absolute',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});
