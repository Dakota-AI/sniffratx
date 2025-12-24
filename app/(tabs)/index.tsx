import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Connection, Profile, Dog } from '../../types/database';

interface ConnectionWithProfile extends Connection {
  profiles: Profile & { dogs: Dog[] };
}

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchConnections = async () => {
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
            <Text style={styles.dogInfo}>
              🐕 {dog.name} {dog.breed && `• ${dog.breed}`}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push('/(tabs)/profile/requests')}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.pendingText}>
            {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <FlatList
        data={connections}
        renderItem={renderConnection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No connections yet</Text>
            <Text style={styles.emptyText}>
              Scan someone's QR code at the dog park to connect!
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pendingText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  connectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dogInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
