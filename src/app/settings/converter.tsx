import * as DocumentPicker from 'expo-document-picker';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { useRouter } from 'expo-router';
import {
  AudioWaveform,
  CircleCheck,
  Download,
  FileMusic,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow, RowGroup, SectionLabel } from '@/components/ui/ListRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { clearConversions, insertConversion, listConversions } from '@/db/conversions';
import { formatBytes, formatDuration, formatRelative } from '@/lib/format';
import { createId } from '@/lib/ids';
import { decodeAudioFile, encodeWav, wavFileName } from '@/lib/wav';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Phase = 'idle' | 'ready' | 'decoding' | 'encoding' | 'done' | 'error';

type Result = {
  name: string;
  size: number;
  url: string;
  duration: number;
};

const MAX_INPUT_BYTES = 100 * 1024 * 1024;

export default function ConverterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const account = useAuthStore((state) => state.account);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [selected, setSelected] = React.useState<DocumentPickerAsset | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);
  const [historyVersion, refreshHistory] = React.useReducer((value: number) => value + 1, 0);
  const resultUrl = React.useRef<string | null>(null);

  const history = React.useMemo(() => {
    void historyVersion;
    if (!account) return [];
    try {
      return listConversions(account.id);
    } catch {
      return [];
    }
  }, [account, historyVersion]);

  React.useEffect(
    () => () => {
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    [],
  );

  const releaseResult = () => {
    if (resultUrl.current) {
      URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = null;
    }
    setResult(null);
  };

  const reset = () => {
    releaseResult();
    setSelected(null);
    setPhase('idle');
    setProgress(0);
    setDuration(0);
    setError(null);
  };

  const pickFile = async () => {
    setError(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: false,
        multiple: false,
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset) return;
      if (asset.size && asset.size > MAX_INPUT_BYTES) {
        setError('Choose an audio file smaller than 100 MB.');
        return;
      }
      releaseResult();
      setSelected(asset);
      setDuration(0);
      setProgress(0);
      setPhase('ready');
    } catch {
      setError('The file picker could not be opened.');
    }
  };

  const convert = async () => {
    if (!selected) return;
    setPhase('decoding');
    setError(null);
    setProgress(0);

    try {
      const bytes = selected.file
        ? await selected.file.arrayBuffer()
        : await (await fetch(selected.uri)).arrayBuffer();
      const decoded = await decodeAudioFile(bytes);
      setDuration(decoded.length / decoded.sampleRate);
      setPhase('encoding');
      const wav = await encodeWav(decoded, { onProgress: setProgress });
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      resultUrl.current = url;
      setResult({
        name: wavFileName(selected.name),
        size: blob.size,
        url,
        duration: decoded.length / decoded.sampleRate,
      });
      setPhase('done');
      setProgress(1);

      if (account) {
        try {
          insertConversion(account.id, {
            id: createId('conv'),
            inputName: selected.name,
            outputName: wavFileName(selected.name),
            outputUri: '',
            format: 'wav',
            bitrateKbps: Math.round((16 * decoded.numberOfChannels * decoded.sampleRate) / 1000),
            sampleRate: decoded.sampleRate,
            status: 'completed',
            sizeBytes: blob.size,
            createdAt: Date.now(),
          });
          refreshHistory();
        } catch {
          // The file is still ready to save even if history cannot be recorded.
        }
      }
    } catch (cause) {
      setPhase('error');
      setProgress(0);
      setError(
        cause instanceof Error && cause.name === 'EncodingError'
          ? 'This browser could not decode that file. Try MP3, WAV, M4A, or OGG.'
          : cause instanceof Error && cause.name === 'NotSupportedError'
            ? 'This browser does not support that audio format.'
            : 'That file could not be converted. It may be damaged or use an unsupported codec.',
      );
    }
  };

  const save = () => {
    if (!result) return;
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = result.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const confirmClear = () => {
    if (!account) return;
    Alert.alert('Clear conversion history?', 'File details will be removed. Your audio files are untouched.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          try {
            clearConversions(account.id);
          } catch {
            return;
          }
          refreshHistory();
        },
      },
    ]);
  };

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <PageHeader title="Audio converter" onBack={() => router.back()} />
        <EmptyState
          icon={AudioWaveform}
          title="Converter runs on the web"
          description="Browser audio decoding isn't available in the native build. Open BOUND on the web to convert files to WAV."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const busy = phase === 'decoding' || phase === 'encoding';

  return (
    <Screen>
      <PageHeader
        title="Audio converter"
        subtitle="Local · private"
        right={
          history.length > 0 ? (
            <IconButton
              icon={Trash2}
              accessibilityLabel="Clear conversion history"
              onPress={confirmClear}
            />
          ) : undefined
        }
      />

      <View
        style={[
          styles.intro,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={[styles.introIcon, { backgroundColor: colors.accentSoft }]}>
          <AudioWaveform size={26} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.introText}>
          <Text variant="heading">Make a clean WAV</Text>
          <Text variant="small" tone="secondary">
            Audio is decoded and converted on this device with the Web Audio API. Nothing is
            uploaded.
          </Text>
        </View>
        <View style={styles.privacy}>
          <ShieldCheck size={14} color={colors.success} strokeWidth={2} />
          <Text variant="caption" tone="tertiary">
            Private by design
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>INPUT</SectionLabel>
        {selected ? (
          <View
            style={[
              styles.fileCard,
              { backgroundColor: colors.surfaceSolid, borderColor: colors.borderStrong },
            ]}>
            <View style={[styles.fileIcon, { backgroundColor: colors.surfaceSunken }]}>
              <FileMusic size={22} color={colors.accent} strokeWidth={1.8} />
            </View>
            <View style={styles.fileText}>
              <Text variant="bodySemibold" numberOfLines={1}>
                {selected.name}
              </Text>
              <Text variant="caption" tone="tertiary">
                {[
                  selected.size ? formatBytes(selected.size) : null,
                  duration ? formatDuration(duration) : null,
                  selected.mimeType?.replace('audio/', '').toUpperCase() ?? null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Audio file'}
              </Text>
            </View>
            {!busy ? (
              <Button label="Change" variant="ghost" size="sm" onPress={pickFile} />
            ) : null}
          </View>
        ) : (
          <View
            style={[
              styles.dropZone,
              { backgroundColor: colors.surface, borderColor: colors.borderStrong },
            ]}>
            <Upload size={24} color={colors.textTertiary} strokeWidth={1.6} />
            <Text variant="small" tone="secondary" center>
              Pick an MP3, WAV, M4A, AAC, OGG, or FLAC file from this device.
            </Text>
            <Button label="Choose audio file" icon={Upload} onPress={pickFile} size="sm" />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionLabel>OUTPUT</SectionLabel>
        <RowGroup>
          <ListRow
            icon={AudioWaveform}
            title="WAV · 16-bit PCM"
            subtitle="Uncompressed, lossless copy at the source sample rate"
            value=".wav"
            showChevron={false}
          />
        </RowGroup>
        <Text variant="caption" tone="tertiary">
          WAV files are much larger than compressed audio. A 4-minute song can be 40–50 MB.
        </Text>
      </View>

      {busy ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressLabels}>
            <Text variant="small" tone="secondary">
              {phase === 'decoding' ? 'Reading audio…' : 'Writing WAV…'}
            </Text>
            <Text variant="small" tone="tertiary">
              {phase === 'encoding' ? `${Math.round(progress * 100)}%` : ''}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceStrong }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accent,
                  width: `${phase === 'decoding' ? 8 : Math.max(2, progress * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.error, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text variant="small" tone="danger">
            {error}
          </Text>
        </View>
      ) : null}

      {result ? (
        <View
          style={[
            styles.result,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.accentBorder },
          ]}>
          <View style={styles.resultHeader}>
            <CircleCheck size={22} color={colors.success} strokeWidth={2} />
            <View style={styles.resultText}>
              <Text variant="bodySemibold">WAV ready</Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {result.name}
              </Text>
            </View>
          </View>
          <View style={styles.resultMeta}>
            <Text variant="small" tone="secondary">
              {formatBytes(result.size)} · {formatDuration(result.duration)}
            </Text>
            <Text variant="caption" tone="tertiary">
              Not saved until you download it
            </Text>
          </View>
          <View style={styles.resultActions}>
            <Button
              label="Save WAV"
              icon={Download}
              onPress={save}
              fullWidth
              style={styles.resultButton}
            />
            <Button
              label="Convert another"
              variant="secondary"
              onPress={reset}
              fullWidth
              style={styles.resultButton}
            />
          </View>
        </View>
      ) : null}

      {selected && !result && !busy ? (
        <Button label="Convert to WAV" icon={AudioWaveform} onPress={convert} fullWidth />
      ) : null}

      {history.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel>RECENT CONVERSIONS</SectionLabel>
          <RowGroup>
            {history.slice(0, 6).map((record) => (
              <ListRow
                key={record.id}
                icon={FileMusic}
                title={record.outputName}
                subtitle={`WAV · ${formatBytes(record.sizeBytes)} · ${formatRelative(record.createdAt)}`}
                showChevron={false}
              />
            ))}
          </RowGroup>
          <Text variant="caption" tone="tertiary">
            Only file details are kept. Converted audio is never stored by BOUND.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  introIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    gap: 4,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dropZone: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  fileCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileText: {
    flex: 1,
    gap: 2,
  },
  progressWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  error: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  result: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultText: {
    flex: 1,
    gap: 1,
  },
  resultMeta: {
    gap: 2,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultButton: {
    flex: 1,
  },
});
