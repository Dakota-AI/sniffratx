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
import { supabase } from '../../../lib/supabase';
import { Conversation } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';

// Demo mode - set to true to preview UI
const DEMO_MODE = true;

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    other_user_id: 'demo-1',
    other_user: {
      display_name: 'Sarah Johnson',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    last_message: 'Max had so much fun at the park today! We should do it again soon 🐕',
    last_message_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    unread_count: 2,
  },
  {
    other_user_id: 'demo-2',
    other_user: {
      display_name: 'Mike Chen',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    last_message: 'Are you going to Zilker this weekend?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    unread_count: 0,
  },
  {
    other_user_id: 'demo-3',
    other_user: {
      display_name: 'Emma Rodriguez',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    },
    last_message: 'Luna loved meeting your pup! Such a sweetie',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    unread_count: 1,
  },
];

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_MODE ? DEMO_CONVERSATIONS : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchConversations = async () => {
    // Skip fetching in demo mode
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get blocked user IDs (both directions)
    const { data: blockedByMe } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    const { data: blockedMe } = await supabase
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocked_id', user.id);

    const blockedIds = new Set<string>([
      ...(blockedByMe?.map(b => b.blocked_id) || []),
      ...(blockedMe?.map(b => b.blocker_id) || []),
    ]);

    // Get all messages to build conversation list
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(display_name, avatar_url),
        receiver:profiles!receiver_id(display_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages) {
      setLoading(false);
      return;
    }

    // Group by conversation partner, excluding blocked users
    const conversationMap = new Map<string, Conversation>();

    for (const msg of messages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;

      // Skip blocked users
      if (blockedIds.has(otherId)) continue;

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          other_user_id: otherId,
          other_user: {
            display_name: otherProfile?.display_name || 'Unknown',
            avatar_url: otherProfile?.avatar_url || null,
          },
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: 0,
        });
      }

      if (msg.receiver_id === user.id && !msg.read_at) {
        const conv = conversationMap.get(otherId)!;
        conv.unread_count++;
      }
    }

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => router.push(`/(tabs)/messages/${item.other_user_id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={
          item.other_user.avatar_url
            ? { uri: item.other_user.avatar_url }
            : require('../../../assets/icon.png')
        }
        style={[
          styles.avatar,
          item.unread_count > 0 && styles.avatarUnread,
        ]}
      />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={[
            styles.conversationName,
            item.unread_count > 0 && styles.conversationNameUnread,
          ]}>
            {item.other_user.display_name}
          </Text>
          <Text style={styles.conversationTime}>{formatTime(item.last_message_at)}</Text>
        </View>
        <View style={styles.conversationPreview}>
          <Text
            style={[
              styles.lastMessage,
              item.unread_count > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.last_message}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.other_user_id}
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
              <Ionicons name="chatbubbles" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Connect with someone at the dog park to start chatting!
            </Text>
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
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceHover,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarUnread: {
    borderColor: colors.primary,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  conversationNameUnread: {
    fontWeight: fontWeight.bold,
  },
  conversationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  conversationPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  lastMessage: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  lastMessageUnread: {
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
});
