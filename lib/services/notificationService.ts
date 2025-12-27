import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save token to database
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'fd2f8973-82b6-4841-9dfa-491e63fe061a', // From app.json
    });
    const token = tokenData.data;

    // Save token to database
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Save push token to database
 */
async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const platform = Platform.OS as 'ios' | 'android';

  // Upsert the token (insert or update if exists)
  await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform,
      },
      {
        onConflict: 'user_id,token',
      }
    );
}

/**
 * Schedule a local notification for an event reminder
 */
export async function scheduleEventReminder(
  eventId: string,
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> {
  // Don't schedule if date is in the past
  if (triggerDate <= new Date()) {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { eventId, type: 'event_reminder' },
        sound: true,
      },
      trigger: {
        date: triggerDate,
      },
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Schedule a reminder X minutes before an event
 */
export async function scheduleReminderBeforeEvent(
  eventId: string,
  eventTitle: string,
  eventStartTime: Date,
  minutesBefore: number
): Promise<string | null> {
  const reminderTime = new Date(eventStartTime.getTime() - minutesBefore * 60 * 1000);

  const timeText = minutesBefore >= 60
    ? `${Math.floor(minutesBefore / 60)} hour${minutesBefore >= 120 ? 's' : ''}`
    : `${minutesBefore} minutes`;

  return scheduleEventReminder(
    eventId,
    `Upcoming: ${eventTitle}`,
    `Starting in ${timeText}`,
    reminderTime
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications for an event
 */
export async function cancelEventNotifications(eventId: string): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.eventId === eventId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Send an immediate local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
}

/**
 * Schedule vaccination expiry alert
 */
export async function scheduleVaccinationAlert(
  eventId: string,
  vaccineName: string,
  expirationDate: Date,
  daysBeforeAlert: number = 30
): Promise<string | null> {
  const alertDate = new Date(expirationDate);
  alertDate.setDate(alertDate.getDate() - daysBeforeAlert);

  // Don't schedule if alert date is in the past
  if (alertDate <= new Date()) {
    return null;
  }

  return scheduleEventReminder(
    eventId,
    `Vaccination Expiring Soon`,
    `${vaccineName} expires in ${daysBeforeAlert} days. Time to schedule a vet visit!`,
    alertDate
  );
}

/**
 * Get the notification response listener (for handling taps on notifications)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification received listener (for foreground notifications)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
