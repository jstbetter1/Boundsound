import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/stores/playerStore';
import { useToastStore } from '@/stores/toastStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

export function FeedbackHost() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const playerError = usePlayerStore((state) => state.error);
  const playerNotice = usePlayerStore((state) => state.notice);
  const toastMessage = useToastStore((state) => state.message);
  const toastTone = useToastStore((state) => state.tone);
  const nonce = useToastStore((state) => state.nonce);
  const dismissError = usePlayerStore((state) => state.dismissError);
  const dismissNotice = usePlayerStore((state) => state.dismissNotice);
  const hideToast = useToastStore((state) => state.hide);

  const message = playerError ?? toastMessage ?? playerNotice;
  if (!message) return null;

  const tone = playerError ? 'danger' : toastMessage ? toastTone : 'default';
  const backgroundColor =
    tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.surfaceSolid;
  const textColor =
    tone === 'default' ? colors.text : tone === 'danger' ? '#1A0507' : '#04120B';

  const dismiss = () => {
    if (playerError) dismissError();
    else if (toastMessage) hideToast();
    else dismissNotice();
  };

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 6 }]}>
      <Animated.View
        key={`${nonce}-${message}`}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        style={[styles.toast, { backgroundColor, borderColor: colors.borderStrong }]}>
        <Text variant="small" style={{ color: textColor, fontFamily: undefined }} onPress={dismiss}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 200,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 520,
  },
});
