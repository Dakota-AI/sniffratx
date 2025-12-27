import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '../../types/database';

const CALENDAR_NAME = 'Sniffr ATX';
const CALENDAR_COLOR = '#F97316'; // Orange primary

/**
 * Request calendar permissions from the user
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if we have calendar permissions
 */
export async function hasCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Get or create the Sniffr ATX calendar on the device
 */
export async function getOrCreateSniffrCalendar(): Promise<string | null> {
  const hasPermission = await hasCalendarPermissions();
  if (!hasPermission) {
    const granted = await requestCalendarPermissions();
    if (!granted) return null;
  }

  // Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Look for existing Sniffr ATX calendar
  const existingCalendar = calendars.find(cal => cal.title === CALENDAR_NAME);
  if (existingCalendar) {
    return existingCalendar.id;
  }

  // Create new calendar
  try {
    let defaultCalendarSource: Calendar.Source | undefined;

    if (Platform.OS === 'ios') {
      // On iOS, find the default calendar source (usually iCloud or Local)
      defaultCalendarSource = calendars.find(
        cal => cal.source?.name === 'iCloud' || cal.source?.name === 'Default'
      )?.source;

      // Fallback to any available source
      if (!defaultCalendarSource && calendars.length > 0) {
        defaultCalendarSource = calendars[0].source;
      }
    }

    const newCalendarId = await Calendar.createCalendarAsync({
      title: CALENDAR_NAME,
      color: CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource?.id,
      source: Platform.OS === 'android' ? {
        isLocalAccount: true,
        name: CALENDAR_NAME,
        type: Calendar.SourceType.LOCAL,
      } : undefined,
      name: CALENDAR_NAME,
      ownerAccount: Platform.OS === 'android' ? 'Sniffr ATX' : undefined,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  } catch (error) {
    console.error('Error creating calendar:', error);
    return null;
  }
}

/**
 * Create an event in the native calendar
 */
export async function createNativeEvent(
  event: CalendarEvent
): Promise<string | null> {
  const calendarId = await getOrCreateSniffrCalendar();
  if (!calendarId) return null;

  try {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time
      ? new Date(event.end_time)
      : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

    const eventDetails: Calendar.Event = {
      title: event.title,
      startDate,
      endDate,
      allDay: event.all_day,
      location: event.location || undefined,
      notes: event.description || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const nativeEventId = await Calendar.createEventAsync(calendarId, eventDetails);
    return nativeEventId;
  } catch (error) {
    console.error('Error creating native event:', error);
    return null;
  }
}

/**
 * Update an event in the native calendar
 */
export async function updateNativeEvent(
  nativeEventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    const startDate = new Date(event.start_time);
    const endDate = event.end_time
      ? new Date(event.end_time)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    await Calendar.updateEventAsync(nativeEventId, {
      title: event.title,
      startDate,
      endDate,
      allDay: event.all_day,
      location: event.location || undefined,
      notes: event.description || undefined,
    });
    return true;
  } catch (error) {
    console.error('Error updating native event:', error);
    return false;
  }
}

/**
 * Delete an event from the native calendar
 */
export async function deleteNativeEvent(nativeEventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(nativeEventId);
    return true;
  } catch (error) {
    console.error('Error deleting native event:', error);
    return false;
  }
}

/**
 * Add a reminder/alarm to an event
 */
export async function addEventReminder(
  nativeEventId: string,
  minutesBefore: number
): Promise<boolean> {
  try {
    // Get the event first to update it with alarms
    const event = await Calendar.getEventAsync(nativeEventId);
    if (!event) return false;

    const calendarId = await getOrCreateSniffrCalendar();
    if (!calendarId) return false;

    await Calendar.updateEventAsync(nativeEventId, {
      alarms: [
        { relativeOffset: -minutesBefore }, // Negative = before event
      ],
    });
    return true;
  } catch (error) {
    console.error('Error adding reminder:', error);
    return false;
  }
}
