import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import { EventType, Profile } from '../../../types/database';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../../lib/theme';
import { createNativeEvent, requestCalendarPermissions } from '../../../lib/services/nativeCalendarService';
import { scheduleReminderBeforeEvent, scheduleVaccinationAlert } from '../../../lib/services/notificationService';

const EVENT_TYPES: { type: EventType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'playdate', label: 'Playdate', icon: 'people', color: colors.primary },
  { type: 'vet_appointment', label: 'Vet Visit', icon: 'medical', color: colors.secondary },
  { type: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark', color: colors.success },
  { type: 'medication', label: 'Medication', icon: 'medkit', color: colors.info },
  { type: 'custom', label: 'Other', icon: 'calendar', color: colors.textSecondary },
];

export default function CreateEventScreen() {
  const [eventType, setEventType] = useState<EventType>('playdate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [allDay, setAllDay] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Vaccination specific
  const [vaccinationType, setVaccinationType] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);

  // Medication specific
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');

  // Connections for playdate
  const [connections, setConnections] = useState<Profile[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);

  // Calendar sync & reminders
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(30);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (eventType === 'playdate') {
      fetchConnections();
    }
  }, [eventType]);

  const fetchConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch accepted connections
    const { data: sent } = await supabase
      .from('connections')
      .select('addressee_id, profiles:addressee_id(*)')
      .eq('requester_id', user.id)
      .eq('status', 'accepted');

    const { data: received } = await supabase
      .from('connections')
      .select('requester_id, profiles:requester_id(*)')
      .eq('addressee_id', user.id)
      .eq('status', 'accepted');

    const allConnections: Profile[] = [];
    sent?.forEach((c: any) => c.profiles && allConnections.push(c.profiles));
    received?.forEach((c: any) => c.profiles && allConnections.push(c.profiles));

    setConnections(allConnections);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your event');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's dog
    const { data: dog } = await supabase
      .from('dogs')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    const eventData = {
      owner_id: user.id,
      dog_id: dog?.id || null,
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start_time: startDate.toISOString(),
      end_time: allDay ? null : endDate.toISOString(),
      all_day: allDay,
      vaccination_type: eventType === 'vaccination' ? vaccinationType : null,
      expiration_date: eventType === 'vaccination' && expirationDate
        ? expirationDate.toISOString().split('T')[0]
        : null,
      medication_name: eventType === 'medication' ? medicationName : null,
      dosage: eventType === 'medication' ? dosage : null,
    };

    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to create event. Please try again.');
      setLoading(false);
      return;
    }

    // Create playdate invitations if selected
    if (eventType === 'playdate' && selectedConnections.length > 0 && newEvent) {
      const invitations = selectedConnections.map(inviteeId => ({
        event_id: newEvent.id,
        invitee_id: inviteeId,
      }));

      await supabase.from('playdate_invitations').insert(invitations);
    }

    // Sync to native calendar if enabled
    if (syncToCalendar && newEvent) {
      try {
        const nativeEventId = await createNativeEvent(newEvent);
        if (nativeEventId) {
          // Save native calendar ID to database
          await supabase
            .from('calendar_events')
            .update({ native_calendar_id: nativeEventId })
            .eq('id', newEvent.id);
        }
      } catch (e) {
        console.log('Could not sync to calendar:', e);
      }
    }

    // Schedule reminder notification
    if (reminderMinutes && newEvent) {
      try {
        await scheduleReminderBeforeEvent(
          newEvent.id,
          newEvent.title,
          startDate,
          reminderMinutes
        );
      } catch (e) {
        console.log('Could not schedule reminder:', e);
      }
    }

    // Schedule vaccination expiry alert
    if (eventType === 'vaccination' && expirationDate && newEvent) {
      try {
        await scheduleVaccinationAlert(
          newEvent.id,
          vaccinationType || 'Vaccination',
          expirationDate,
          30 // Alert 30 days before expiry
        );
      } catch (e) {
        console.log('Could not schedule vaccination alert:', e);
      }
    }

    setLoading(false);
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleConnection = (id: string) => {
    setSelectedConnections(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Event Type Selector */}
      <Text style={styles.sectionTitle}>Event Type</Text>
      <View style={styles.typeGrid}>
        {EVENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.type}
            style={[
              styles.typeButton,
              eventType === type.type && { borderColor: type.color, backgroundColor: `${type.color}15` },
            ]}
            onPress={() => setEventType(type.type)}
          >
            <View style={[styles.typeIconContainer, { backgroundColor: `${type.color}20` }]}>
              <Ionicons name={type.icon} size={24} color={type.color} />
            </View>
            <Text style={[
              styles.typeLabel,
              eventType === type.type && { color: type.color, fontWeight: fontWeight.semibold },
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.sectionTitle}>Details</Text>
      <View style={styles.card}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.inputIcon}
              placeholder="Add location"
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
      </View>

      {/* Date & Time */}
      <Text style={styles.sectionTitle}>Date & Time</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>All Day</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={allDay ? colors.primary : colors.surface}
          />
        </View>

        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => {
            setPickerMode('date');
            setShowStartPicker(true);
          }}
        >
          <Text style={styles.dateLabel}>Start</Text>
          <View style={styles.dateValue}>
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            {!allDay && (
              <TouchableOpacity
                onPress={() => {
                  setPickerMode('time');
                  setShowStartPicker(true);
                }}
              >
                <Text style={styles.timeText}>{formatTime(startDate)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {!allDay && (
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => {
              setPickerMode('date');
              setShowEndPicker(true);
            }}
          >
            <Text style={styles.dateLabel}>End</Text>
            <View style={styles.dateValue}>
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              <TouchableOpacity
                onPress={() => {
                  setPickerMode('time');
                  setShowEndPicker(true);
                }}
              >
                <Text style={styles.timeText}>{formatTime(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Vaccination Fields */}
      {eventType === 'vaccination' && (
        <>
          <Text style={styles.sectionTitle}>Vaccination Details</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vaccine Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Rabies, DHPP, Bordetella"
                placeholderTextColor={colors.textMuted}
                value={vaccinationType}
                onChangeText={setVaccinationType}
              />
            </View>

            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setShowExpirationPicker(true)}
            >
              <Text style={styles.dateLabel}>Expiration Date</Text>
              <Text style={styles.dateText}>
                {expirationDate ? formatDate(expirationDate) : 'Set date'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Medication Fields */}
      {eventType === 'medication' && (
        <>
          <Text style={styles.sectionTitle}>Medication Details</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Heartgard, Frontline"
                placeholderTextColor={colors.textMuted}
                value={medicationName}
                onChangeText={setMedicationName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1 tablet, 0.5ml"
                placeholderTextColor={colors.textMuted}
                value={dosage}
                onChangeText={setDosage}
              />
            </View>
          </View>
        </>
      )}

      {/* Playdate Invitations */}
      {eventType === 'playdate' && connections.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Invite Connections</Text>
          <View style={styles.card}>
            {connections.map((connection) => (
              <TouchableOpacity
                key={connection.id}
                style={styles.connectionRow}
                onPress={() => toggleConnection(connection.id)}
              >
                <View style={styles.connectionInfo}>
                  <View style={styles.connectionAvatar}>
                    <Ionicons name="person" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={styles.connectionName}>{connection.display_name}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedConnections.includes(connection.id) && styles.checkboxChecked,
                ]}>
                  {selectedConnections.includes(connection.id) && (
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Calendar Sync & Reminders */}
      <Text style={styles.sectionTitle}>Options</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>Add to Phone Calendar</Text>
          </View>
          <Switch
            value={syncToCalendar}
            onValueChange={setSyncToCalendar}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={syncToCalendar ? colors.primary : colors.surface}
          />
        </View>

        <View style={styles.reminderRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>Reminder</Text>
          </View>
          <View style={styles.reminderOptions}>
            {[null, 15, 30, 60].map((mins) => (
              <TouchableOpacity
                key={mins ?? 'none'}
                style={[
                  styles.reminderChip,
                  reminderMinutes === mins && styles.reminderChipActive,
                ]}
                onPress={() => setReminderMinutes(mins)}
              >
                <Text style={[
                  styles.reminderChipText,
                  reminderMinutes === mins && styles.reminderChipTextActive,
                ]}>
                  {mins === null ? 'None' : mins === 60 ? '1hr' : `${mins}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Event'}
        </Text>
      </TouchableOpacity>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) {
              setStartDate(date);
              if (date > endDate) {
                setEndDate(new Date(date.getTime() + 60 * 60 * 1000));
              }
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={startDate}
          onChange={(event, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndDate(date);
          }}
        />
      )}

      {showExpirationPicker && (
        <DateTimePicker
          value={expirationDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowExpirationPicker(Platform.OS === 'ios');
            if (date) setExpirationDate(date);
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    width: '31%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  switchLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dateLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  timeText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  connectionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reminderRow: {
    paddingVertical: spacing.md,
  },
  reminderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  reminderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
  },
  reminderChipActive: {
    backgroundColor: colors.primary,
  },
  reminderChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  reminderChipTextActive: {
    color: colors.textInverse,
  },
});
