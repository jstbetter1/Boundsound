import { Image } from 'expo-image';
import React, { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { fonts } from '@/theme/tokens';
import { numericSeed, paletteFor } from '@/theme/artwork';
import type { ArtworkSpec } from '@/types';

type Props = {
  artwork?: ArtworkSpec;
  artworkUrl?: string;
  seed?: string;
  size: number;
  radius?: number;
  label?: string;
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
  overlay?: boolean;
};

function CoverArtBase({
  artwork,
  artworkUrl,
  seed = 'bound',
  size,
  radius = 12,
  label,
  sublabel,
  style,
  overlay = true,
}: Props) {
  const spec = artwork ?? { seed, variant: 'rings' as const };
  const palette = paletteFor(spec.seed, spec.palette);
  const n = useMemo(() => numericSeed(spec.seed), [spec.seed]);
  const variant = spec.variant;
  const showLabel = overlay && Boolean(label) && size >= 132;
  const labelSize = Math.max(12, Math.min(30, size * 0.11));

  if (artworkUrl) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: radius, backgroundColor: palette.deep },
          style,
        ]}>
        <Image
          source={{ uri: artworkUrl }}
          style={styles.image}
          contentFit="cover"
          transition={160}
          cachePolicy="memory-disk"
          recyclingKey={artworkUrl}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius, backgroundColor: palette.deep },
        style,
      ]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.from} />
            <Stop offset="0.55" stopColor={palette.via} />
            <Stop offset="1" stopColor={palette.to} />
          </LinearGradient>
          <LinearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.02" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.32" />
          </LinearGradient>
          <LinearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="0" />
            <Stop offset="0.5" stopColor={palette.accent} stopOpacity="0.9" />
            <Stop offset="1" stopColor={palette.accent} stopOpacity="0" />
          </LinearGradient>
          <RadialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
            <Stop offset="0" stopColor={palette.accent} stopOpacity="0.5" />
            <Stop offset="0.6" stopColor={palette.to} stopOpacity="0.18" />
            <Stop offset="1" stopColor={palette.to} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="vignette" cx="0.5" cy="0.45" r="0.78">
            <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.45" />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100" height="100" fill="url(#bg)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#glow)" />
        <Motif variant={variant} palette={palette} n={n} />
        <Rect x="0" y="0" width="100" height="100" fill="url(#vignette)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#sheen)" />
        <Rect x="4" y="4" width="92" height="92" rx="1.4" fill="none" stroke="#FFFFFF" strokeOpacity="0.13" strokeWidth="0.3" />
      </Svg>

      {showLabel ? (
        <View style={[styles.labelWrap, { padding: size * 0.075 }]}>
          <View style={styles.labelRule} />
          <SvgLabel text={label ?? ''} size={labelSize} color={palette.ink} numberOfLines={3} />
          {sublabel ? (
            <SvgLabel
              text={sublabel.toUpperCase()}
              size={Math.max(6, labelSize * 0.34)}
              color={palette.accent}
              tracking={1.4}
              numberOfLines={1}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type LabelProps = {
  text: string;
  size: number;
  color: string;
  tracking?: number;
  numberOfLines?: number;
};

function SvgLabel({ text, size, color, tracking = -0.4, numberOfLines = 2 }: LabelProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        color,
        fontSize: size,
        lineHeight: size * 1.05,
        fontFamily: fonts.heading,
        letterSpacing: tracking,
        textShadowColor: 'rgba(0,0,0,0.22)',
        textShadowRadius: 8,
      }}>
      {text}
    </Text>
  );
}

function Motif({
  variant,
  palette,
  n,
}: {
  variant: string;
  palette: { accent: string; to: string; ink: string; deep: string; from: string };
  n: number;
}) {
  const rot = n % 55;
  switch (variant) {
    case 'orbit':
      return (
        <G rotation={rot} origin="50, 50">
          <Circle cx="50" cy="50" r="35" fill="none" stroke={palette.accent} strokeOpacity="0.34" strokeWidth="0.45" />
          <Circle cx="50" cy="50" r="27" fill="none" stroke={palette.accent} strokeOpacity="0.55" strokeWidth="0.7" />
          <Circle cx="50" cy="50" r="19.5" fill="none" stroke={palette.accent} strokeOpacity="0.28" strokeWidth="0.4" />
          <Circle cx="50" cy="23" r="3.2" fill={palette.accent} fillOpacity="0.95" />
          <Circle cx="77" cy="50" r="1.5" fill={palette.ink} fillOpacity="0.8" />
          <Path d="M8 50 H92" stroke={palette.accent} strokeOpacity="0.2" strokeWidth="0.35" />
        </G>
      );
    case 'wave':
      return (
        <G>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const y = 34 + index * 7.2;
            const amp = 7 - index * 0.7;
            return (
              <Path
                key={index}
                d={`M-5 ${y} C 18 ${y - amp}, 30 ${y + amp}, 50 ${y} S 82 ${y - amp}, 105 ${y}`}
                fill="none"
                stroke={index === 2 ? palette.accent : palette.ink}
                strokeOpacity={index === 2 ? 0.85 : 0.22 - index * 0.02}
                strokeWidth={index === 2 ? 0.9 : 0.45}
              />
            );
          })}
          <Circle cx={24 + (n % 40)} cy={32 + (n % 30)} r="1.1" fill={palette.accent} />
        </G>
      );
    case 'grid':
      return (
        <G>
          {Array.from({ length: 36 }).map((_, index) => {
            const x = 18 + (index % 6) * 13;
            const y = 18 + Math.floor(index / 6) * 13;
            const active = (index * 7 + n) % 9 < 3;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={active ? 1.35 : 0.65}
                fill={active ? palette.accent : palette.ink}
                fillOpacity={active ? 0.9 : 0.26}
              />
            );
          })}
          <Circle cx="50" cy="50" r="30" fill="none" stroke={palette.accent} strokeOpacity="0.32" strokeWidth="0.5" />
          <Path d="M0 78 L100 22" stroke={palette.ink} strokeOpacity="0.16" strokeWidth="0.5" />
        </G>
      );
    case 'bloom':
      return (
        <G>
          <Circle cx="41" cy="47" r="27" fill={palette.accent} fillOpacity="0.16" />
          <Circle cx="61" cy="53" r="22" fill={palette.ink} fillOpacity="0.1" />
          <Circle cx="52" cy="42" r="17.5" fill="none" stroke={palette.accent} strokeOpacity="0.4" strokeWidth="0.5" />
          <Circle cx="52" cy="42" r="7.5" fill={palette.accent} fillOpacity="0.28" />
          <Circle cx="52" cy="42" r="2.1" fill={palette.ink} fillOpacity="0.85" />
          <Path d="M12 84 C 38 66, 62 76, 90 58" fill="none" stroke={palette.accent} strokeOpacity="0.28" strokeWidth="0.4" />
        </G>
      );
    case 'prism':
      return (
        <G rotation={rot * 0.35} origin="50, 50">
          <Path d="M12 78 L40 14 L52 14 L24 78 Z" fill={palette.accent} fillOpacity="0.22" />
          <Path d="M30 86 L58 22 L67 22 L39 86 Z" fill={palette.ink} fillOpacity="0.09" />
          <Path d="M52 84 L78 28 L83 28 L57 84 Z" fill={palette.accent} fillOpacity="0.13" />
          <Path d="M0 56 L100 44" stroke={palette.accent} strokeOpacity="0.55" strokeWidth="0.5" />
          <Circle cx="74" cy="30" r="1.1" fill={palette.ink} fillOpacity="0.8" />
        </G>
      );
    case 'bars':
      return (
        <G>
          {[18, 26, 34, 42, 50, 58, 66, 74, 82].map((x, index) => {
            const height = 12 + ((n >> (index % 8)) % 42);
            return (
              <Rect
                key={x}
                x={x}
                y={50 - height / 2}
                width="4.6"
                height={height}
                rx="2.3"
                fill={index % 3 === 1 ? palette.accent : palette.ink}
                fillOpacity={index % 3 === 1 ? 0.85 : 0.17}
              />
            );
          })}
          <Path d="M6 50 H94" stroke={palette.accent} strokeOpacity="0.3" strokeWidth="0.4" />
        </G>
      );
    case 'eclipse':
      return (
        <G>
          <Circle cx="58" cy="44" r="28" fill={palette.accent} fillOpacity="0.8" />
          <Circle cx="44" cy="50" r="28" fill={palette.deep} fillOpacity="0.93" />
          <Circle cx="58" cy="44" r="28" fill="none" stroke={palette.ink} strokeOpacity="0.3" strokeWidth="0.5" />
          <Circle cx="24" cy="76" r="0.9" fill={palette.ink} fillOpacity="0.7" />
          <Circle cx="78" cy="20" r="0.7" fill={palette.ink} fillOpacity="0.6" />
          <Path d="M10 88 C 32 70, 62 84, 92 62" fill="none" stroke={palette.ink} strokeOpacity="0.2" strokeWidth="0.4" />
        </G>
      );
    default:
      return (
        <G>
          <G rotation={rot - 20} origin="50, 50">
            {[8, 14, 20, 26, 32, 38].map((r, index) => (
              <Ellipse
                key={r}
                cx="50"
                cy="50"
                rx={r}
                ry={r * 0.58}
                fill="none"
                stroke={index % 2 === 0 ? palette.accent : palette.ink}
                strokeOpacity={index % 2 === 0 ? 0.5 - index * 0.045 : 0.12}
                strokeWidth={index % 2 === 0 ? 0.55 : 0.35}
              />
            ))}
          </G>
          <Circle cx="50" cy="50" r="3.2" fill={palette.accent} />
          <Circle cx="50" cy="50" r="1" fill={palette.deep} />
          <Path d="M14 14 H34" stroke={palette.accent} strokeOpacity="0.6" strokeWidth="0.5" />
          <Path d="M66 86 H86" stroke={palette.accent} strokeOpacity="0.35" strokeWidth="0.5" />
        </G>
      );
  }
}

export const CoverArt = memo(CoverArtBase);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 6,
  },
  labelRule: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
});
