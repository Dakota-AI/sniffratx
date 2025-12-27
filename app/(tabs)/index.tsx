import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Connection, Profile, Dog } from '../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../lib/theme';

interface ConnectionWithProfile extends Connection {
  profiles: Profile & { dogs: Dog[] };
}

// Set to true to preview UI with demo connections
const DEMO_MODE = true;

const DEMO_CONNECTIONS: ConnectionWithProfile[] = [
  {
    id: 'demo-1',
    requester_id: 'demo',
    addressee_id: 'demo-1',
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: 'demo-1',
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      bio: 'Dog mom to the best golden retriever!',
      favorite_places: ['Zilker Park'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dogs: [{ id: 'd1', owner_id: 'demo-1', name: 'Max', breed: 'Golden Retriever', age_years: 3, bio: null, photo_url: null, created_at: '', updated_at: '' }],
    },
  },
  {
    id: 'demo-2',
    requester_id: 'demo',
    addressee_id: 'demo-2',
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: 'demo-2',
      display_name: 'Mike Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: 'Corgi dad',
      favorite_places: ['Auditorium Shores'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dogs: [{ id: 'd2', owner_id: 'demo-2', name: 'Biscuit', breed: 'Corgi', age_years: 2, bio: null, photo_url: null, created_at: '', updated_at: '' }],
    },
  },
  {
    id: 'demo-3',
    requester_id: 'demo',
    addressee_id: 'demo-3',
    status: 'accepted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: 'demo-3',
      display_name: 'Emma Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      bio: 'Rescue dog advocate',
      favorite_places: ['Red Bud Isle'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dogs: [{ id: 'd3', owner_id: 'demo-3', name: 'Luna', breed: 'Mixed Breed', age_years: 4, bio: null, photo_url: null, created_at: '', updated_at: '' }],
    },
  },
];

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>(DEMO_MODE ? DEMO_CONNECTIONS : []);
  const [pendingCount, setPendingCount] = useState(DEMO_MODE ? 2 : 0);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchConnections = async () => {
    // Skip fetching in demo mode
    if (DEMO_MODE) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch accepted connections
    const { data: accepted } = await supabase
      .from('connections')
      .select(`
        *,
        profiles:addressee_id(*, dogs(*))
      `)
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    const { data: acceptedReverse } = await supabase
      .from('connections')
      .select(`
        *,
        profiles:requester_id(*, dogs(*))
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'accepted');

    // Fetch pending count
    const { count } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    setConnections([...(accepted || []), ...(acceptedReverse || [])] as ConnectionWithProfile[]);
    setPendingCount(count || 0);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConnections();
  };

  const renderConnection = ({ item }: { item: ConnectionWithProfile }) => {
    const profile = item.profiles;
    const dog = profile?.dogs?.[0];

    return (
      <TouchableOpacity
        style={styles.connectionCard}
        onPress={() => router.push(`/(tabs)/profile/${profile?.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{profile?.display_name}</Text>
          {dog && (
            <View style={styles.dogRow}>
              <Text style={styles.dogEmoji}>🐕</Text>
              <Text style={styles.dogInfo}>
                {dog.name}{dog.breed && ` • ${dog.breed}`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Pack</Text>
        <Text style={styles.headerSubtitle}>
          {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Pending Requests Banner */}
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push('/(tabs)/profile/requests')}
          activeOpacity={0.8}
        >
          <View style={styles.pendingIconContainer}>
            <Ionicons name="person-add" size={18} color={colors.textInverse} />
          </View>
          <Text style={styles.pendingText}>
            {pendingCount} new request{pendingCount > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}

      <FlatList
        data={connections}
        renderItem={renderConnection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="paw" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No connections yet</Text>
            <Text style={styles.emptyText}>
              Head to the dog park and scan someone's QR code to make your first connection!
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={20} color={colors.textInverse} />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  pendingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  connectionName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  dogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dogEmoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  dogInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  scanButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
