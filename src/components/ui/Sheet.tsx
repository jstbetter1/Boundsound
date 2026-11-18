import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  maxHeightRatio?: number;
  showClose?: boolean;
};

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scroll = true,
  maxHeightRatio = 0.9,
  showClose = true,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      const timer = setTimeout(() => {
        progress.value = withTiming(1, { duration: 300 });
      }, 16);
      return () => clearTimeout(timer);
    }
    if (mounted) {
      progress.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [dragY, mounted, progress, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value + (1 - progress.value) * (windowHeight * 0.6) }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (dragY.value > 90 || event.velocityY > 850) {
        runOnJS(onClose)();
      } else {
        dragY.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
          pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                maxHeight: windowHeight * maxHeightRatio,
                backgroundColor: colors.canvasElevated,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
              sheetStyle,
            ]}>
            <GestureDetector gesture={dragGesture}>
              <View style={styles.handleArea}>
                <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
              </View>
            </GestureDetector>
            {title ? (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text variant="heading">{title}</Text>
                  {subtitle ? (
                    <Text variant="small" tone="secondary">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                {showClose ? (
                  <IconButton
                    icon={X}
                    accessibilityLabel="Close"
                    onPress={onClose}
                    size={34}
                    iconSize={18}
                    variant="glass"
                  />
                ) : null}
              </View>
            ) : null}
            {scroll ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}>
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
            {footer ? <View style={[styles.footer, { borderColor: colors.border }]}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboard: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
  },
});
