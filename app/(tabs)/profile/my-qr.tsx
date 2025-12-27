import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { QRPayload } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';

export default function MyQRScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setDisplayName(profile.display_name);
        }
      }
    };
    fetchUser();
  }, []);

  const qrPayload: QRPayload = {
    type: 'sniffr-atx',
    version: 1,
    userId: userId || '',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with me on Sniffr ATX! I'm ${displayName} - let's set up a dog park playdate!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* QR Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrEmoji}>🐕</Text>
            <Text style={styles.scanMe}>Scan to Connect!</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify(qrPayload)}
              size={220}
              color={colors.textPrimary}
              backgroundColor={colors.surface}
            />
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.instructions}>
            Show this QR code to connect with other dog owners at the park!
          </Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.shareButtonText}>Share Profile</Text>
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipIconContainer}>
            <Ionicons name="information" size={16} color={colors.primary} />
          </View>
          <Text style={styles.tipText}>
            The other person will need to accept your connection request before you can message each other.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  qrEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  scanMe: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 4,
    borderColor: colors.primaryLight,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  tipIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
