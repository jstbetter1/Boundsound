import { ChevronRight, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { Text } from './Text';

type RowProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
};

export function ListRow({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  value,
  onPress,
  right,
  destructive,
  disabled,
  showChevron = Boolean(onPress),
}: RowProps) {
  const { colors } = useTheme();
  const content = (
    <>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken }]}>
          <Icon
            size={17}
            color={destructive ? colors.danger : iconColor ?? colors.textSecondary}
            strokeWidth={1.9}
          />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text
          variant="bodySemibold"
          tone={destructive ? 'danger' : 'primary'}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="tertiary" numberOfLines={subtitle.length > 70 ? 3 : 1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="small" tone="tertiary" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {right}
      {showChevron ? <ChevronRight size={17} color={colors.textTertiary} strokeWidth={2} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surface },
        disabled && { opacity: 0.45 },
      ]}>
      {content}
    </Pressable>
  );
}

type SwitchRowProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function SwitchRow({ title, subtitle, icon: Icon, value, onValueChange, disabled }: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSunken }]}>
          <Icon size={17} color={colors.textSecondary} strokeWidth={1.9} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text variant="bodySemibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="tertiary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.borderStrong, true: colors.accentSoft }}
        thumbColor={value ? colors.accent : colors.textSecondary}
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
  );
}

export function RowDivider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export function RowGroup({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      {React.Children.toArray(children).map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <RowDivider /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="eyebrow" tone="tertiary" style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: 132,
    textAlign: 'right',
    fontFamily: fonts.bodyMedium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    opacity: 0.8,
  },
  group: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 4,
  },
});
