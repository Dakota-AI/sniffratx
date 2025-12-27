import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { CalendarEvent, PlaydateInvitationWithProfile, EventType } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';
import { deleteNativeEvent } from '../../../lib/services/nativeCalendarService';
import { cancelEventNotifications } from '../../../lib/services/notificationService';

const EVENT_COLORS: Record<EventType, string> = {
  playdate: colors.primary,
  vet_appointment: colors.secondary,
  vaccination: colors.success,
  medication: colors.info,
  custom: colors.textSecondary,
};

const EVENT_ICONS: Record<EventType, keyof typeof Ionicons.glyphMap> = {
  playdate: 'people',
  vet_appointment: 'medical',
  vaccination: 'shield-checkmark',
  medication: 'medkit',
  custom: 'calendar',
};

const EVENT_LABELS: Record<EventType, string> = {
  playdate: 'Playdate',
  vet_appointment: 'Vet Appointment',
  vaccination: 'Vaccination',
  medication: 'Medication',
  custom: 'Event',
};

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [invitations, setInvitations] = useState<PlaydateInvitationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !eventId) return;

    const { data: eventData } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventData) {
      setEvent(eventData);
      setIsOwner(eventData.owner_id === user.id);

      // Fetch invitations if playdate
      if (eventData.event_type === 'playdate') {
        const { data: inviteData } = await supabase
          .from('playdate_invitations')
          .select('*, invitee:profiles!invitee_id(*)')
          .eq('event_id', eventId);

        if (inviteData) {
          setInvitations(inviteData as any);
        }
      }
    }

    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete from native calendar if synced
            if (event?.native_calendar_id) {
              try {
                await deleteNativeEvent(event.native_calendar_id);
              } catch (e) {
                console.log('Could not delete native event:', e);
              }
            }

            // Cancel any scheduled notifications for this event
            try {
              await cancelEventNotifications(eventId!);
            } catch (e) {
              console.log('Could not cancel notifications:', e);
            }

            // Delete from database
            await supabase.from('calendar_events').delete().eq('id', eventId);
            router.back();
          },
        },
      ]
    );
  };

  const formatDateTime = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (allDay) {
      return dateFormatted;
    }

    const timeFormatted = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dateFormatted} at ${timeFormatted}`;
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const eventColor = EVENT_COLORS[event.event_type];

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={[styles.headerCard, { borderLeftColor: eventColor }]}>
        <View style={[styles.typeIconContainer, { backgroundColor: `${eventColor}20` }]}>
          <Ionicons name={EVENT_ICONS[event.event_type]} size={32} color={eventColor} />
        </View>
        <View style={styles.typeBadge}>
          <Text style={[styles.typeBadgeText, { color: eventColor }]}>
            {EVENT_LABELS[event.event_type]}
          </Text>
        </View>
        <Text style={styles.title}>{event.title}</Text>
        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(event.start_time, event.all_day)}
            </Text>
            {event.end_time && !event.all_day && (
              <Text style={styles.detailSubvalue}>
                Until {new Date(event.end_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        </View>

        {event.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={22} color={colors.textMuted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{event.location}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Vaccination Details */}
      {event.event_type === 'vaccination' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vaccination Details</Text>

          {event.vaccination_type && (
            <View style={styles.detailRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vaccine Type</Text>
                <Text style={styles.detailValue}>{event.vaccination_type}</Text>
              </View>
            </View>
          )}

          {event.expiration_date && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={22} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Expiration Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(event.expiration_date).toLocaleDateString([], {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                {(() => {
                  const days = getDaysUntilExpiration(event.expiration_date);
                  if (days < 0) {
                    return (
                      <View style={[styles.expiryBadge, { backgroundColor: colors.errorLight }]}>
                        <Text style={[styles.expiryText, { color: colors.error }]}>
                          Expired
                        </Text>
                      </View>
                    );
                  } else if (days <= 30) {
                    return (
                      <View style={[styles.expiryBadge, { backgroundColor: colors.warningLight }]}>
                        <Text style={[styles.expiryText, { color: colors.warning }]}>
                          Expires in {days} days
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Medication Details */}
      {event.event_type === 'medication' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medication Details</Text>

          {event.medication_name && (
            <View style={styles.detailRow}>
              <Ionicons name="medkit-outline" size={22} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Medication</Text>
                <Text style={styles.detailValue}>{event.medication_name}</Text>
              </View>
            </View>
          )}

          {event.dosage && (
            <View style={styles.detailRow}>
              <Ionicons name="flask-outline" size={22} color={colors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Dosage</Text>
                <Text style={styles.detailValue}>{event.dosage}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Playdate Invitations */}
      {event.event_type === 'playdate' && invitations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invited</Text>
          {invitations.map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <View style={styles.inviteAvatar}>
                <Ionicons name="person" size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.inviteName}>{invite.invitee?.display_name}</Text>
              <View style={[
                styles.statusBadge,
                invite.status === 'accepted' && { backgroundColor: colors.successLight },
                invite.status === 'declined' && { backgroundColor: colors.errorLight },
                invite.status === 'pending' && { backgroundColor: colors.warningLight },
              ]}>
                <Text style={[
                  styles.statusText,
                  invite.status === 'accepted' && { color: colors.success },
                  invite.status === 'declined' && { color: colors.error },
                  invite.status === 'pending' && { color: colors.warning },
                ]}>
                  {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      {isOwner && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  headerCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    alignItems: 'center',
    ...shadows.lg,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  detailContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  detailSubvalue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  expiryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  expiryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  inviteAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
