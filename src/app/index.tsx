import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Check,
  Download,
  Library,
  ListMusic,
  Lock,
  LucideIcon,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type Feature = { icon: LucideIcon; title: string; body: string };

const PAYMENT_LINK = process.env.EXPO_PUBLIC_STRIPE_PAYMENT_LINK;

const FEATURES: Feature[] = [
  {
    icon: Library,
    title: 'Your library',
    body: 'Albums, artists and genres, all in one place.',
  },
  {
    icon: ListMusic,
    title: 'Playlists and queue',
    body: 'Build playlists and decide what plays next.',
  },
  {
    icon: Download,
    title: 'Offline listening',
    body: 'Download tracks and play them without a connection.',
  },
];

const BENEFITS = [
  'Your library of albums, artists and genres',
  'Playlists and a play queue',
  'Downloads for offline listening',
];

const MAX_WIDTH = 1080;

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const initialized = useAuthStore((state) => state.initialized);
  const account = useAuthStore((state) => state.account);
  const onboarded = useAuthStore((state) => state.onboarded);

  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const aboutY = useRef(0);
  const purchaseY = useRef(0);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const wide = width >= 860;

  if (!initialized) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.canvas }]}>
        <Image
          source={require('../../assets/images/bound-logo.png')}
          style={styles.bootLogo}
          resizeMode="contain"
          accessibilityLabel="BOUND"
        />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (account) {
    return <Redirect href={onboarded ? '/(tabs)' : '/(auth)/onboarding'} />;
  }

  function scrollToY(y: number) {
    scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
  }

  async function handlePurchase() {
    if (!account) {
      router.push('/(auth)/create-account');
      return;
    }
    if (!PAYMENT_LINK) {
      setPurchaseError('Checkout is not available right now.');
      return;
    }
    setPurchasing(true);
    setPurchaseError(null);
    try {
      await Linking.openURL(PAYMENT_LINK);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : 'Checkout could not be opened.');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + 14,
            backgroundColor: colors.canvas,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.headerInner}>
          <View style={styles.brand}>
            <Image
              source={require('../../assets/images/bound-logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="BOUND"
            />
            <Text style={styles.wordmark}>BOUND</Text>
          </View>
          {wide ? (
            <View style={styles.headerNav}>
              <Button
                label="About"
                variant="ghost"
                size="sm"
                onPress={() => scrollToY(aboutY.current)}
              />
              <Button
                label="Pricing"
                variant="ghost"
                size="sm"
                onPress={() => scrollToY(purchaseY.current)}
              />
            </View>
          ) : null}
          <View style={styles.headerActions}>
            {!account && (
              <>
                <Button
                  label="Log in"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/(auth)/sign-in')}
                />
                <Button
                  label="Sign up"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/(auth)/create-account')}
                />
              </>
            )}
          </View>
        </View>
        {!wide && (
          <View style={styles.headerNavNarrow}>
            <Button
              label="About"
              variant="ghost"
              size="sm"
              onPress={() => scrollToY(aboutY.current)}
            />
            <Button
              label="Pricing"
              variant="ghost"
              size="sm"
              onPress={() => scrollToY(purchaseY.current)}
            />
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, wide ? styles.heroWide : styles.heroNarrow]}>
          <LinearGradient
            pointerEvents="none"
            colors={[colors.surfaceStrong, 'transparent']}
            style={styles.heroGlow}
          />
          <View style={styles.heroColumn}>
            <View style={styles.heroTitleGroup}>
              <Text
                center
                style={[styles.heroTitle, wide ? styles.heroTitleWide : styles.heroTitleNarrow]}>
                Your music library.
              </Text>
              <Text
                center
                tone="tertiary"
                style={[styles.heroTitle, wide ? styles.heroTitleWide : styles.heroTitleNarrow]}>
                Plays offline too.
              </Text>
            </View>

            <Text
              center
              tone="secondary"
              style={[styles.lead, wide ? styles.leadWide : styles.leadNarrow]}>
              Your albums, artists and playlists in one place, with a queue and downloads for when
              you have no signal.
            </Text>

            <View style={styles.heroActions}>
              <Button
                label="Get early access"
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onPress={() => scrollToY(purchaseY.current)}
              />
              <Button
                label="About"
                variant="glass"
                size="lg"
                onPress={() => scrollToY(aboutY.current)}
              />
            </View>
          </View>
        </View>

        <View
          style={[styles.section, wide ? styles.sectionWide : styles.sectionNarrow]}
          onLayout={(event) => {
            aboutY.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.column}>
            <Text variant="eyebrow" tone="tertiary" center>
              About
            </Text>
            <Text center style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
              A simple player for your library
            </Text>
            <Text center tone="secondary" style={styles.aboutLead}>
              BOUND is a music player with a black and white interface. Your library, playlists and
              offline downloads are all in one app.
            </Text>

            <View style={[styles.features, wide && styles.featuresWide]}>
              {FEATURES.map(({ icon: Icon, title, body }, index) => (
                <View
                  key={title}
                  style={[
                    styles.featureCard,
                    wide && styles.featureCardWide,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={[colors.overlayHighlight, 'transparent']}
                    style={styles.featureGlow}
                  />
                  <View style={styles.featureTop}>
                    <View
                      style={[
                        styles.iconBox,
                        { backgroundColor: colors.accentSoft, borderColor: colors.border },
                      ]}>
                      <Icon size={22} color={colors.text} />
                    </View>
                    <Text variant="caption" tone="tertiary">
                      {`0${index + 1}`}
                    </Text>
                  </View>
                  <Text variant="heading">{title}</Text>
                  <Text tone="secondary">{body}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.band,
            wide ? styles.sectionWide : styles.sectionNarrow,
            { backgroundColor: colors.canvasElevated, borderColor: colors.border },
          ]}
          onLayout={(event) => {
            purchaseY.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.column}>
            <Text variant="eyebrow" tone="tertiary" center>
              Pricing
            </Text>
            <Text center style={[styles.sectionTitle, wide && styles.sectionTitleWide]}>
              Early access
            </Text>
            <Text center tone="secondary" style={styles.aboutLead}>
              One monthly subscription. Everything listed below is included.
            </Text>

            <View
              style={[
                styles.purchaseCard,
                {
                  backgroundColor: colors.surfaceSolid,
                  borderColor: colors.accentBorder,
                  shadowColor: colors.shadow,
                },
              ]}>
              <LinearGradient
                pointerEvents="none"
                colors={[colors.surfaceStrong, 'transparent']}
                style={styles.cardGlow}
              />
              <View
                style={[
                  styles.pill,
                  styles.pillSelf,
                  { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
                ]}>
                <Text variant="eyebrow" tone="secondary">
                  BOUND Early Access
                </Text>
              </View>

              <View style={styles.planBlock}>
                <Text variant="display" center>
                  Monthly
                </Text>
                <Text variant="small" tone="tertiary" center>
                  Billed monthly.
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.benefits}>
                {BENEFITS.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <View style={[styles.check, { backgroundColor: colors.accent }]}>
                      <Check size={14} color={colors.accentInk} strokeWidth={3} />
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <Button
                label="Create an account to continue"
                variant="primary"
                size="lg"
                fullWidth
                loading={purchasing}
                onPress={handlePurchase}
              />

              {purchaseError ? (
                <Text variant="small" tone="danger" center>
                  {purchaseError}
                </Text>
              ) : null}

              <View style={styles.secureRow}>
                <Lock size={12} color={colors.textTertiary} />
                <Text variant="caption" tone="tertiary">
                  Payments handled by Stripe
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.wordmark, styles.footerWordmark]} tone="tertiary">
            BOUND
          </Text>
          <Text variant="small" tone="tertiary" center>
            {`\u00A9 ${new Date().getFullYear()} BOUND. All rights reserved.`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  bootLogo: {
    width: 96,
    height: 96,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  headerBar: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  headerInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerNavNarrow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.displayHeavy,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 6,
  },
  column: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 16,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  heroWide: {
    paddingTop: 96,
  },
  heroNarrow: {
    paddingTop: 56,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 600,
  },
  heroColumn: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 26,
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillSelf: {
    alignSelf: 'center',
  },
  heroTitleGroup: {
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: fonts.displayHeavy,
  },
  heroTitleWide: {
    fontSize: 96,
    lineHeight: 96,
    letterSpacing: -4,
  },
  heroTitleNarrow: {
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.8,
  },
  lead: {
    fontFamily: fonts.bodyMedium,
  },
  leadWide: {
    fontSize: 20,
    lineHeight: 31,
    maxWidth: 640,
  },
  leadNarrow: {
    fontSize: 16,
    lineHeight: 25,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
  },
  band: {
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionWide: {
    paddingVertical: 104,
  },
  sectionNarrow: {
    paddingVertical: 64,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  sectionTitleWide: {
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -2,
  },
  aboutLead: {
    fontSize: 17,
    lineHeight: 27,
    maxWidth: 640,
  },
  features: {
    width: '100%',
    gap: 14,
    paddingTop: 28,
  },
  featuresWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  featureCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    padding: 26,
    gap: 10,
  },
  featureCardWide: {
    flex: 1,
    minWidth: 0,
  },
  featureGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  featureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseCard: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 540,
    borderWidth: 1,
    borderRadius: 30,
    padding: 30,
    gap: 22,
    marginTop: 28,
    shadowOpacity: 0.45,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  planBlock: {
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  benefits: {
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerWordmark: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 5,
  },
});