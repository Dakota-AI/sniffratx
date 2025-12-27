import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Profile, Dog, Connection } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';

// Demo mode profiles
const DEMO_MODE = true;

const DEMO_PROFILES: Record<string, { profile: Profile; dog: Dog }> = {
  'demo-1': {
    profile: {
      id: 'demo-1',
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      bio: 'Dog mom to the best golden retriever! Love morning walks at Zilker Park.',
      favorite_places: ['Zilker Park', 'Auditorium Shores'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: {
      id: 'd1',
      owner_id: 'demo-1',
      name: 'Max',
      breed: 'Golden Retriever',
      age_years: 3,
      bio: 'Friendly and loves to play fetch!',
      photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'demo-2': {
    profile: {
      id: 'demo-2',
      display_name: 'Mike Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: 'Corgi dad. Software engineer by day, dog park regular by evening.',
      favorite_places: ['Auditorium Shores', 'Red Bud Isle'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: {
      id: 'd2',
      owner_id: 'demo-2',
      name: 'Biscuit',
      breed: 'Corgi',
      age_years: 2,
      bio: 'Short legs, big personality!',
      photo_url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=300',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'demo-3': {
    profile: {
      id: 'demo-3',
      display_name: 'Emma Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      bio: 'Rescue dog advocate. Luna is my third rescue and absolute best friend.',
      favorite_places: ['Red Bud Isle', 'Norwood Estate Dog Park'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: {
      id: 'd3',
      owner_id: 'demo-3',
      name: 'Luna',
      breed: 'Mixed Breed',
      age_years: 4,
      bio: 'Rescued from a shelter, now living her best life!',
      photo_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'demo-4': {
    profile: {
      id: 'demo-4',
      display_name: 'Alex Turner',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      bio: 'New to Austin! Looking for dog park buddies. Just moved here from Denver with my best buddy Charlie.',
      favorite_places: ['Zilker Park'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: {
      id: 'd4',
      owner_id: 'demo-4',
      name: 'Charlie',
      breed: 'Labrador',
      age_years: 2,
      bio: 'Energetic lab who loves swimming and fetching!',
      photo_url: 'https://images.unsplash.com/photo-1579213838058-5a5e7b0c8a3e?w=300',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'demo-5': {
    profile: {
      id: 'demo-5',
      display_name: 'Jessica Park',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      bio: 'Poodle mom and coffee addict. You can find us at the park every morning!',
      favorite_places: ['Zilker Park', 'Yard Bar'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: {
      id: 'd5',
      owner_id: 'demo-5',
      name: 'Coco',
      breed: 'Poodle',
      age_years: 4,
      bio: 'Fancy poodle with a big heart. Loves making new friends!',
      photo_url: 'https://images.unsplash.com/photo-1616149256106-9f8a75e5aa58?w=300',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

export default function ViewProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    // Check for demo profile first
    if (DEMO_MODE && userId && DEMO_PROFILES[userId]) {
      const demoData = DEMO_PROFILES[userId];
      setProfile(demoData.profile);
      setDog(demoData.dog);
      setConnection({ id: 'demo-conn', requester_id: 'me', addressee_id: userId, status: 'accepted', created_at: '', updated_at: '' });
      setCurrentUserId('current-user');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch dog
    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId)
      .single();

    // Fetch connection status
    const { data: connectionData } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    // Check if current user blocked this person
    const { data: blockedData } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
      .single();

    // Check if this person blocked current user
    const { data: blockedMeData } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', user.id)
      .single();

    setProfile(profileData);
    setDog(dogData);
    setConnection(connectionData);
    setIsBlocked(!!blockedData);
    setHasBlockedMe(!!blockedMeData);
    setLoading(false);
  };

  const handleUnfriend = () => {
    Alert.alert(
      'Remove Connection',
      `Are you sure you want to remove ${profile?.display_name} from your connections? You won't be able to message each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            if (connection) {
              await supabase
                .from('connections')
                .delete()
                .eq('id', connection.id);
              setConnection(null);
            }
            setActionLoading(false);
            Alert.alert('Removed', 'Connection removed successfully.');
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile?.display_name}? They won't be able to message you or see your profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);

            // Add to blocked users
            await supabase
              .from('blocked_users')
              .insert({
                blocker_id: currentUserId,
                blocked_id: userId,
              });

            // Also remove any connection
            if (connection) {
              await supabase
                .from('connections')
                .delete()
                .eq('id', connection.id);
              setConnection(null);
            }

            setIsBlocked(true);
            setActionLoading(false);
            Alert.alert('Blocked', `${profile?.display_name} has been blocked.`);
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    setActionLoading(true);

    await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', userId);

    setIsBlocked(false);
    setActionLoading(false);
    Alert.alert('Unblocked', `${profile?.display_name} has been unblocked.`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>Profile not found</Text>
      </View>
    );
  }

  // If this user blocked the current user
  if (hasBlockedMe) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>This profile is not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Image
          source={
            profile.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Action Buttons */}
        {!isBlocked && (
          <View style={styles.actionButtons}>
            {connection && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => router.push(`/(tabs)/messages/${userId}`)}
              >
                <Ionicons name="chatbubble" size={18} color={colors.textInverse} />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            )}

            {connection && (
              <TouchableOpacity
                style={styles.unfriendButton}
                onPress={handleUnfriend}
                disabled={actionLoading}
              >
                <Ionicons name="person-remove-outline" size={18} color={colors.warning} />
                <Text style={styles.unfriendButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Dog Section */}
      {dog && !isBlocked && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Their Dog</Text>
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
        </View>
      )}

      {/* Favorite Places */}
      {profile.favorite_places && profile.favorite_places.length > 0 && !isBlocked && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Places</Text>
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

      {/* Block/Unblock Section */}
      <View style={styles.dangerSection}>
        {isBlocked ? (
          <TouchableOpacity
            style={styles.unblockButton}
            onPress={handleUnblock}
            disabled={actionLoading}
          >
            <Ionicons name="lock-open-outline" size={20} color={colors.success} />
            <Text style={styles.unblockButtonText}>
              {actionLoading ? 'Unblocking...' : 'Unblock User'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.blockButton}
            onPress={handleBlock}
            disabled={actionLoading}
          >
            <Ionicons name="ban-outline" size={20} color={colors.error} />
            <Text style={styles.blockButtonText}>
              {actionLoading ? 'Blocking...' : 'Block User'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  headerSection: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceHover,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  bio: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  messageButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  unfriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  unfriendButtonText: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
  dangerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  blockButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  unblockButtonText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
