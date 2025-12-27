import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Message } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../../lib/theme';

// Demo mode
const DEMO_MODE = true;

const DEMO_MESSAGES: Record<string, Message[]> = {
  'demo-1': [
    { id: '1', sender_id: 'demo-1', receiver_id: 'me', content: 'Hey! I saw you at Zilker yesterday with your pup!', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: '2', sender_id: 'me', receiver_id: 'demo-1', content: 'Oh hey! Yes that was us! Your golden is so beautiful', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: '3', sender_id: 'demo-1', receiver_id: 'me', content: 'Thanks! Max loved playing with your dog. They seemed to really get along!', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: '4', sender_id: 'me', receiver_id: 'demo-1', content: 'Right?! We should set up a playdate sometime', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: '5', sender_id: 'demo-1', receiver_id: 'me', content: 'Max had so much fun at the park today! We should do it again soon 🐕', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  'demo-2': [
    { id: '1', sender_id: 'me', receiver_id: 'demo-2', content: 'Hey Mike! Love your corgi', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: '2', sender_id: 'demo-2', receiver_id: 'me', content: 'Thanks! Biscuit is a handful but the best boy', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
    { id: '3', sender_id: 'demo-2', receiver_id: 'me', content: 'Are you going to Zilker this weekend?', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  ],
  'demo-3': [
    { id: '1', sender_id: 'demo-3', receiver_id: 'me', content: 'Hi! Just wanted to say your dog is adorable!', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    { id: '2', sender_id: 'me', receiver_id: 'demo-3', content: 'Aww thank you! Luna is such a sweetheart too', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() },
    { id: '3', sender_id: 'demo-3', receiver_id: 'me', content: 'Luna loved meeting your pup! Such a sweetie', read_at: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  ],
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(DEMO_MODE ? 'me' : null);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    const setup = async () => {
      // Demo mode - load demo messages
      if (DEMO_MODE && id && DEMO_MESSAGES[id]) {
        setMessages(DEMO_MESSAGES[id]);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Check if either user has blocked the other
        const { data: blockedByMe } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', id)
          .single();

        const { data: blockedMe } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', id)
          .eq('blocked_id', user.id)
          .single();

        setIsBlocked(!!blockedByMe);
        setHasBlockedMe(!!blockedMe);

        if (!blockedByMe && !blockedMe) {
          fetchMessages(user.id);
          markAsRead(user.id);
          subscribeToMessages(user.id);
        }

        setLoading(false);
      }
    };
    setup();
  }, [id]);

  const fetchMessages = async (currentUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const markAsRead = async (currentUserId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', id)
      .eq('receiver_id', currentUserId)
      .is('read_at', null);
  };

  const subscribeToMessages = (currentUserId: string) => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === id) {
            setMessages(prev => [...prev, newMsg]);
            markAsRead(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: id,
        content,
      })
      .select()
      .single();

    if (data) {
      setMessages(prev => [...prev, data]);
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === userId;

    return (
      <View style={[styles.messageContainer, isMe && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show blocked state
  if (isBlocked || hasBlockedMe) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="ban-outline" size={48} color={colors.textMuted} />
        <Text style={styles.blockedTitle}>
          {isBlocked ? 'You blocked this user' : 'You cannot message this user'}
        </Text>
        <Text style={styles.blockedText}>
          {isBlocked
            ? 'Unblock them from their profile to resume messaging.'
            : 'This conversation is no longer available.'}
        </Text>
        {isBlocked && (
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => router.push(`/(tabs)/profile/${id}`)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? colors.textInverse : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  blockedTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  blockedText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  viewProfileButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  viewProfileText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  messagesList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageContainer: {
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  myMessageText: {
    color: colors.textInverse,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
