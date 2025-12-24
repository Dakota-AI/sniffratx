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
import { supabase } from '../../../lib/supabase';
import { Connection, Profile, Dog } from '../../../types/database';

interface PendingRequest {
  connection: Connection;
  profile: Profile;
  dog: Dog | null;
}

export default function ConnectionRequestsScreen() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
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
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleResponse(item.connection.id, false)}
        >
          <Ionicons name="close" size={24} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleResponse(item.connection.id, true)}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
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
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dogInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
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
});
