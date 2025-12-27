import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { PlaydateInvitationWithEvent } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';
import { scheduleReminderBeforeEvent } from '../../../lib/services/notificationService';

export default function InvitationsScreen() {
  const [invitations, setInvitations] = useState<PlaydateInvitationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvitations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('playdate_invitations')
      .select(`
        *,
        event:calendar_events!event_id(
          *,
          owner:profiles!owner_id(display_name, avatar_url)
        )
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvitations(data as any);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvitations();
  };

  const handleRespond = async (invitationId: string, accept: boolean) => {
    // Find the invitation to get event details
    const invitation = invitations.find(inv => inv.id === invitationId);

    const { error } = await supabase
      .from('playdate_invitations')
      .update({
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) {
      Alert.alert('Error', 'Failed to respond to invitation');
    } else {
      // If accepted, schedule a reminder notification
      if (accept && invitation?.event) {
        try {
          const eventStartTime = new Date(invitation.event.start_time);
          await scheduleReminderBeforeEvent(
            invitation.event.id,
            invitation.event.title,
            eventStartTime,
            30 // 30 minutes before
          );
        } catch (e) {
          console.log('Could not schedule reminder:', e);
        }
      }

      // Show confirmation
      Alert.alert(
        accept ? 'Accepted!' : 'Declined',
        accept
          ? `You're going to ${invitation?.event?.title}! A reminder will be sent before the event.`
          : 'You have declined this invitation.'
      );

      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderInvitation = ({ item }: { item: PlaydateInvitationWithEvent }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={24} color={colors.primary} />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.eventTitle}>{item.event?.title}</Text>
          <Text style={styles.fromText}>
            From {(item.event as any)?.owner?.display_name}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>
            {item.event?.start_time ? formatDateTime(item.event.start_time) : 'TBD'}
          </Text>
        </View>
        {item.event?.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.event.location}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleRespond(item.id, false)}
        >
          <Ionicons name="close" size={20} color={colors.error} />
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleRespond(item.id, true)}
        >
          <Ionicons name="checkmark" size={20} color={colors.textInverse} />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={invitations}
        renderItem={renderInvitation}
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
              <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No pending invitations</Text>
            <Text style={styles.emptyText}>
              When someone invites you to a playdate, it will appear here
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
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  fromText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsContainer: {
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  declineText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    gap: spacing.xs,
  },
  acceptText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
    fontSize: fontSize.lg,
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
