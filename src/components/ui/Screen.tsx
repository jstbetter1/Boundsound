import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { AmbientBackground } from './AmbientBackground';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
  glow?: { primary?: string; secondary?: string; intensity?: number } | false;
  footer?: React.ReactNode;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  edges = ['top'],
  glow = {},
  footer,
}: Props) {
  const { colors } = useTheme();
  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.canvas }, style]}>
      {glow ? (
        <AmbientBackground
          primary={glow.primary}
          secondary={glow.secondary}
          intensity={glow.intensity}
        />
      ) : null}
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
});
