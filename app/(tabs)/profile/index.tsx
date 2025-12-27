import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Profile, Dog } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';

export default function MyProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Refresh profile every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    setProfile(profileData);
    setDog(dogData);
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Orange Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('../../../assets/icon.png')
              }
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{profile?.display_name}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <View style={styles.headerCurve} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/profile/edit')}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push('/(tabs)/profile/my-qr')}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code" size={18} color={colors.textInverse} />
            <Text style={styles.qrButtonText}>My QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.settingsButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Dog Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Pup</Text>
          {dog ? (
            <View style={styles.dogCard}>
              <Image
                source={
                  dog.photo_url
                    ? { uri: dog.photo_url }
                    : require('../../../assets/icon.png')
                }
                style={styles.dogPhoto}
              />
              <View style={styles.dogInfo}>
                <Text style={styles.dogName}>{dog.name}</Text>
                {dog.breed && (
                  <View style={styles.dogDetailRow}>
                    <Ionicons name="paw-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.dogBreed}>{dog.breed}</Text>
                  </View>
                )}
                {dog.age_years && (
                  <View style={styles.dogDetailRow}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.dogAge}>
                      {dog.age_years} year{dog.age_years > 1 ? 's' : ''} old
                    </Text>
                  </View>
                )}
                {dog.bio && <Text style={styles.dogBio}>{dog.bio}</Text>}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addDogButton}
              onPress={() => router.push('/(tabs)/profile/edit')}
              activeOpacity={0.7}
            >
              <View style={styles.addDogIconContainer}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <Text style={styles.addDogText}>Add your dog</Text>
              <Text style={styles.addDogSubtext}>Let others know about your pup!</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Favorite Places */}
        {profile?.favorite_places && profile.favorite_places.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Dog Parks</Text>
            <View style={styles.placesList}>
              {profile.favorite_places.map((place, index) => (
                <View key={index} style={styles.placeTag}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <Text style={styles.placeText}>{place}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  headerSection: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: 'center',
    position: 'relative',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceHover,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    marginTop: spacing.md,
  },
  bio: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  qrButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
    gap: spacing.xs,
  },
  settingsButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dogCard: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dogPhoto: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceHover,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dogDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dogBreed: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dogAge: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dogBio: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  addDogButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  addDogIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addDogText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  addDogSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  placesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  placeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  placeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
