import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Connection, Profile, Dog } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';

// Demo mode
const DEMO_MODE = true;

interface PendingRequest {
  connection: Connection;
  profile: Profile;
  dog: Dog | null;
}

const DEMO_REQUESTS: PendingRequest[] = [
  {
    connection: { id: 'req-1', requester_id: 'demo-4', addressee_id: 'me', status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    profile: {
      id: 'demo-4',
      display_name: 'Alex Turner',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      bio: 'New to Austin! Looking for dog park buddies.',
      favorite_places: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: { id: 'd4', owner_id: 'demo-4', name: 'Charlie', breed: 'Labrador', age_years: 2, bio: null, photo_url: null, created_at: '', updated_at: '' },
  },
  {
    connection: { id: 'req-2', requester_id: 'demo-5', addressee_id: 'me', status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    profile: {
      id: 'demo-5',
      display_name: 'Jessica Park',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      bio: 'Poodle mom and coffee addict.',
      favorite_places: ['Zilker Park'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dog: { id: 'd5', owner_id: 'demo-5', name: 'Coco', breed: 'Poodle', age_years: 4, bio: null, photo_url: null, created_at: '', updated_at: '' },
  },
];

export default function ConnectionRequestsScreen() {
  const [requests, setRequests] = useState<PendingRequest[]>(DEMO_MODE ? DEMO_REQUESTS : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    // Skip fetching in demo mode
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: connections } = await supabase
      .from('connections')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (!connections) {
      setLoading(false);
      return;
    }

    const requestsWithProfiles: PendingRequest[] = [];

    for (const conn of connections) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', conn.requester_id)
        .single();

      const { data: dog } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', conn.requester_id)
        .single();

      if (profile) {
        requestsWithProfiles.push({
          connection: conn,
          profile,
          dog,
        });
      }
    }

    setRequests(requestsWithProfiles);
    setLoading(false);
  };

  const handleResponse = async (connectionId: string, accept: boolean) => {
    // Demo mode - just update local state
    if (DEMO_MODE) {
      setRequests(prev => prev.filter(r => r.connection.id !== connectionId));
      Alert.alert(
        accept ? 'Request Accepted!' : 'Request Declined',
        accept ? 'You are now connected!' : 'The request has been removed.'
      );
      return;
    }

    const { error } = await supabase
      .from('connections')
      .update({
        status: accept ? 'accepted' : 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      Alert.alert('Error', 'Failed to update connection');
    } else {
      setRequests(prev => prev.filter(r => r.connection.id !== connectionId));
    }
  };

  const renderRequest = ({ item }: { item: PendingRequest }) => (
    <View style={styles.requestCard}>
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => router.push(`/(tabs)/profile/${item.profile.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={
            item.profile.avatar_url
              ? { uri: item.profile.avatar_url }
              : require('../../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.profile.display_name}</Text>
          {item.dog && (
            <Text style={styles.dogInfo}>
              🐕 {item.dog.name}
              {item.dog.breed && ` • ${item.dog.breed}`}
            </Text>
          )}
          <Text style={styles.viewProfileHint}>Tap to view profile</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleResponse(item.connection.id, false)}
        >
          <Ionicons name="close" size={24} color={colors.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleResponse(item.connection.id, true)}
        >
          <Ionicons name="checkmark" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.connection.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptyText}>
              When someone scans your QR code, their request will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dogInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewProfileHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
