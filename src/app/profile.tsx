import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  ArrowUpRight,
  Copy,
  Download,
  Heart,
  KeyRound,
  ListMusic,
  LogOut,
  Pencil,
  Settings2,
  Trash2,
  UserCheck,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import {
  ListRow,
  RowDivider,
  RowGroup,
  SectionLabel,
} from '@/components/ui/ListRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { toast } from '@/stores/toastStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const account = useAuthStore((state) => state.account);
  const busy = useAuthStore((state) => state.busy);
  const recoveryKey = useAuthStore((state) => state.recoveryKey);
  const signOut = useAuthStore((state) => state.signOut);
  const upgrade = useAuthStore((state) => state.upgrade);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const regenerateRecoveryKey = useAuthStore((state) => state.regenerateRecoveryKey);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const clearRecoveryKey = useAuthStore((state) => state.clearRecoveryKey);

  const likedCount = useLibraryStore((state) => Object.keys(state.liked).length);
  const playlists = useLibraryStore((state) => state.playlists.length);
  const followingCount = useLibraryStore((state) => Object.keys(state.followedArtists).length);
  const downloadCount = useDownloadsStore(
    (state) => Object.values(state.records).filter((record) => record.status === 'completed').length,
  );

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [upgrading, setUpgrading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  if (!account) return null;
  const isGuest = account.kind === 'guest';

  const openEdit = () => {
    setDisplayName(account.displayName);
    setEditing(true);
  };

  const saveName = () => {
    if (!displayName.trim()) return;
    updateProfile({ displayName: displayName.trim() });
    setEditing(false);
    toast.success('Profile updated');
  };

  const submitUpgrade = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      toast.error('Enter a name, valid email, and a password of at least 8 characters.');
      return;
    }
    setUpgrading(true);
    const ok = await upgrade({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
    setUpgrading(false);
    if (ok) {
      toast.success('Account created. Your library came along.');
      setPassword('');
      setEmail('');
    } else {
      toast.error('Could not create the account. The email may already be in use.');
    }
  };

  const copyKey = async () => {
    if (!recoveryKey) return;
    await Clipboard.setStringAsync(recoveryKey);
    toast.success('Recovery key copied');
  };

  const revealKey = async () => {
    const key = await regenerateRecoveryKey();
    if (!key) toast.error('Could not generate a recovery key.');
  };

  const submitDelete = async () => {
    setDeleting(true);
    const ok = await deleteAccount(isGuest ? undefined : confirmPassword);
    setDeleting(false);
    if (ok) {
      setShowDelete(false);
      router.replace('/');
    } else {
      toast.error('Password incorrect. Try again.');
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your library stays saved on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/'));
        },
      },
    ]);
  };

  return (
    <Screen glow={{ primary: account.accent }}>
      <PageHeader
        title="Profile"
        right={
          <IconButton
            icon={Settings2}
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
        }
      />

      <View style={styles.hero}>
        <Avatar
          name={account.displayName}
          seed={account.avatarSeed}
          color={account.accent}
          size={92}
          ring
        />
        <Text variant="title" center>
          {account.displayName}
        </Text>
        <Text variant="small" tone="tertiary" center>
          {isGuest ? 'Guest listener · local library only' : account.email}
        </Text>
        <Text variant="caption" tone="tertiary" center>
          {isGuest
            ? 'Upgrade to keep your library portable'
            : `Member since ${new Date(account.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}`}
        </Text>
        <Button
          label="Edit profile"
          variant="secondary"
          size="sm"
          icon={Pencil}
          onPress={openEdit}
        />
      </View>

      <View style={[styles.stats, { borderColor: colors.border }]}>
        {[
          { label: 'Liked', value: likedCount },
          { label: 'Playlists', value: playlists },
          { label: 'Following', value: followingCount },
          { label: 'Offline', value: downloadCount },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text variant="heading">{stat.value}</Text>
            <Text variant="caption" tone="tertiary">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {isGuest ? (
        <View style={[styles.upgrade, { borderColor: colors.accentBorder }]}>
          <View style={styles.upgradeHeader}>
            <ArrowUpRight size={18} color={colors.accent} />
            <Text variant="bodySemibold" tone="accent">
              Become a member
            </Text>
          </View>
          <Text variant="small" tone="secondary">
            Keep your likes, playlists, downloads, and history. Your guest library is upgraded in
            place — nothing is lost.
          </Text>
          <View style={styles.upgradeForm}>
            <TextField
              label="DISPLAY NAME"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <TextField
              label="EMAIL"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={UserCheck}
            />
            <TextField
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              secure
              hint="At least 8 characters"
            />
            <Button
              label="Create member account"
              onPress={submitUpgrade}
              loading={upgrading || busy}
              fullWidth
            />
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <SectionLabel>SECURITY</SectionLabel>
          <RowGroup>
            <ListRow
              icon={KeyRound}
              title="Recovery key"
              subtitle={
                recoveryKey
                  ? 'Visible below — store it somewhere safe'
                  : 'Generate a key to recover a forgotten password'
              }
              onPress={revealKey}
              value={recoveryKey ? 'Regenerate' : 'Show'}
            />
            {recoveryKey ? (
              <View style={[styles.keyBox, { borderColor: colors.borderStrong }]}>
                <Text variant="bodySemibold" style={styles.key} selectable>
                  {recoveryKey}
                </Text>
                <Button
                  label="Copy"
                  icon={Copy}
                  size="sm"
                  variant="secondary"
                  onPress={copyKey}
                />
              </View>
            ) : null}
            <RowDivider />
            <ListRow
              icon={LogOut}
              title="Sign out"
              onPress={confirmSignOut}
              showChevron={false}
            />
          </RowGroup>
        </View>
      )}

      <View style={styles.section}>
        <SectionLabel>SHORTCUTS</SectionLabel>
        <RowGroup>
          <ListRow
            icon={Heart}
            title="Liked songs"
            value={String(likedCount)}
            onPress={() => router.push('/(tabs)/library')}
          />
          <RowDivider />
          <ListRow
            icon={ListMusic}
            title="Playlists"
            value={String(playlists)}
            onPress={() => router.push('/(tabs)/library')}
          />
          <RowDivider />
          <ListRow
            icon={Download}
            title="Downloads"
            value={String(downloadCount)}
            onPress={() => router.push('/(tabs)/downloads')}
          />
          <RowDivider />
          <ListRow
            icon={UserCheck}
            title="Settings"
            onPress={() => router.push('/settings')}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>DANGER ZONE</SectionLabel>
        <RowGroup>
          <ListRow
            icon={Trash2}
            title="Delete account"
            subtitle="Removes this account and its library from the device"
            destructive
            showChevron={false}
            onPress={() => {
              setConfirmPassword('');
              setShowDelete(true);
            }}
          />
        </RowGroup>
      </View>

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Edit profile">
        <View style={styles.sheetForm}>
          <TextField
            label="DISPLAY NAME"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={40}
            autoCapitalize="words"
          />
          <Button
            label="Save"
            onPress={saveName}
            fullWidth
            disabled={!displayName.trim()}
          />
        </View>
      </Sheet>

      <Sheet
        visible={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete account?"
        subtitle="This cannot be undone. Playlists, likes, downloads, and history are erased.">
        <View style={styles.sheetForm}>
          {!isGuest ? (
            <TextField
              label="CONFIRM WITH PASSWORD"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
            />
          ) : null}
          <Button
            label="Delete permanently"
            variant="danger"
            onPress={submitDelete}
            loading={deleting}
            disabled={!isGuest && confirmPassword.length === 0}
            fullWidth
          />
          <Button
            label="Keep account"
            variant="ghost"
            onPress={() => {
              setShowDelete(false);
              clearRecoveryKey();
            }}
            fullWidth
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  upgrade: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeForm: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  keyBox: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  key: {
    fontSize: 16,
    letterSpacing: 1.5,
  },
  sheetForm: {
    gap: spacing.md,
  },
});
